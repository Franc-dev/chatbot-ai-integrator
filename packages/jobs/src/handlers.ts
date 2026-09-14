import { prisma, Prisma } from "@signal/db";
import { assertSafeUrl } from "@signal/core";
import { chunkText } from "./chunk";
import { extractTextFromHtml } from "./html";

export async function handleIngestSource(payload: { sourceId: string }) {
  const source = await prisma.knowledgeSource.findUnique({ where: { id: payload.sourceId } });
  if (!source) throw new Error("Source missing");

  await prisma.knowledgeSource.update({
    where: { id: source.id },
    data: { status: "processing", error: null },
  });

  try {
    const text = await loadSourceText(source);
    const chunks = chunkText(text);
    if (!chunks.length) {
      throw new Error(
        source.kind === "url" || source.kind === "sitemap"
          ? "This page returned almost no text. If it is a JavaScript site, paste the copy as notes instead."
          : "No text to index.",
      );
    }

    await prisma.knowledgeChunk.deleteMany({ where: { sourceId: source.id } });
    await prisma.knowledgeChunk.createMany({
      data: chunks.map((content) => ({
        sourceId: source.id,
        orgId: source.orgId,
        content,
      })),
    });

    await prisma.knowledgeSource.update({
      where: { id: source.id },
      data: { status: "ready", chunkCount: chunks.length, error: null },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ingest failed";
    await prisma.knowledgeSource.update({
      where: { id: source.id },
      data: { status: "error", error: message, chunkCount: 0 },
    });
    throw err;
  }
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
    { provider: "google", modelId: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash", inputPerMToken: 300_000, outputPerMToken: 2_500_000, contextWindow: 1_048_576 },
    { provider: "google", modelId: "gemini-2.0-flash", displayName: "Gemini 2.0 Flash", inputPerMToken: 100_000, outputPerMToken: 400_000, contextWindow: 1_048_576 },
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

async function loadSourceText(source: { kind: string; uri: string | null }) {
  if (source.kind === "url") {
    if (!source.uri) throw new Error("This source has no URL to fetch.");
    return extractTextFromHtml(await fetchHtml(source.uri));
  }
  if (source.kind === "sitemap") {
    if (!source.uri) throw new Error("This source has no sitemap URL.");
    const xml = await fetchHtml(source.uri);
    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]!).slice(0, 20);
    if (!urls.length) throw new Error("Sitemap had no <loc> entries.");
    const pages = await Promise.all(
      urls.map(async (u) => {
        try {
          return extractTextFromHtml(await fetchHtml(u));
        } catch {
          return "";
        }
      }),
    );
    return pages.join("\n\n");
  }
  return source.uri ?? "";
}

async function fetchHtml(uri: string) {
  await assertSafeUrl(uri);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(uri, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
        "user-agent": "SignalConsoleBot/1.0 (knowledge ingest)",
      },
    });
    if (!res.ok) throw new Error(`Could not fetch the page (${res.status}).`);
    return await res.text();
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Timed out fetching the page.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
