"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Daily = { id: string; day: string; messages: number; costMicros: bigint | number; inputTokens: number; outputTokens: number };
type Event = { id: string; model: string; provider: string; costMicros: number; inputTokens: number; outputTokens: number; latencyMs: number; createdAt: string };

export default function UsagePage() {
  const [daily, setDaily] = useState<Daily[]>([]);
  const [recent, setRecent] = useState<Event[]>([]);

  useEffect(() => {
    api<{ daily: Daily[]; recent: Event[] }>("/api/v1/usage")
      .then((d) => {
        setDaily(d.daily);
        setRecent(d.recent);
      })
      .catch(() => undefined);
  }, []);

  const max = Math.max(1, ...daily.map((d) => d.messages));

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-[13px] text-[var(--mute)]">Usage</p>
      <h1 className="display mt-2 text-5xl italic">What you have spent</h1>
      <div className="panel mt-8 flex h-40 items-end gap-1 rounded-sm p-4">
        {daily
          .slice()
          .reverse()
          .map((d) => (
            <div
              key={d.id}
              className="flex-1 bg-[var(--accent)]"
              style={{ height: `${(d.messages / max) * 100}%`, minHeight: 2 }}
              title={`${d.day}: ${d.messages}`}
            />
          ))}
        {!daily.length ? <p className="text-[14px] text-[var(--mute)]">Usage appears after the first chat.</p> : null}
      </div>
      {recent.length ? (
        <table className="mt-8 w-full border-collapse text-left text-[14px]">
          <thead className="text-[13px] text-[var(--mute)]">
            <tr>
              <th className="border-b border-[var(--line)] px-3 py-2">When</th>
              <th className="border-b border-[var(--line)] px-3 py-2">Model</th>
              <th className="border-b border-[var(--line)] px-3 py-2">Tokens</th>
              <th className="border-b border-[var(--line)] px-3 py-2">Cost</th>
              <th className="border-b border-[var(--line)] px-3 py-2">ms</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((e) => (
              <tr key={e.id} className="tabular">
                <td className="border-t border-[var(--line)] px-3 py-2">{new Date(e.createdAt).toLocaleString()}</td>
                <td className="border-t border-[var(--line)] px-3 py-2">
                  {e.provider}/{e.model}
                </td>
                <td className="border-t border-[var(--line)] px-3 py-2">
                  {e.inputTokens}/{e.outputTokens}
                </td>
                <td className="border-t border-[var(--line)] px-3 py-2">${(e.costMicros / 1_000_000).toFixed(4)}</td>
                <td className="border-t border-[var(--line)] px-3 py-2">{e.latencyMs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
