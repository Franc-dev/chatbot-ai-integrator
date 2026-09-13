import { Hono } from "hono";
import { prisma, forOrg } from "@signal/db";
import {
  createAgentSchema,
  createCredentialSchema,
  createKnowledgeSchema,
  createToolSchema,
  updateAgentSchema,
} from "@signal/contract";
import {
  decodeMasterKey,
  DEFAULT_BUILTIN_TOOLS,
  getEnv,
  resolveBuiltinTools,
  sealSecret,
  withBuiltinTools,
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
  });
  return c.json({ agents });
});

dashboard.post("/agents", async (c) => {
  const { orgId } = org(c);
  const body = createAgentSchema.parse(await c.req.json());
  const { builtinTools, ...rest } = body;
  const agent = await prisma.agent.create({
    data: {
      ...rest,
      orgId,
      theme: withBuiltinTools(null, resolveBuiltinTools(builtinTools ?? DEFAULT_BUILTIN_TOOLS)),
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
  const { builtinTools, ...rest } = body;
  const agent = await prisma.agent.update({
    where: { id: existing.id },
    data: {
      ...rest,
      ...(builtinTools
        ? { theme: withBuiltinTools(existing.theme, resolveBuiltinTools(builtinTools)) }
        : {}),
    },
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
    },
    orderBy: { createdAt: "desc" },
  });
  return c.json({ credentials });
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
  return c.json({
    credential: { id: credential.id, last4: credential.last4, provider: credential.provider },
  }, 201);
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
  const content =
    body.kind === "faq"
      ? fromPairs || body.content || body.uri || ""
      : (body.content ?? body.uri ?? "");
  const source = await prisma.knowledgeSource.create({
    data: {
      orgId,
      agentId: body.agentId,
      kind: body.kind,
      title: body.title,
      uri: content,
      status: "queued",
    },
  });
  await enqueue("ingest.source", { sourceId: source.id });
  waitUntil(
    fetch(new URL("/api/internal/jobs/drain", getEnv().NEXT_PUBLIC_APP_URL), {
      method: "POST",
      headers: { authorization: `Bearer ${getEnv().JOB_DRAIN_SECRET}` },
    }).then(() => undefined),
  );
  return c.json({ source }, 201);
});

dashboard.get("/conversations", async (c) => {
  const { orgId } = org(c);
  const conversations = await prisma.conversation.findMany({
    where: forOrg(orgId),
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: { messages: { take: 1, orderBy: { createdAt: "desc" } }, agent: true },
  });
  return c.json({ conversations });
});

dashboard.get("/conversations/:id", async (c) => {
  const { orgId } = org(c);
  const conversation = await prisma.conversation.findFirst({
    where: { id: c.req.param("id"), orgId },
    include: { messages: { orderBy: { createdAt: "asc" } }, agent: true },
  });
  if (!conversation) return deny(c, "not_found", "Not found", 404);
  return c.json({ conversation });
});

dashboard.get("/usage", async (c) => {
  const { orgId } = org(c);
  const daily = await prisma.usageDaily.findMany({
    where: { orgId },
    orderBy: { day: "desc" },
    take: 30,
  });
  const recent = await prisma.usageEvent.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return c.json({ daily, recent });
});

dashboard.get("/models", async (c) => {
  const models = await prisma.modelCatalog.findMany({ orderBy: [{ provider: "asc" }, { modelId: "asc" }] });
  return c.json({ models });
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
  const keys = await prisma.publishableKey.findMany({
    where: { orgId, revoked: false },
    select: { id: true, start: true, agentId: true, createdAt: true },
  });
  return c.json({ keys });
});

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
