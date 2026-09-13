import { prisma, Prisma } from "@signal/db";
import type { JobType } from "@signal/contract";

export async function enqueue(
  type: JobType,
  payload: Record<string, unknown>,
  opts?: { runAt?: Date; maxAttempts?: number },
) {
  return prisma.job.create({
    data: {
      type,
      payload: payload as object,
      runAt: opts?.runAt ?? new Date(),
      maxAttempts: opts?.maxAttempts ?? 5,
    },
  });
}

export type ClaimedJob = {
  id: string;
  type: string;
  payload: Prisma.JsonValue;
  attempts: number;
  maxAttempts: number;
};

export async function claimJobs(limit: number, workerId: string): Promise<ClaimedJob[]> {
  return prisma.$queryRaw<ClaimedJob[]>`
    UPDATE "Job"
    SET status = 'running',
        "lockedAt" = NOW(),
        "lockedBy" = ${workerId},
        attempts = attempts + 1,
        "updatedAt" = NOW()
    WHERE id IN (
      SELECT id FROM "Job"
      WHERE status IN ('queued', 'retry')
        AND "runAt" <= NOW()
      ORDER BY "runAt"
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    )
    RETURNING id, type, payload, attempts, "maxAttempts"
  `;
}

export async function completeJob(id: string) {
  await prisma.job.update({
    where: { id },
    data: { status: "done", lockedAt: null, lockedBy: null },
  });
}

export async function failJob(id: string, error: string, attempts: number, maxAttempts: number) {
  const retry = attempts < maxAttempts;
  const delayMs = Math.min(60_000 * 2 ** Math.max(0, attempts - 1), 60 * 60_000);
  await prisma.job.update({
    where: { id },
    data: {
      status: retry ? "retry" : "failed",
      lastError: error.slice(0, 2000),
      lockedAt: null,
      lockedBy: null,
      runAt: retry ? new Date(Date.now() + delayMs) : new Date(),
    },
  });
}

export async function hasDueJobs() {
  const count = await prisma.job.count({
    where: {
      status: { in: ["queued", "retry"] },
      runAt: { lte: new Date() },
    },
  });
  return count > 0;
}
