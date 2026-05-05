-- Drop existing function (return type changed — cannot use CREATE OR REPLACE)
DROP FUNCTION IF EXISTS match_documents(vector(768), float, int, text);

-- Recreate match_documents with file_name in the return type for citations
CREATE FUNCTION match_documents(
  query_embedding  vector(768),
  match_threshold  float,
  match_count      int,
  p_hotel_id       text
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
  WHERE d.hotel_id    = p_hotel_id
    AND d.status      = 'ready'
    AND ds.embedding  IS NOT NULL
    AND 1 - (ds.embedding <=> query_embedding) >= match_threshold
  ORDER BY ds.embedding <=> query_embedding
  LIMIT match_count;
$$;
