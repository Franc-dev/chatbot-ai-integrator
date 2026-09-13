import type { Context } from "hono";
import { chatRequestSchema } from "@signal/contract";
import { prisma } from "@signal/db";
import { runAgentStream } from "@signal/core";
import { deny } from "../authz";

export async function handleChat(
  c: Context,
  orgId: string,
  source: "playground" | "widget" | "mgmt",
) {
  const body = chatRequestSchema.parse(await c.req.json());
  const agent = await prisma.agent.findFirst({ where: { id: body.agentId, orgId } });
  if (!agent) return deny(c, "not_found", "Agent not found", 404);

  const profile = await prisma.organizationProfile.findUnique({
    where: { organizationId: orgId },
  });
  const used = await prisma.usageEvent.count({
    where: { orgId, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
  });
  if (profile && used >= profile.monthlyMessageCap) {
    return c.json(
      { error: { code: "quota_exceeded", message: "Monthly message cap reached" } },
      429,
    );
  }

  const since = new Date(Date.now() - 60_000);
  const visitorHits = await prisma.conversation.count({
    where: { orgId, visitorId: body.visitorId, updatedAt: { gte: since } },
  });
  if (profile && visitorHits > profile.visitorRatePerMin) {
    return c.json({ error: { code: "rate_limited", message: "Slow down" } }, 429);
  }

  const conversation = body.conversationId
    ? await prisma.conversation.findFirst({ where: { id: body.conversationId, orgId } })
    : await prisma.conversation.create({
        data: {
          orgId,
          agentId: agent.id,
          visitorId: body.visitorId,
          userHash: body.userHash,
        },
      });
  if (!conversation) return deny(c, "not_found", "Conversation not found", 404);

  const last = body.messages.at(-1);
  if (last?.role === "user") {
    await prisma.message.create({
      data: { conversationId: conversation.id, role: "user", content: last.content },
    });
  }

  const result = await runAgentStream({
    orgId,
    agentId: agent.id,
    conversationId: conversation.id,
    messages: body.messages.map((m) => ({ role: m.role, content: m.content })),
    source,
  });

  return result.toUIMessageStreamResponse({
    headers: { "x-conversation-id": conversation.id },
  });
}
