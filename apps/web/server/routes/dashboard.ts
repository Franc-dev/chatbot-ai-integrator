import { Hono } from "hono";
import {
  prisma,
  forOrg,
  Prisma,
  readCredentialModelsByOrg,
  readCustomCredentialModels,
  writeCredentialModels,
} from "@signal/db";
import { z } from "zod";
import {
  createAgentSchema,
  createCredentialSchema,
  createKnowledgeSchema,
  createToolSchema,
  modelsForCustomCredential,
  parsedModelIds,
  rotateCredentialSchema,
  updateAgentSchema,
  updateCredentialSchema,
} from "@signal/contract";
import {
  decodeMasterKey,
  DEFAULT_BUILTIN_TOOLS,
  getEnv,
  resolveBuiltinTools,
  sealSecret,
  withBuiltinTools,
  withWidgetTheme,
  ZAI_URLS,
} from "@signal/core";
import { enqueue } from "@signal/jobs";
import { waitUntil } from "@vercel/functions";
import { deny, ensureWidgetAgent, sessionOrg } from "../authz";
import { createHash, randomBytes } from "node:crypto";
import { handleChat } from "./chat";

export const dashboard = new Hono()
  .use("*", async (c, next) => {
    const ctx = await sessionOrg(c);
    if (!ctx) return deny(c, "unauthorized", "Sign in and select an organization");
    c.set("org" as never, ctx as never);
    await next();
  });

function org(c: { get: (key: string) => unknown }) {
  return c.get("org") as { orgId: string; userId: string };
}

function themeJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

dashboard.post("/chat", async (c) => {
  const { orgId } = org(c);
  return handleChat(c, orgId, "playground");
});

dashboard.get("/me", async (c) => {
  const { orgId } = org(c);
  const profile =
    (await prisma.organizationProfile.findUnique({ where: { organizationId: orgId } })) ??
    (await prisma.organizationProfile.create({ data: { organizationId: orgId } }));
  if ((await prisma.modelCatalog.count()) === 0) {
    await enqueue("catalog.sync", {});
  }
  const [agents, usage] = await Promise.all([
    prisma.agent.count({ where: forOrg(orgId) }),
    prisma.usageEvent.aggregate({
      where: { orgId, createdAt: { gte: startOfMonth() } },
      _sum: { costMicros: true, inputTokens: true, outputTokens: true },
      _count: true,
    }),
  ]);
  return c.json({
    orgId,
    profile,
    agents,
    usage: {
      messages: usage._count,
      costMicros: usage._sum.costMicros ?? 0,
      inputTokens: usage._sum.inputTokens ?? 0,
      outputTokens: usage._sum.outputTokens ?? 0,
    },
  });
});

dashboard.get("/agents", async (c) => {
  const { orgId } = org(c);
  const agents = await prisma.agent.findMany({
    where: forOrg(orgId),
    orderBy: { updatedAt: "desc" },
    include: {
      credential: { select: { id: true, label: true, last4: true, provider: true } },
    },
  });
  return c.json({ agents });
});

dashboard.post("/agents", async (c) => {
  const { orgId } = org(c);
  const body = createAgentSchema.parse(await c.req.json());
  const { builtinTools, widgetTheme, ...rest } = body;
  let theme: unknown = withBuiltinTools(null, resolveBuiltinTools(builtinTools ?? DEFAULT_BUILTIN_TOOLS));
  if (widgetTheme) theme = withWidgetTheme(theme, widgetTheme);
  const agent = await prisma.agent.create({
    data: {
      ...rest,
      orgId,
      theme: themeJson(theme),
    },
  });
  return c.json({ agent }, 201);
});

dashboard.get("/agents/:id", async (c) => {
  const { orgId } = org(c);
  const agent = await prisma.agent.findFirst({
    where: { id: c.req.param("id"), orgId },
    include: { tools: { include: { tool: true } }, sources: true },
  });
  if (!agent) return deny(c, "not_found", "Agent not found", 404);
  return c.json({ agent });
});

dashboard.patch("/agents/:id", async (c) => {
  const { orgId } = org(c);
  const body = updateAgentSchema.parse(await c.req.json());
  const existing = await prisma.agent.findFirst({ where: { id: c.req.param("id"), orgId } });
  if (!existing) return deny(c, "not_found", "Agent not found", 404);
  const { builtinTools, widgetTheme, ...rest } = body;
  let theme: unknown = existing.theme;
  if (builtinTools) theme = withBuiltinTools(theme, resolveBuiltinTools(builtinTools));
  if (widgetTheme) theme = withWidgetTheme(theme, widgetTheme);
  const agent = await prisma.agent.update({
    where: { id: existing.id },
    data: {
      ...rest,
      ...(builtinTools || widgetTheme ? { theme: themeJson(theme) } : {}),
    } as Prisma.AgentUncheckedUpdateInput,
  });
  return c.json({ agent });
});

