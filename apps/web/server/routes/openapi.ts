import { Hono } from "hono";

export const openapi = new Hono().get("/", (c) =>
  c.json({
    openapi: "3.1.0",
    info: { title: "Signal Console API", version: "0.1.0" },
    paths: {
      "/api/v1/agents": { get: { summary: "List agents" }, post: { summary: "Create agent" } },
      "/api/v1/credentials": { get: { summary: "List provider keys" }, post: { summary: "Store provider key" } },
      "/api/public/v1/chat": { post: { summary: "Widget chat stream" } },
      "/api/mgmt/v1/chat": { post: { summary: "Server-to-server chat" } },
      "/api/internal/jobs/drain": { post: { summary: "Drain background jobs" } },
    },
  }),
);
