-- Revert embedding column to vector(768) to match outputDimensionality: 768
-- gemini-embedding-2-preview with MRL-scaling produces 768-dim vectors

-- Drop existing index (3072 dims, cannot be indexed)
DROP INDEX IF EXISTS "document_sections_embedding_idx";

-- NULL out existing 3072-dim vectors — PostgreSQL cannot cast between different vector dimensions.
-- Documents must be re-uploaded to regenerate 768-dim embeddings.
UPDATE "document_sections" SET "embedding" = NULL;

-- Mark affected documents as needing re-processing
UPDATE "documents" SET "status" = 'pending' WHERE "id" IN (
  SELECT DISTINCT "document_id" FROM "document_sections"
);

-- Revert column type to 768 dimensions (now safe — all values are NULL)
ALTER TABLE "document_sections" ALTER COLUMN "embedding" TYPE vector(768);

-- Recreate IVFFlat index (768 ≤ 2000 dimension limit — indexing is supported again)
CREATE INDEX "document_sections_embedding_idx"
  ON "document_sections"
  USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 100);

-- Update match_documents function to accept vector(768)
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding  vector(768),
  match_threshold  float,
  match_count      int,
  p_hotel_id       text
)
RETURNS TABLE (
  id         text,
  content    text,
  metadata   jsonb,
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ds.id,
    ds.content,
    ds.metadata,
    1 - (ds.embedding <=> query_embedding) AS similarity
  FROM "document_sections" ds
  JOIN "documents" d ON d.id = ds.document_id
  WHERE d.hotel_id    = p_hotel_id
    AND d.status      = 'ready'
    AND ds.embedding  IS NOT NULL
    AND 1 - (ds.embedding <=> query_embedding) >= match_threshold
  ORDER BY ds.embedding <=> query_embedding
  LIMIT match_count;
$$;
