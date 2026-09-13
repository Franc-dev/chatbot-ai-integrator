-- Applied via prisma db push during local prisma dev.
-- On hosted Prisma Postgres: prisma migrate deploy
-- Then:
CREATE INDEX IF NOT EXISTS knowledge_chunk_embedding_hnsw
ON "KnowledgeChunk"
USING hnsw (embedding vector_cosine_ops);
