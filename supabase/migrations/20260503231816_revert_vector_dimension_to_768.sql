-- Revert embedding dimension from 3072 back to 768
-- gemini-embedding-2-preview is configured with outputDimensionality: 768
ALTER TABLE "document_sections" ALTER COLUMN "embedding" TYPE vector(768);

-- Recreate the IVFFlat index (768 <= 2000 dimension limit, so indexing is supported)
CREATE INDEX "document_sections_embedding_idx"
  ON "document_sections"
  USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 100);
