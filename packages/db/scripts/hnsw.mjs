import { prisma } from "./client.mjs";

await prisma.$executeRawUnsafe(`
  CREATE INDEX IF NOT EXISTS knowledge_chunk_embedding_hnsw
  ON "KnowledgeChunk"
  USING hnsw (embedding vector_cosine_ops)
`);
console.log("hnsw ok");
await prisma.$disconnect();
