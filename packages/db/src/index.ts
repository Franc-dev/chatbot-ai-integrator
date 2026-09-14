import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrisma() {
  return new PrismaClient({
    // The generator runs engine-less, so node-postgres owns the pool. Keep it
    // small: every warm serverless instance holds its own.
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 3 }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

// Cached in every environment, otherwise each warm invocation opens a new pool.
export const prisma = globalForPrisma.prisma ?? createPrisma();
globalForPrisma.prisma = prisma;

export function forOrg<T extends { orgId: string }>(orgId: string) {
  return { orgId } satisfies Pick<T, "orgId">;
}

export {
  readCredentialModelsByOrg,
  readCustomCredentialModels,
  writeCredentialModels,
} from "./credential-models";
export { Prisma, PrismaClient } from "@prisma/client";
export type {
  Agent,
  Organization,
  OrganizationProfile,
  ProviderCredential,
  KnowledgeSource,
  KnowledgeChunk,
  Conversation,
  Message,
  UsageEvent,
  UsageDaily,
  Tool,
  Job,
  PublishableKey,
} from "@prisma/client";
