import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateEmbeddingsBatch } from "@/lib/ai/embedding-service";
import { chunkText } from "@/lib/ai/text-chunker";

export const runtime = "nodejs";
export const maxDuration = 300;

const SECTION_INSERT_BATCH = 50;

async function setDocumentStatus(id: string, status: string) {
  await supabaseAdmin
    .from("documents")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function POST(request: NextRequest) {
  let documentId: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const orgId = formData.get("orgId") as string | null;
    const category = (formData.get("category") as string | null) || "General";

    if (!file || !orgId) {
      return NextResponse.json(
        { error: "Missing required fields: file and orgId" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .select("id, name")
      .eq("id", orgId)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: `Organization not found: ${orgId}` },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const { data: document, error: docError } = await supabaseAdmin
      .from("documents")
      .insert({
        id: crypto.randomUUID(),
        org_id: orgId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: `orgs/${orgId}/documents/${Date.now()}_${file.name}`,
        status: "processing",
        category,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (docError || !document) {
      console.error("[upload] Failed to create document record:", docError);
      return NextResponse.json(
        { error: "Failed to create document record" },
        { status: 500 }
      );
    }
    documentId = document.id as string;

    const buffer = Buffer.from(await file.arrayBuffer());

    // eslint-disable-next-line
    const pdfParse = require("pdf-parse/lib/pdf-parse.js");
    const pdfData = await pdfParse(buffer);
    const rawText: string = pdfData.text;

    if (!rawText || rawText.trim().length === 0) {
      await setDocumentStatus(documentId, "error");
      return NextResponse.json(
        { error: "Could not extract text from PDF. The file may be image-based or encrypted." },
        { status: 422 }
      );
    }

    const chunks = chunkText(rawText, { chunkSize: 800, chunkOverlap: 150 });

    if (chunks.length === 0) {
      await setDocumentStatus(documentId, "error");
      return NextResponse.json(
        { error: "No processable text chunks found in PDF." },
        { status: 422 }
      );
    }

    const chunkContents = chunks.map((c) => c.content);
    const embeddings = await generateEmbeddingsBatch(chunkContents);

    const allSections = chunks.map((chunk, i) => ({
      id: crypto.randomUUID(),
      document_id: documentId as string,
      content: chunk.content,
      metadata: {
        chunkIndex: chunk.index,
        startChar: chunk.startChar,
        endChar: chunk.endChar,
        fileName: file.name,
        orgId,
      },
      embedding: embeddings[i],
    }));

    for (let i = 0; i < allSections.length; i += SECTION_INSERT_BATCH) {
      const batch = allSections.slice(i, i + SECTION_INSERT_BATCH);
      const { error: insertError } = await supabaseAdmin
        .from("document_sections")
        .insert(batch);

      if (insertError) {
        console.error("[upload] Batch insert error:", insertError);
        await setDocumentStatus(documentId, "error");
        return NextResponse.json(
          { error: `Failed to save chunks: ${insertError.message}` },
          { status: 500 }
        );
      }
    }

    await setDocumentStatus(documentId, "ready");

    return NextResponse.json({
      success: true,
      documentId,
      fileName: file.name,
      chunksProcessed: chunks.length,
      totalCharacters: rawText.length,
    });
  } catch (error) {
    console.error("[upload] Pipeline error:", error);

    if (documentId) {
      await setDocumentStatus(documentId, "error").catch(() => {});
    }

    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
