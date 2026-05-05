-- Drop the existing IVFFlat index (only supports ≤2000 dimensions; 3072 exceeds the limit)
DROP INDEX IF EXISTS "document_sections_embedding_idx";

-- Change embedding dimension from 768 to 3072 to match gemini-embedding-2-preview output
ALTER TABLE "document_sections" ALTER COLUMN "embedding" TYPE vector(3072);

-- NOTE: pgvector IVFFlat and HNSW indexes both have a hard 2000-dimension limit.
-- For 3072-dim vectors, cosine search uses a sequential scan via the <=> operator.
-- This is acceptable for development. For production scale, consider:
-- 1. Dimensionality reduction before storage, or
-- 2. Upgrading to a pgvector build that supports higher-dim HNSW.
