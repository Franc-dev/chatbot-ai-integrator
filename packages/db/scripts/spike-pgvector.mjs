import { prisma } from "./client.mjs";

async function main() {
  const ext = await prisma.$queryRaw`SELECT extname FROM pg_extension WHERE extname = 'vector'`;
  console.log("extensions:", ext);
  await prisma.$executeRawUnsafe("CREATE EXTENSION IF NOT EXISTS vector");
  const after = await prisma.$queryRaw`SELECT extname FROM pg_extension WHERE extname = 'vector'`;
  console.log("after create:", after);
  const probe = await prisma.$queryRaw`SELECT '[1,2,3]'::vector <-> '[1,2,4]'::vector AS dist`;
  console.log("distance:", probe);
}

main()
  .catch((err) => {
    console.error("SPIKE_FAIL", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
