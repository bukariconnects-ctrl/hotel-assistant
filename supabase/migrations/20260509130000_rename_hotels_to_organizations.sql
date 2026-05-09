-- ============================================================
-- Migration: Rename hotels → organizations, hotel_id → org_id
-- Adds 'category' column to the organizations table
-- Updates match_documents function to use org_id
-- ============================================================

-- 1. Rename the table
ALTER TABLE "hotels" RENAME TO "organizations";

-- 2. Add category column (default 'general', backfill existing rows as 'hotel')
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'general';
UPDATE "organizations" SET "category" = 'hotel' WHERE "category" = 'general';

-- 3. Rename foreign key columns in child tables
ALTER TABLE "documents" RENAME COLUMN "hotel_id" TO "org_id";
ALTER TABLE "chat_sessions" RENAME COLUMN "hotel_id" TO "org_id";

-- 4. Update storage_path references (cosmetic, not breaking)
-- No change needed — storage_path is just a string field

-- 5. Drop old match_documents function and recreate with org_id parameter
DROP FUNCTION IF EXISTS match_documents(vector(768), float, int, text);

CREATE FUNCTION match_documents(
  query_embedding  vector(768),
  match_threshold  float,
  match_count      int,
  p_org_id         text
)
RETURNS TABLE (
  id         text,
  content    text,
  metadata   jsonb,
  similarity float,
  file_name  text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ds.id,
    ds.content,
    ds.metadata,
    1 - (ds.embedding <=> query_embedding) AS similarity,
    d.file_name
  FROM "document_sections" ds
  JOIN "documents" d ON d.id = ds.document_id
  WHERE d.org_id       = p_org_id
    AND d.status       = 'ready'
    AND ds.embedding   IS NOT NULL
    AND 1 - (ds.embedding <=> query_embedding) >= match_threshold
  ORDER BY ds.embedding <=> query_embedding
  LIMIT match_count;
$$;
