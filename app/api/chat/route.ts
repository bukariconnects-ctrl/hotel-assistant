import { NextRequest } from "next/server";
import { GoogleGenerativeAIStream, StreamingTextResponse } from "ai";
import { getGenAI } from "@/lib/ai/google-ai";
import { getRelevantContext, buildContextBlock, getUniqueSourceFiles } from "@/lib/ai/retrieval-service";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

const CHAT_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
] as const;

class AllModelsQuotaExceededError extends Error {
  constructor() {
    super("QUOTA_EXCEEDED");
    this.name = "AllModelsQuotaExceededError";
  }
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type GeminiHistory = Array<{ role: string; parts: Array<{ text: string }> }>;

function buildSystemPrompt(hotelName: string, context: string, sourceFiles: string[]): string {
  const sourcesInstruction = sourceFiles.length > 0
    ? `\n6. At the very end of your response, on a new line, append the sources you used in exactly this format:\n[Sources: ${sourceFiles.join(", ")}]\n   Only include source files that were actually relevant to your answer. If you didn't use any source, do NOT add a Sources line.`
    : "";

  return `You are a helpful and friendly AI Guest Assistant for "${hotelName}".
Your role is to help hotel guests with their questions and inquiries.

STRICT RULES:
1. Answer questions ONLY based on the provided context below.
2. Be warm, professional, and concise in your responses.
3. If the answer is not in the context, say exactly: "I'm sorry, I don't have that information available. Please contact our front desk team — they'll be happy to assist you."
4. Never invent information, prices, or policies not explicitly stated in the context.
5. Respond in the same language the guest used.${sourcesInstruction}

--- HOTEL KNOWLEDGE BASE ---
${context || "No specific context available for this query."}
--- END OF KNOWLEDGE BASE ---`;
}

function isFallbackableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /404|429|503|not found|overloaded|quota|RESOURCE_EXHAUSTED/i.test(msg);
}

async function callGeminiWithFallback(
  systemPrompt: string,
  history: GeminiHistory,
  userMessage: string
): Promise<ReadableStream> {
  let lastError: unknown;
  let allFailuresAreQuota = true;

  for (const modelName of CHAT_MODELS) {
    try {
      const model = getGenAI().getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
      });
      const chat = model.startChat({ history });
      const result = await chat.sendMessageStream(userMessage);
      console.log(`[chat] Responding with model: ${modelName}`);
      return GoogleGenerativeAIStream(result);
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isQuota = /429|RESOURCE_EXHAUSTED|quota/i.test(msg);
      if (!isQuota) allFailuresAreQuota = false;
      if (isFallbackableError(err)) {
        console.warn(`[chat] ${modelName} unavailable (${isQuota ? "quota" : "error"}) — trying next model`);
        continue;
      }
      throw err;
    }
  }

  if (allFailuresAreQuota) throw new AllModelsQuotaExceededError();
  throw lastError ?? new Error("All chat models unavailable");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      messages: ChatMessage[];
      hotelId?: string;
      slug?: string;
      sessionId?: string;
    };
    const { messages, slug, sessionId: existingSessionId } = body;
    let { hotelId } = body;

    if (!messages?.length || (!hotelId && !slug)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: messages and (hotelId or slug)" }),
        { status: 400 }
      );
    }

    // Resolve slug to hotelId if needed
    let hotelQuery = supabaseAdmin.from("hotels").select("id, name, welcome_message");
    if (slug) {
      hotelQuery = hotelQuery.eq("slug", slug);
    } else {
      hotelQuery = hotelQuery.eq("id", hotelId!);
    }
    const { data: hotel, error: hotelError } = await hotelQuery.single();

    if (hotelError || !hotel) {
      return new Response(
        JSON.stringify({ error: `Hotel not found: ${slug || hotelId}` }),
        { status: 404 }
      );
    }

    const resolvedHotelId = hotel.id;

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMessage) {
      return new Response(
        JSON.stringify({ error: "No user message found" }),
        { status: 400 }
      );
    }

    const contextChunks = await getRelevantContext(
      lastUserMessage.content,
      resolvedHotelId,
      5,
      0.25
    );
    const contextBlock = buildContextBlock(contextChunks);
    const sourceFiles = getUniqueSourceFiles(contextChunks);
    const systemPrompt = buildSystemPrompt(hotel.name, contextBlock, sourceFiles);

    const geminiHistory: GeminiHistory = messages.slice(0, -1).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    // ── Persistence: create/reuse session & save user message ──
    let sessionId = existingSessionId;
    if (!sessionId) {
      const { data: session } = await supabaseAdmin
        .from("chat_sessions")
        .insert({
          id: crypto.randomUUID(),
          hotel_id: resolvedHotelId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      sessionId = session?.id;
    } else {
      // Touch updated_at
      await supabaseAdmin
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);
    }

    // Save user message
    if (sessionId) {
      await supabaseAdmin.from("chat_messages").insert({
        id: crypto.randomUUID(),
        session_id: sessionId,
        role: "user",
        content: lastUserMessage.content,
        created_at: new Date().toISOString(),
      });
    }

    const capturedSessionId = sessionId;
    const stream = await callGeminiWithFallback(
      systemPrompt,
      geminiHistory,
      lastUserMessage.content
    );

    // Wrap stream to capture AI response and save it
    const [browserStream, saveStream] = stream.tee();
    // Read saveStream in background to capture full response
    (async () => {
      try {
        const reader = saveStream.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
        }
        if (capturedSessionId && fullText.trim()) {
          await supabaseAdmin.from("chat_messages").insert({
            id: crypto.randomUUID(),
            session_id: capturedSessionId,
            role: "assistant",
            content: fullText,
            created_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error("[chat] Failed to save AI response:", err);
      }
    })();

    const response = new StreamingTextResponse(browserStream);
    if (capturedSessionId) {
      response.headers.set("x-session-id", capturedSessionId);
    }
    return response;
  } catch (error) {
    if (error instanceof AllModelsQuotaExceededError) {
      console.warn("[chat] All models quota-exhausted — returning QUOTA_EXCEEDED");
      return new Response(
        JSON.stringify({
          error: "QUOTA_EXCEEDED",
          message: "تجاوزت حد الطلبات المجانية، يرجى المحاولة بعد قليل.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("[chat] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
