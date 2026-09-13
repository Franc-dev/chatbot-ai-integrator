import { prisma, Prisma } from "@signal/db";
import { chunkText } from "./chunk";

export async function handleIngestSource(payload: { sourceId: string }) {
  const source = await prisma.knowledgeSource.findUnique({ where: { id: payload.sourceId } });
  if (!source) throw new Error("Source missing");

  await prisma.knowledgeSource.update({
    where: { id: source.id },
    data: { status: "processing" },
  });

  let text = "";
  if (source.kind === "url" && source.uri) {
    const res = await fetch(source.uri, { redirect: "follow" });
    text = stripHtml(await res.text());
  } else if (source.kind === "sitemap" && source.uri) {
    const res = await fetch(source.uri);
    const xml = await res.text();
    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]!).slice(0, 20);
    const pages = await Promise.all(
      urls.map(async (u) => {
        try {
          const r = await fetch(u);
          return stripHtml(await r.text());
        } catch {
          return "";
        }
      }),
    );
    text = pages.join("\n\n");
  } else {
    text = source.uri ?? "";
  }

  const chunks = chunkText(text);
  await prisma.knowledgeChunk.deleteMany({ where: { sourceId: source.id } });
  if (chunks.length) {
    await prisma.knowledgeChunk.createMany({
      data: chunks.map((content) => ({
        sourceId: source.id,
        orgId: source.orgId,
        content,
      })),
    });
  }

  await prisma.knowledgeSource.update({
    where: { id: source.id },
    data: { status: "ready", chunkCount: chunks.length, error: null },
  });
}

export async function handleUsageRollup() {
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "UsageDaily" (id, "orgId", day, messages, "inputTokens", "outputTokens", "costMicros", errors)
    SELECT
      concat('ud_', "orgId", '_', to_char(date_trunc('day', "createdAt"), 'YYYYMMDD')),
      "orgId",
      date_trunc('day', "createdAt")::date,
      count(*)::int,
      coalesce(sum("inputTokens"), 0)::int,
      coalesce(sum("outputTokens"), 0)::int,
      coalesce(sum("costMicros"), 0)::bigint,
      count(*) FILTER (WHERE status <> 'ok')::int
    FROM "UsageEvent"
    WHERE "createdAt" >= date_trunc('day', now() - interval '2 day')
    GROUP BY "orgId", date_trunc('day', "createdAt")
    ON CONFLICT ("orgId", day) DO UPDATE SET
      messages = EXCLUDED.messages,
      "inputTokens" = EXCLUDED."inputTokens",
      "outputTokens" = EXCLUDED."outputTokens",
      "costMicros" = EXCLUDED."costMicros",
      errors = EXCLUDED.errors
  `);
}

export async function handleCatalogSync() {
  const seeds = [
    { provider: "openai", modelId: "gpt-4.1-mini", displayName: "GPT-4.1 mini", inputPerMToken: 400_000, outputPerMToken: 1_600_000, contextWindow: 1_047_576 },
    { provider: "openai", modelId: "gpt-4.1", displayName: "GPT-4.1", inputPerMToken: 2_000_000, outputPerMToken: 8_000_000, contextWindow: 1_047_576 },
    { provider: "anthropic", modelId: "claude-sonnet-4.6", displayName: "Claude Sonnet 4.6", inputPerMToken: 3_000_000, outputPerMToken: 15_000_000, contextWindow: 200_000 },
    { provider: "openrouter", modelId: "openai/gpt-4.1-mini", displayName: "OpenRouter · GPT-4.1 mini", inputPerMToken: 400_000, outputPerMToken: 1_600_000, contextWindow: 1_047_576 },
    { provider: "vercel-gateway", modelId: "openai/gpt-4.1-mini", displayName: "Gateway · GPT-4.1 mini", inputPerMToken: 400_000, outputPerMToken: 1_600_000, contextWindow: 1_047_576 },
    { provider: "zai", modelId: "glm-4.6", displayName: "GLM-4.6", inputPerMToken: 600_000, outputPerMToken: 2_000_000, contextWindow: 200_000 },
  ];
  for (const seed of seeds) {
    await prisma.modelCatalog.upsert({
      where: { provider_modelId: { provider: seed.provider, modelId: seed.modelId } },
      create: seed,
      update: seed,
    });
  }
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
