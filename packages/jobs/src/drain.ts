import { randomUUID } from "node:crypto";
import { claimJobs, completeJob, failJob, hasDueJobs } from "./queue";
import { handleCatalogSync, handleIngestSource, handleUsageRollup } from "./handlers";

export async function drainOnce(opts?: { budgetMs?: number; batch?: number }) {
  const budgetMs = opts?.budgetMs ?? 240_000;
  const started = Date.now();
  const workerId = randomUUID();
  let processed = 0;

  while (Date.now() - started < budgetMs * 0.8) {
    const jobs = await claimJobs(opts?.batch ?? 4, workerId);
    if (!jobs.length) break;
    for (const job of jobs) {
      try {
        await dispatch(job.type, job.payload);
        await completeJob(job.id);
        processed += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown job error";
        await failJob(job.id, message, job.attempts, job.maxAttempts);
      }
    }
  }

  return { processed, more: await hasDueJobs() };
}

async function dispatch(type: string, payload: unknown) {
  const data = (payload ?? {}) as Record<string, unknown>;
  switch (type) {
    case "ingest.source":
      return handleIngestSource({ sourceId: String(data.sourceId) });
    case "usage.rollup":
      return handleUsageRollup();
    case "catalog.sync":
      return handleCatalogSync();
    default:
      throw new Error(`Unknown job type ${type}`);
  }
}
