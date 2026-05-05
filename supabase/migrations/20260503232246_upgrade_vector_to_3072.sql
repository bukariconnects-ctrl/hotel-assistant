-- Drop the IVFFlat index (only supports ≤2000 dimensions)
DROP INDEX IF EXISTS "document_sections_embedding_idx";

-- Upgrade embedding dimension to 3072 (full gemini-embedding-2-preview output)
ALTER TABLE "document_sections" ALTER COLUMN "embedding" TYPE vector(3072);

-- NOTE: pgvector cannot index vectors with >2000 dimensions via IVFFlat or HNSW.
-- Cosine similarity search uses sequential scan for 3072-dim vectors.
-- This is acceptable for development; for production consider dimensionality reduction.
