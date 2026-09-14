import { Prisma } from "@prisma/client";
import { prisma } from "./index";

export async function readCustomCredentialModels(orgId: string) {
  return prisma.$queryRaw<Array<{ id: string; label: string; models: string[] }>>`
    SELECT id, label, COALESCE(models, ARRAY[]::text[]) AS models
    FROM "ProviderCredential"
    WHERE "orgId" = ${orgId} AND provider = 'custom'
    ORDER BY "createdAt" ASC
  `;
}

export async function readCredentialModelsByOrg(orgId: string) {
  const rows = await prisma.$queryRaw<Array<{ id: string; models: string[] }>>`
    SELECT id, COALESCE(models, ARRAY[]::text[]) AS models
    FROM "ProviderCredential"
    WHERE "orgId" = ${orgId}
  `;
  return new Map(rows.map((row) => [row.id, row.models ?? []]));
}

export async function writeCredentialModels(id: string, models: string[]) {
  const value =
    models.length === 0
      ? Prisma.sql`ARRAY[]::text[]`
      : Prisma.sql`ARRAY[${Prisma.join(models)}]::text[]`;
  await prisma.$executeRaw`
    UPDATE "ProviderCredential" SET models = ${value} WHERE id = ${id}
  `;
}
