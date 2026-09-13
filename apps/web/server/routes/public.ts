import { Hono } from "hono";
import { prisma } from "@signal/db";
import { deny, ensureWidgetAgent, publishableOrg } from "../authz";
import { handleChat } from "./chat";

export const pub = new Hono();

async function widgetConfig(c: Parameters<typeof publishableOrg>[0]) {
  try {
    const ctx = await publishableOrg(c);
    if (!ctx) return deny(c, "invalid_key", "Publishable key rejected");
    const agent = await ensureWidgetAgent(ctx.orgId, ctx.agentId);
    const origin = c.req.header("origin");
    if (origin) {
      await prisma.widgetInstallation
        .upsert({
          where: { agentId_origin: { agentId: agent.id, origin } },
          create: { orgId: ctx.orgId, agentId: agent.id, origin },
          update: { lastSeen: new Date() },
        })
        .catch(() => undefined);
    }
    return c.json({
      agentId: agent.id,
      name: agent.name,
      greeting: agent.greeting,
      placeholder: agent.placeholder,
      theme: agent.theme,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Widget config failed";
    return c.json({ error: { code: "widget_config_failed", message } }, 500);
  }
}

pub.get("/widget", (c) => widgetConfig(c));
pub.get("/widget/:key", (c) => widgetConfig(c));

pub.post("/chat", async (c) => {
  const ctx = await publishableOrg(c);
  if (!ctx) return deny(c, "invalid_key", "Publishable key rejected");
  return handleChat(c, ctx.orgId, "widget");
});