dashboard.delete("/agents/:id", async (c) => {
  const { orgId } = org(c);
  await prisma.agent.deleteMany({ where: { id: c.req.param("id"), orgId } });
  return c.json({ ok: true });
});

dashboard.get("/credentials", async (c) => {
  const { orgId } = org(c);
  const credentials = await prisma.providerCredential.findMany({
    where: forOrg(orgId),
    select: {
      id: true,
      provider: true,
      label: true,
      last4: true,
      baseUrl: true,
      zaiMode: true,
      createdAt: true,
      updatedAt: true,
      keyVersion: true,
      agents: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const modelsById = await readCredentialModelsByOrg(orgId);
  return c.json({
    credentials: credentials.map((row) => ({
      ...row,
      models: modelsById.get(row.id) ?? [],
    })),
  });
});

dashboard.post("/credentials", async (c) => {
  const { orgId } = org(c);
  const body = createCredentialSchema.parse(await c.req.json());
  const sealed = sealSecret(body.apiKey, decodeMasterKey(getEnv().ENCRYPTION_KEY));
  const baseUrl =
    body.provider === "zai"
      ? body.zaiMode === "coding"
        ? ZAI_URLS.coding
        : ZAI_URLS.general
      : body.baseUrl;
  const credential = await prisma.providerCredential.create({
    data: {
      orgId,
      provider: body.provider,
      label: body.label,
      ciphertext: Buffer.from(sealed.ciphertext),
      iv: Buffer.from(sealed.iv),
      tag: Buffer.from(sealed.tag),
      keyVersion: sealed.keyVersion,
      last4: sealed.last4,
      fingerprint: sealed.fingerprint,
      baseUrl,
      zaiMode: body.zaiMode,
    },
  });
  if (body.provider === "custom") {
    await writeCredentialModels(credential.id, modelsForCustomCredential(parsedModelIds(body.models)));
  }
  return c.json({
    credential: { id: credential.id, last4: credential.last4, provider: credential.provider },
  }, 201);
});

dashboard.patch("/credentials/:id", async (c) => {
  const { orgId } = org(c);
  const body = updateCredentialSchema.parse(await c.req.json());
  const existing = await prisma.providerCredential.findFirst({
    where: { id: c.req.param("id"), orgId },
  });
  if (!existing) return deny(c, "not_found", "Credential not found", 404);
  if (body.baseUrl && existing.provider !== "custom") {
    return deny(c, "invalid_body", "Base URL can only be set on a custom OpenAI-compatible key.", 400);
  }
  const credential = await prisma.providerCredential.update({
    where: { id: existing.id },
    data: {
      ...(body.label !== undefined ? { label: body.label } : {}),
      ...(body.baseUrl !== undefined && existing.provider === "custom" ? { baseUrl: body.baseUrl } : {}),
    },
    select: { id: true, label: true, baseUrl: true },
  });
  if (body.models !== undefined) {
    await writeCredentialModels(existing.id, parsedModelIds(body.models));
  }
  const modelsById = await readCredentialModelsByOrg(orgId);
  return c.json({
    credential: {
      ...credential,
      models: body.models !== undefined ? parsedModelIds(body.models) : modelsById.get(existing.id) ?? [],
    },
  });
});

dashboard.post("/credentials/:id/rotate", async (c) => {
  const { orgId } = org(c);
  const body = rotateCredentialSchema.parse(await c.req.json());
  const existing = await prisma.providerCredential.findFirst({
    where: { id: c.req.param("id"), orgId },
  });
  if (!existing) return deny(c, "not_found", "Credential not found", 404);
  const sealed = sealSecret(
    body.apiKey,
    decodeMasterKey(getEnv().ENCRYPTION_KEY),
    existing.keyVersion + 1,
  );
  try {
    const credential = await prisma.providerCredential.update({
      where: { id: existing.id },
      data: {
        ciphertext: Buffer.from(sealed.ciphertext),
        iv: Buffer.from(sealed.iv),
        tag: Buffer.from(sealed.tag),
        keyVersion: sealed.keyVersion,
        last4: sealed.last4,
        fingerprint: sealed.fingerprint,
      },
      select: { id: true, last4: true, keyVersion: true },
    });
    return c.json({ credential });
  } catch {
    return deny(c, "conflict", "That key is already sealed in this workspace.", 409);
  }
});

dashboard.delete("/credentials/:id", async (c) => {
  const { orgId } = org(c);
  const existing = await prisma.providerCredential.findFirst({
    where: { id: c.req.param("id"), orgId },
    include: { agents: { select: { id: true, name: true } } },
  });
  if (!existing) return deny(c, "not_found", "Credential not found", 404);
  await prisma.agent.updateMany({
    where: { orgId, credentialId: existing.id },
    data: { credentialId: null },
  });
  await prisma.providerCredential.delete({ where: { id: existing.id } });
  return c.json({
    ok: true,
    detachedAgents: existing.agents.map((agent) => agent.name),
  });
});

dashboard.post("/credentials/:id/test", async (c) => {
  const { orgId } = org(c);
  const row = await prisma.providerCredential.findFirst({
    where: { id: c.req.param("id"), orgId },
  });
  if (!row) return deny(c, "not_found", "Credential not found", 404);
  return c.json({ ok: true, provider: row.provider, last4: row.last4 });
});

dashboard.get("/tools", async (c) => {
  const { orgId } = org(c);
  const tools = await prisma.tool.findMany({ where: forOrg(orgId), orderBy: { createdAt: "desc" } });
  return c.json({ tools });
});

dashboard.post("/tools", async (c) => {
  const { orgId } = org(c);
  const body = createToolSchema.parse(await c.req.json());
  const tool = await prisma.tool.create({
    data: {
      orgId,
      name: body.name,
      description: body.description,
      method: body.method,
      url: body.url,
      headers: body.headers ?? undefined,
      parameters: body.parameters as object,
      secretName: body.secretName,
      enabled: body.enabled ?? true,
    },
  });
  return c.json({ tool }, 201);
});

dashboard.post("/agents/:id/tools", async (c) => {
  const { orgId } = org(c);
  const { toolId } = (await c.req.json()) as { toolId: string };
  const agent = await prisma.agent.findFirst({ where: { id: c.req.param("id"), orgId } });
  if (!agent) return deny(c, "not_found", "Agent not found", 404);
  await prisma.agentTool.create({ data: { agentId: agent.id, toolId } });
  return c.json({ ok: true });
});

dashboard.get("/knowledge", async (c) => {
  const { orgId } = org(c);
  const sources = await prisma.knowledgeSource.findMany({
    where: forOrg(orgId),
    orderBy: { createdAt: "desc" },
  });
  return c.json({ sources });
});

dashboard.post("/knowledge", async (c) => {
  const { orgId } = org(c);
  const body = createKnowledgeSchema.parse(await c.req.json());
  const fromPairs = (body.pairs ?? []).map((p) => `Q: ${p.q}\nA: ${p.a}`).join("\n\n");
  const isUrl = body.kind === "url" || body.kind === "sitemap";
  const stored = isUrl
    ? (body.uri ?? "").trim()
    : (fromPairs || body.content || "").trim();
  if (!stored) {
    return deny(
      c,
      "invalid_body",
      isUrl ? "Add the URL to fetch." : "Add content to index.",
      400,
    );
  }
  const source = await prisma.knowledgeSource.create({
    data: {
      orgId,
      agentId: body.agentId,
      kind: body.kind,
      title: body.title,
      uri: stored,
      status: "queued",
    },
  });
  await enqueue("ingest.source", { sourceId: source.id });
  kickDrain();
  return c.json({ source }, 201);
});

dashboard.post("/knowledge/:id/reindex", async (c) => {
  const { orgId } = org(c);
  const source = await prisma.knowledgeSource.findFirst({
    where: { id: c.req.param("id"), orgId },
  });
  if (!source) return deny(c, "not_found", "Source not found", 404);
  const body = (await c.req.json().catch(() => ({}))) as { uri?: string };
  const isUrl = source.kind === "url" || source.kind === "sitemap";
  const nextUri = (body.uri ?? source.uri ?? "").trim();
  if (isUrl && !/^https?:\/\//i.test(nextUri)) {
    return deny(c, "invalid_body", "Paste the page URL, then index again.", 400);
  }
  await prisma.knowledgeSource.update({
    where: { id: source.id },
    data: {
      ...(isUrl ? { uri: nextUri } : {}),
      status: "queued",
      error: null,
    },
  });
  await enqueue("ingest.source", { sourceId: source.id });
  kickDrain();
  return c.json({ ok: true });
});

dashboard.get("/conversations", async (c) => {
  const { orgId } = org(c);
  const conversations = await prisma.conversation.findMany({
    where: forOrg(orgId),
    orderBy: { updatedAt: "desc" },
    take: 80,
    include: {
      messages: { take: 1, orderBy: { createdAt: "desc" } },
      agent: { select: { id: true, name: true } },
      _count: { select: { messages: true } },
    },
  });
  return c.json({ conversations });
});

dashboard.get("/conversations/:id", async (c) => {
  const { orgId } = org(c);
  const conversation = await prisma.conversation.findFirst({
    where: { id: c.req.param("id"), orgId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      agent: { select: { id: true, name: true } },
    },
  });
  if (!conversation) return deny(c, "not_found", "Not found", 404);
  return c.json({ conversation });
});

dashboard.patch("/conversations/:id", async (c) => {
  const { orgId } = org(c);
  const body = z.object({ status: z.enum(["open", "handoff", "closed"]) }).parse(await c.req.json());
  const existing = await prisma.conversation.findFirst({
    where: { id: c.req.param("id"), orgId },
    select: { id: true },
  });
  if (!existing) return deny(c, "not_found", "Not found", 404);
  const conversation = await prisma.conversation.update({
    where: { id: existing.id },
    data: { status: body.status },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      agent: { select: { id: true, name: true } },
    },
  });
  return c.json({ conversation });
});

dashboard.get("/usage", async (c) => {
  const { orgId } = org(c);
  const recent = await prisma.usageEvent.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 13);
  since.setUTCHours(0, 0, 0, 0);
  const window = await prisma.usageEvent.findMany({
    where: { orgId, createdAt: { gte: since } },
    select: { createdAt: true, costMicros: true, inputTokens: true, outputTokens: true, status: true },
  });
  const buckets = new Map<
    string,
    { day: string; messages: number; costMicros: number; inputTokens: number; outputTokens: number }
  >();
  for (let i = 0; i < 14; i++) {
    const day = new Date(since);
    day.setUTCDate(since.getUTCDate() + i);
    const key = day.toISOString().slice(0, 10);
    buckets.set(key, { day: key, messages: 0, costMicros: 0, inputTokens: 0, outputTokens: 0 });
  }
  for (const event of window) {
    const key = event.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.messages += 1;
    bucket.costMicros += event.costMicros;
    bucket.inputTokens += event.inputTokens;
    bucket.outputTokens += event.outputTokens;
  }
  return c.json({ daily: [...buckets.values()], recent });
});

dashboard.get("/models", async (c) => {
  const { orgId } = org(c);
  const [catalog, customCreds] = await Promise.all([
    prisma.modelCatalog.findMany({ orderBy: [{ provider: "asc" }, { modelId: "asc" }] }),
    readCustomCredentialModels(orgId),
  ]);
  const custom = customCreds.flatMap((cred) =>
    modelsForCustomCredential(cred.models).map((modelId) => ({
      provider: "custom",
      modelId,
      displayName: `${cred.label} · ${modelId}`,
      credentialId: cred.id,
    })),
  );
  return c.json({ models: [...catalog, ...custom] });
});

dashboard.post("/keys/publishable", async (c) => {
  const { orgId } = org(c);
  const body = (await c.req.json()) as { agentId?: string };
  const agent = await ensureWidgetAgent(orgId, body.agentId);
  const raw = `pk_${randomBytes(24).toString("hex")}`;
  const row = await prisma.publishableKey.create({
    data: {
      orgId,
      agentId: body.agentId || agent.id,
      keyHash: createHash("sha256").update(raw).digest("hex"),
      start: raw.slice(0, 10),
    },
  });
  return c.json({ key: raw, id: row.id, start: row.start });
});

dashboard.get("/install", async (c) => {
  const { orgId } = org(c);
  const [agents, keys] = await Promise.all([
    prisma.agent.findMany({
      where: forOrg(orgId),
      orderBy: { updatedAt: "desc" },
      include: {
        credential: { select: { id: true, label: true, last4: true, provider: true } },
      },
    }),
    prisma.publishableKey.findMany({
      where: { orgId, revoked: false },
      select: { id: true, start: true, agentId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const names = new Map(agents.map((row) => [row.id, row.name]));
  return c.json({
    agents,
    keys: keys.map((row) => ({
      ...row,
      agentName: row.agentId ? (names.get(row.agentId) ?? null) : null,
    })),
  });
});

function kickDrain() {
  waitUntil(
    fetch(new URL("/api/internal/jobs/drain", getEnv().NEXT_PUBLIC_APP_URL), {
      method: "POST",
      headers: { authorization: `Bearer ${getEnv().JOB_DRAIN_SECRET}` },
    }).then(() => undefined),
  );
}

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
