import { supabaseAdmin } from "@/lib/supabase";
import { generateEmbedding } from "./embedding-service";

export interface RetrievedChunk {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
  file_name?: string;
}

export async function getRelevantContext(
  query: string,
  orgId: string,
  topK: number = 5,
  similarityThreshold: number = 0.3
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await generateEmbedding(query);

  const { data, error } = await supabaseAdmin.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_threshold: similarityThreshold,
    match_count: topK,
    p_org_id: orgId,
  });

  if (error) {
    console.error("[retrieval] match_documents RPC error:", error);
    return [];
  }

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    content: r.content as string,
    metadata: (r.metadata ?? {}) as Record<string, unknown>,
    similarity: Number(r.similarity),
    file_name: (r.file_name as string) || undefined,
  }));
}

export function buildContextBlock(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "";
  return chunks
    .map((c, i) => {
      const src = c.file_name ? ` (from: ${c.file_name})` : "";
      return `[Source ${i + 1}${src}]\n${c.content}`;
    })
    .join("\n\n---\n\n");
}

export function getUniqueSourceFiles(chunks: RetrievedChunk[]): string[] {
  const names = new Set<string>();
  for (const c of chunks) {
    if (c.file_name) names.add(c.file_name);
  }
  return Array.from(names);
}
