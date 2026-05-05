import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAuthClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hotelId = request.nextUrl.searchParams.get("hotelId");
    if (!hotelId) {
      return NextResponse.json({ error: "hotelId is required" }, { status: 400 });
    }

    // Verify ownership
    const { data: hotel } = await supabaseAdmin
      .from("hotels")
      .select("id, name")
      .eq("id", hotelId)
      .eq("owner_id", user.id)
      .single();

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    // Get session IDs for this hotel
    const { data: sessions } = await supabaseAdmin
      .from("chat_sessions")
      .select("id")
      .eq("hotel_id", hotelId);

    const sessionIds = (sessions ?? []).map((s: { id: string }) => s.id);

    if (sessionIds.length === 0) {
      return NextResponse.json({
        topics: [],
        summary: "No chat sessions yet. Insights will appear once guests start chatting.",
        totalAnalyzed: 0,
      });
    }

    // Get last 50 user messages
    const { data: recentMessages } = await supabaseAdmin
      .from("chat_messages")
      .select("content")
      .in("session_id", sessionIds)
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(50);

    const userQuestions = (recentMessages ?? []).map(
      (m: { content: string }) => m.content
    );

    if (userQuestions.length === 0) {
      return NextResponse.json({
        topics: [],
        summary: "No guest messages found yet.",
        totalAnalyzed: 0,
      });
    }

    // Use Gemini to analyze topics
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    let topics: string[] = [];
    let summary = "";

    if (apiKey && userQuestions.length >= 2) {
      try {
        const prompt = `Analyze these recent guest questions from a hotel AI assistant and identify the top 3 topics guests are asking about. Be concise.

Guest questions:
${userQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Respond in this exact JSON format (no markdown, no code fences):
{"topics":["Topic 1","Topic 2","Topic 3"],"summary":"One sentence summary of what guests care most about."}`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const text =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          // Parse JSON from response (handle potential markdown fences)
          const cleaned = text.replace(/```json\s*|```\s*/g, "").trim();
          const parsed = JSON.parse(cleaned);
          topics = parsed.topics ?? [];
          summary = parsed.summary ?? "";
        }
      } catch (err) {
        console.error("[insights] Gemini analysis failed:", err);
        // Fallback: just return raw data
        summary = `Analyzed ${userQuestions.length} recent guest messages.`;
      }
    } else {
      summary = `${userQuestions.length} guest message(s) recorded. Need more data for AI insights.`;
    }

    return NextResponse.json({
      topics,
      summary,
      totalAnalyzed: userQuestions.length,
    });
  } catch (err) {
    console.error("[insights] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
