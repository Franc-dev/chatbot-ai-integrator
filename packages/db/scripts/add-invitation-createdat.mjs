import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
await prisma.$executeRawUnsafe(
  `ALTER TABLE "invitation" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
);
console.log("invitation.createdAt added");
await prisma.$disconnect();
