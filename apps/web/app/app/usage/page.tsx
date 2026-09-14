"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatUsd } from "@/lib/money";

type Daily = {
  day: string;
  messages: number;
  costMicros: number;
  inputTokens: number;
  outputTokens: number;
};
type Event = {
  id: string;
  model: string;
  provider: string;
  costMicros: number;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  createdAt: string;
  status?: string;
};

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
  const chats = daily.reduce((sum, d) => sum + d.messages, 0);
  const spent = daily.reduce((sum, d) => sum + d.costMicros, 0);

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-[13px] text-[var(--mute)]">Usage</p>
      <h1 className="display mt-2 text-5xl italic">What you have spent</h1>
      <p className="mt-3 tabular text-[14px] text-[var(--mute)]">
        Last 14 days · {chats} call{chats === 1 ? "" : "s"} · {formatUsd(spent)}
      </p>
      <div className="panel mt-8 flex h-40 items-end gap-1 rounded-sm p-4">
        {daily.map((d) => (
          <div
            key={d.day}
            className="flex-1 bg-[var(--accent)]"
            style={{ height: `${(d.messages / max) * 100}%`, minHeight: d.messages ? 2 : 0 }}
            title={`${d.day}: ${d.messages} calls · ${formatUsd(d.costMicros)}`}
          />
        ))}
        {!chats ? <p className="text-[14px] text-[var(--mute)]">Usage appears after the first chat.</p> : null}
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
                <td className="border-t border-[var(--line)] px-3 py-2">
                  {new Date(e.createdAt).toLocaleString()}
                </td>
                <td className="border-t border-[var(--line)] px-3 py-2">
                  {e.provider}/{e.model}
                  {e.status && e.status !== "ok" ? (
                    <span className="ml-2 text-[12px] text-[var(--accent)]">{e.status}</span>
                  ) : null}
                </td>
                <td className="border-t border-[var(--line)] px-3 py-2">
                  {e.inputTokens}/{e.outputTokens}
                </td>
                <td className="border-t border-[var(--line)] px-3 py-2">{formatUsd(e.costMicros)}</td>
                <td className="border-t border-[var(--line)] px-3 py-2">{e.latencyMs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
