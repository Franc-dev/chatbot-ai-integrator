"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Convo = {
  id: string;
  visitorId: string;
  status: string;
  updatedAt: string;
  agent: { name: string };
  messages: { id?: string; content: string; role: string }[];
};

export default function InboxPage() {
  const [rows, setRows] = useState<Convo[]>([]);
  const [open, setOpen] = useState<{
    conversation: Convo & { messages: { id?: string; role: string; content: string }[] };
  } | null>(null);

  useEffect(() => {
    api<{ conversations: Convo[] }>("/api/v1/conversations")
      .then((d) => setRows(d.conversations))
      .catch(() => undefined);
  }, []);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_1fr]">
      <div>
        <p className="text-[13px] text-[var(--mute)]">Inbox</p>
        <h1 className="display mt-2 text-5xl italic">Conversations</h1>
        {rows.length ? (
          <ul className="mt-8 divide-y divide-[var(--line)] overflow-hidden rounded-sm border border-[var(--line)]">
            {rows.map((r) => (
              <li key={r.id}>
                <button
                  className="flex w-full items-center justify-between bg-[#101217] px-5 py-4 text-left"
                  onClick={async () => {
                    setOpen(await api(`/api/v1/conversations/${r.id}`));
                  }}
                >
                  <div>
                    <p className="text-[15px] ">{r.agent.name}</p>
                    <p className="mt-0.5 truncate text-[13px] text-[var(--mute)]">
                      {r.messages[0]?.content ?? "No messages yet"}
                    </p>
                  </div>
                  <span className="text-[13px] text-[var(--mute)]">{r.status}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="panel mt-8 rounded-sm p-8">
            <p className="text-[16px]">No chats yet</p>
            <p className="mt-2 text-[14px] leading-6 text-[var(--mute)]">
              Install the widget or use the playground. Handoffs from Tools appear here too.
            </p>
          </div>
        )}
      </div>
      <aside className="panel min-h-[50vh] rounded-sm p-5">
        {!open ? (
          <p className="text-[14px] text-[var(--mute)]">Select a conversation to read the transcript.</p>
        ) : (
          <div className="space-y-3">
            {open.conversation.messages.map((m, i) => (
              <p key={m.id ?? i} className="rounded-sm border border-[var(--line)] px-3 py-2 text-[14px] leading-6">
                <span className="mr-2 text-[12px] text-[var(--mute)]">{m.role}</span>
                {m.content}
              </p>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
