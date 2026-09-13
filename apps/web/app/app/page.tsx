"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Me = {
  agents: number;
  usage: { messages: number; costMicros: number; inputTokens: number; outputTokens: number };
};

export default function OverviewPage() {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      for (let attempt = 0; attempt < 6; attempt++) {
        const res = await fetch("/api/v1/me");
        const data = (await res.json().catch(() => null)) as Me | null;
        if (res.ok && data?.usage) {
          if (!cancelled) setMe(data);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }
    load().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-[13px] text-[var(--mute)]">Overview</p>
      <h1 className="display mt-2 text-5xl italic">Welcome back</h1>
      <p className="mt-3 max-w-xl text-[16px] leading-7 text-[var(--mute)]">
        Create an agent, add company knowledge, then install the widget on your site.
      </p>
      <div className="mt-10 grid gap-3 md:grid-cols-3">
        <Stat label="Agents" value={String(me?.agents ?? "—")} />
        <Stat label="Messages this month" value={String(me?.usage?.messages ?? "—")} />
        <Stat
          label="Spend this month"
          value={me?.usage ? `$${((me.usage.costMicros ?? 0) / 1_000_000).toFixed(4)}` : "—"}
        />
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/app/agents"
          className="pressable inline-flex h-10 items-center rounded-sm bg-[var(--accent)] px-4 text-[14px] text-white"
        >
          Create an agent
        </Link>
        <Link
          href="/app/knowledge"
          className="pressable inline-flex h-10 items-center rounded-sm border border-[var(--line)] px-4 text-[14px]"
        >
          Add knowledge
        </Link>
        <Link
          href="/app/install"
          className="pressable inline-flex h-10 items-center rounded-sm border border-[var(--line)] px-4 text-[14px]"
        >
          Install the widget
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel rounded-sm p-6">
      <p className="text-[13px] text-[var(--mute)]">{label}</p>
      <p className="display mt-3 text-4xl tabular">{value}</p>
    </div>
  );
}
