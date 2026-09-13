import { Hono } from "hono";
import { deny, secretKeyOrg } from "../authz";
import { handleChat } from "./chat";
import { prisma, forOrg } from "@signal/db";

export const mgmt = new Hono().use("*", async (c, next) => {
  const ctx = await secretKeyOrg(c);
  if (!ctx) return deny(c, "unauthorized", "Provide a valid sk_ key");
  c.set("org" as never, ctx as never);
  await next();
});

mgmt.get("/agents", async (c) => {
  const { orgId } = c.get("org" as never) as { orgId: string };
  const agents = await prisma.agent.findMany({ where: forOrg(orgId) });
  return c.json({ agents });
});

mgmt.post("/chat", async (c) => {
  const { orgId } = c.get("org" as never) as { orgId: string };
  return handleChat(c, orgId, "mgmt");
});
