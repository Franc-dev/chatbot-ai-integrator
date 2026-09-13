import { handleChat } from "@/server/routes/chat";
import { sessionOrg, deny } from "@/server/authz";
import { Hono } from "hono";
import { handle } from "hono/vercel";

const chat = new Hono().post("/api/v1/chat", async (c) => {
  const ctx = await sessionOrg(c);
  if (!ctx) return deny(c, "unauthorized", "Sign in required");
  return handleChat(c, ctx.orgId, "playground");
});

export const runtime = "nodejs";
export const maxDuration = 300;
export const POST = handle(chat);
