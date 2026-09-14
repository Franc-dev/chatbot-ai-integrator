import { prisma } from "./client.mjs";

await prisma.$executeRawUnsafe(
  `ALTER TABLE "invitation" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
);
console.log("invitation.createdAt added");
await prisma.$disconnect();
