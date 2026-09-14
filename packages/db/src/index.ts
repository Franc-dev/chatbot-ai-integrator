import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

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
