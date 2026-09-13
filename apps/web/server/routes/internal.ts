import { Hono } from "hono";
import { drainOnce } from "@signal/jobs";
import { deny } from "../authz";
import { getEnv } from "@signal/core";

export const internal = new Hono();

internal.post("/jobs/drain", async (c) => {
  const token = c.req.header("authorization")?.replace(/^Bearer\s+/i, "");
  const cron = c.req.header("x-vercel-cron");
  if (token !== getEnv().JOB_DRAIN_SECRET && !cron) {
    return deny(c, "unauthorized", "Drain secret required");
  }
  const result = await drainOnce({ budgetMs: 240_000, batch: 6 });
  if (result.more) {
    const url = new URL("/api/internal/jobs/drain", getEnv().NEXT_PUBLIC_APP_URL);
    fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${getEnv().JOB_DRAIN_SECRET}` },
    }).catch(() => undefined);
  }
  return c.json(result);
});
