-- Vector similarity search function for the RAG retrieval pipeline
-- Called via supabaseAdmin.rpc('match_documents', { ... })
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding  vector(3072),
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
