import type { Context } from "hono";
import { auth } from "@/lib/auth";
import { prisma } from "@signal/db";
import { createHash, randomBytes } from "node:crypto";

export async function sessionOrg(c: Context) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return null;
  const orgId = session.session.activeOrganizationId;
  if (!orgId) return null;
  return { userId: session.user.id, orgId };
}

export async function secretKeyOrg(c: Context) {
  const raw = c.req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!raw?.startsWith("sk_")) return null;
  const verified = await auth.api.verifyApiKey({
    body: { key: raw },
  });
  if (!verified?.valid || !verified.key?.referenceId) return null;
  return { orgId: verified.key.referenceId, configId: verified.key.configId };
}

function readPublishableKey(c: Context) {
  const raw = c.req.header("x-publishable-key") ?? c.req.query("key") ?? c.req.param("key") ?? "";
  return raw.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

export async function publishableOrg(c: Context, agentId?: string) {
  const raw = readPublishableKey(c);
  if (!raw.startsWith("pk_")) return null;
  const hash = createHash("sha256").update(raw).digest("hex");
  const row = await prisma.publishableKey.findFirst({
    where: { keyHash: hash, revoked: false },
  });
  if (!row) return null;
  return { orgId: row.orgId, agentId: agentId ?? row.agentId ?? undefined };
}

const widgetAgentSelect = {
  id: true,
  orgId: true,
  name: true,
  greeting: true,
  placeholder: true,
  theme: true,
} as const;

export async function ensureWidgetAgent(orgId: string, agentId?: string) {
  if (agentId) {
    const bound = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: widgetAgentSelect,
    });
    if (bound) return bound;
  }
  const existing =
    (await prisma.agent.findFirst({
      where: { orgId, published: true },
      orderBy: { updatedAt: "desc" },
      select: widgetAgentSelect,
    })) ??
    (await prisma.agent.findFirst({
      where: { orgId },
      orderBy: { updatedAt: "desc" },
      select: widgetAgentSelect,
    }));
  if (existing) return existing;
  const id = `c${randomBytes(12).toString("hex")}`;
  const now = new Date();
  await prisma.$executeRaw`
    INSERT INTO "Agent" ("id", "orgId", "name", "slug", "greeting", "placeholder", "published", "updatedAt")
    VALUES (${id}, ${orgId}, ${"Signal"}, ${"default"}, ${"Hi — ask me anything."}, ${"Ask anything"}, ${true}, ${now})
  `;
  const created = await prisma.agent.findFirst({
    where: { id, orgId },
    select: widgetAgentSelect,
  });
  if (created) return created;
  const retry = await prisma.agent.findFirst({
    where: { orgId },
    orderBy: { updatedAt: "desc" },
    select: widgetAgentSelect,
  });
  if (retry) return retry;
  throw new Error("Could not create a default agent");
}

export function deny(c: Context, code: string, message: string, status = 401) {
  return c.json({ error: { code, message } }, status as 401);
}
