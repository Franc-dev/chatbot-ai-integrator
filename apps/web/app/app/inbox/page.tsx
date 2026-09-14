"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@signal/ui";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { DeskTranscript } from "@/components/desk-thread";
import { formatRelative, visitorLabel } from "@/lib/format";

type Status = "open" | "handoff" | "closed" | string;

type Convo = {
  id: string;
  visitorId: string;
  status: Status;
  updatedAt: string;
  createdAt?: string;
  lead?: unknown;
  agent: { id?: string; name: string };
  messages: { id?: string; content: string; role: string; createdAt?: string }[];
  _count?: { messages: number };
};

type Filter = "all" | "open" | "handoff" | "closed";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Live" },
  { id: "handoff", label: "Handoff" },
  { id: "closed", label: "Closed" },
];

export default function InboxPage() {
  const [rows, setRows] = useState<Convo[]>([]);
  const [open, setOpen] = useState<Convo | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function loadList() {
    const data = await api<{ conversations: Convo[] }>("/api/v1/conversations");
    setRows(data.conversations);
    return data.conversations;
  }

  useEffect(() => {
    loadList()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(
    () => ({
      all: rows.length,
      open: rows.filter((row) => row.status === "open").length,
      handoff: rows.filter((row) => row.status === "handoff").length,
      closed: rows.filter((row) => row.status === "closed").length,
    }),
    [rows],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter !== "all" && row.status !== filter) return false;
      if (!q) return true;
      const hay = [
        row.agent.name,
        row.visitorId,
        row.messages[0]?.content ?? "",
        row.status,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, filter, query]);

  async function select(id: string) {
    try {
      const data = await api<{ conversation: Convo }>(`/api/v1/conversations/${id}`);
      setOpen(data.conversation);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open thread");
    }
  }

  async function setStatus(status: "open" | "handoff" | "closed") {
    if (!open) return;
    setBusy(true);
    try {
      const data = await api<{ conversation: Convo }>(`/api/v1/conversations/${open.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOpen(data.conversation);
      setRows((current) =>
        current.map((row) => (row.id === data.conversation.id ? { ...row, status } : row)),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update thread");
    } finally {
      setBusy(false);
    }
  }

  const lead = leadText(open?.lead);

  return (
    <div className="flex h-full min-h-0 flex-1">
      <section
        className={`flex w-full min-w-0 flex-col border-r border-[var(--line)] bg-[#101217] md:w-[360px] md:shrink-0 ${
          open ? "max-md:hidden" : ""
        }`}
      >
        <header className="shrink-0 border-b border-[var(--line)] px-5 pb-4 pt-5">
          <p className="text-[13px] text-[var(--mute)]">Inbox</p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <h1 className="display text-4xl italic leading-none">Night desk</h1>
            <span className="tabular text-[12px] text-[var(--mute)]">{counts.all}</span>
          </div>
          <label className="mt-4 flex items-center gap-2 rounded-sm border border-[var(--line)] bg-[#0e1014] px-3 py-2 focus-within:border-[var(--accent)]">
            <span className="sr-only">Search conversations</span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="text-[var(--mute)]">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search visitor, agent, copy"
              className="w-full bg-transparent text-[14px] outline-none placeholder:text-[var(--mute)]"
            />
          </label>
          <div className="mt-3 flex gap-1">
            {FILTERS.map((item) => {
              const active = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`rounded-sm px-2.5 py-1 text-[12px] ${
                    active
                      ? "bg-[var(--line)] text-[var(--fg)]"
                      : "text-[var(--mute)] hover:bg-white/5"
                  }`}
                >
                  {item.label}
                  <span className="ml-1.5 tabular text-[11px] text-[var(--mute)]">{counts[item.id]}</span>
                </button>
              );
            })}
          </div>
        </header>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <li className="px-5 py-8 text-[14px] text-[var(--mute)]">Pulling threads…</li>
          ) : null}
          {!loading && !visible.length ? (
            <li className="px-5 py-8">
              <p className="text-[15px]">No threads here</p>
              <p className="mt-2 text-[13px] leading-6 text-[var(--mute)]">
                {rows.length ? (
                  "Nothing matches that filter."
                ) : (
                  <>
                    Talk in the{" "}
                    <Link href="/app/agents" className="text-[var(--accent)]">
                      playground
                    </Link>{" "}
                    or{" "}
                    <Link href="/app/install" className="text-[var(--accent)]">
                      install the widget
                    </Link>
                    . Handoffs land here.
                  </>
                )}
              </p>
            </li>
          ) : null}
          {visible.map((row) => {
            const selected = open?.id === row.id;
            return (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => void select(row.id)}
                  className={`flex w-full gap-3 border-l-2 px-5 py-3.5 text-left transition-colors duration-[var(--dur-press)] ease-[var(--ease-out)] ${
                    selected
                      ? "border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_8%,transparent)]"
                      : "border-transparent hover:bg-white/5"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[14px]">{visitorLabel(row.visitorId)}</span>
                      <StatusPill status={row.status} />
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-[var(--mute)]">
                      {row.agent.name}
                      {row.messages[0]?.content ? ` · ${row.messages[0].content}` : " · No messages yet"}
                    </span>
                  </span>
                  <span className="shrink-0 tabular text-[11px] text-[var(--mute)]">
                    {formatRelative(row.updatedAt)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={`flex min-w-0 flex-1 flex-col bg-[var(--bg)] ${open ? "" : "max-md:hidden"}`}>
        {!open ? (
          <div className="m-auto max-w-sm px-8 text-center">
            <p className="display text-4xl italic">Pick a thread</p>
            <p className="mt-3 text-[14px] leading-6 text-[var(--mute)]">
              Live chats, playground runs, and human handoffs sit on this desk.
            </p>
          </div>
        ) : (
          <>
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
              <div className="min-w-0">
                <button
                  type="button"
                  className="mb-2 text-[13px] text-[var(--mute)] md:hidden"
                  onClick={() => setOpen(null)}
                >
                  ← Threads
                </button>
                <p className="truncate text-[16px]">{visitorLabel(open.visitorId)}</p>
                <p className="mt-0.5 text-[13px] text-[var(--mute)]">
                  {open.agent.name}
                  {open.agent.id ? (
                    <>
                      {" · "}
                      <Link href={`/app/agents/${open.agent.id}`} className="text-[var(--accent)]">
                        Playground
                      </Link>
                    </>
                  ) : null}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                <StatusPill status={open.status} />
                {open.status !== "closed" ? (
                  <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => void setStatus("closed")}>
                    Close
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => void setStatus("open")}>
                    Reopen
                  </Button>
                )}
                {open.status !== "handoff" ? (
                  <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => void setStatus("handoff")}>
                    Handoff
                  </Button>
                ) : null}
              </div>
            </header>
            {lead ? (
              <p className="shrink-0 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] px-5 py-2.5 text-[13px] leading-5">
                <span className="text-[var(--mute)]">Lead · </span>
                {lead}
              </p>
            ) : null}
            <DeskTranscript
              messages={open.messages.map((message) => ({
                role: message.role,
                content: message.content,
                at: message.createdAt,
              }))}
              empty={<p className="m-auto text-[14px] text-[var(--mute)]">This thread is empty.</p>}
            />
          </>
        )}
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  const live = status === "open";
  const handoff = status === "handoff";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[11px] tracking-wide ${
        live
          ? "text-[var(--live)]"
          : handoff
            ? "text-[var(--accent)]"
            : "text-[var(--mute)]"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${
          live ? "bg-[var(--live)]" : handoff ? "bg-[var(--accent)]" : "bg-[var(--mute)]"
        }`}
      />
      {handoff ? "Handoff" : live ? "Live" : "Closed"}
    </span>
  );
}

function leadText(lead: unknown) {
  if (!lead || typeof lead !== "object") return "";
  const record = lead as Record<string, unknown>;
  const bits = ["reason", "name", "email", "phone", "company"]
    .map((key) => {
      const value = record[key];
      return typeof value === "string" && value.trim() ? `${key}: ${value.trim()}` : "";
    })
    .filter(Boolean);
  return bits.join(" · ");
}
