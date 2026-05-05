const EMBEDDING_MODEL = "gemini-embedding-2-preview";
const EMBEDDING_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";
const OUTPUT_DIMENSIONALITY = 768;
const BATCH_SIZE = 20;
const RATE_LIMIT_DELAY_MS = 300;

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");

  const url = `${EMBEDDING_API_BASE}/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: { parts: [{ text }] },
      outputDimensionality: OUTPUT_DIMENSIONALITY,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Embedding API ${res.status}: ${detail}`);
  }

  const data = await res.json();
  return data.embedding.values as number[];
}

export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<number[][]> {
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const batchEmbeddings = await Promise.all(
      batch.map((text) => generateEmbedding(text))
    );
    allEmbeddings.push(...batchEmbeddings);

    if (i + BATCH_SIZE < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
    }
  }

  return allEmbeddings;
}

export function formatEmbeddingForPg(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
