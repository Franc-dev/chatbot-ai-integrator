"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Field, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@signal/ui";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { resolveBuiltinTools, type BuiltinToolFlags, type BuiltinToolKey } from "@signal/core/builtins";

type Agent = {
  id: string;
  name: string;
  slug: string;
  theme?: { builtinTools?: Partial<BuiltinToolFlags> } | null;
};

type Source = { id: string; title: string; status: string; chunkCount: number; agentId: string | null };

const CATALOG: {
  key: BuiltinToolKey;
  name: string;
  summary: string;
  usesKnowledge: boolean;
}[] = [
  {
    key: "searchKnowledge",
    name: "Search knowledge",
    summary: "The chatbot looks up your uploaded docs, FAQs, and URLs before it answers.",
    usesKnowledge: true,
  },
  {
    key: "collectLead",
    name: "Collect a lead",
    summary: "When a visitor shares a name or email, the agent stores it on the conversation.",
    usesKnowledge: false,
  },
  {
    key: "handoffToHuman",
    name: "Hand off to a human",
    summary: "Marks the chat for follow-up when the visitor needs a teammate.",
    usesKnowledge: false,
  },
  {
    key: "getConversationContext",
    name: "Conversation memory",
    summary: "Lets the agent reread recent turns and lead details in this chat.",
    usesKnowledge: false,
  },
];

export default function ToolsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [flags, setFlags] = useState<BuiltinToolFlags>(resolveBuiltinTools(null));
  const [saving, setSaving] = useState(false);

  async function load() {
    const [a, k] = await Promise.all([
      api<{ agents: Agent[] }>("/api/v1/agents"),
      api<{ sources: Source[] }>("/api/v1/knowledge"),
    ]);
    setAgents(a.agents);
    setSources(k.sources);
    const next = a.agents[0];
    if (next) {
      setSelectedId((current) => current || next.id);
      if (!selectedId) setFlags(resolveBuiltinTools(next.theme?.builtinTools));
    }
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  useEffect(() => {
    const agent = agents.find((row) => row.id === selectedId);
    if (agent) setFlags(resolveBuiltinTools(agent.theme?.builtinTools));
  }, [selectedId, agents]);

  const selected = agents.find((row) => row.id === selectedId);
  const linked = sources.filter((s) => !s.agentId || s.agentId === selectedId);

  async function toggle(key: BuiltinToolKey) {
    if (!selected) return;
    const next = { ...flags, [key]: !flags[key] };
    setFlags(next);
    setSaving(true);
    try {
      await api(`/api/v1/agents/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({ builtinTools: next }),
      });
      setAgents((rows) =>
        rows.map((row) =>
          row.id === selected.id
            ? { ...row, theme: { ...row.theme, builtinTools: next } }
            : row,
        ),
      );
      toast.success("Saved for this agent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
      setFlags(flags);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-[13px] text-[var(--mute)]">Internal tools</p>
      <h1 className="display mt-2 text-5xl italic">What the chatbot can do</h1>
      <p className="mt-4 max-w-2xl text-[16px] leading-7 text-[var(--mute)]">
        These capabilities run inside Signal. The agent uses them to search your knowledge
        base, capture leads, and escalate chats. Visitors never see this screen.
      </p>

      {!agents.length ? (
        <div className="panel mt-10 rounded-sm p-8">
          <p className="text-[16px]">Create an agent first.</p>
          <p className="mt-2 text-[14px] text-[var(--mute)]">
            Tools are attached to a specific chatbot, then that bot reads the knowledge you add.
          </p>
          <Link
            href="/app/agents"
            className="pressable mt-5 inline-flex h-10 items-center rounded-sm bg-[var(--accent)] px-4 text-[14px] text-white"
          >
            Create an agent
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 max-w-sm">
            <Field label="Agent">
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger aria-label="Agent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <ul className="mt-8 grid gap-3">
            {CATALOG.map((item) => {
              const on = flags[item.key];
              return (
                <li key={item.key} className="panel rounded-sm p-5">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-[16px] ">{item.name}</p>
                      <p className="mt-1 max-w-xl text-[14px] leading-6 text-[var(--mute)]">
                        {item.summary}
                      </p>
                      {item.usesKnowledge ? (
                        <p className="mt-3 text-[13px] text-[var(--mute)]">
                          {linked.length
                            ? `Using ${linked.length} knowledge source${linked.length === 1 ? "" : "s"} · ${linked.filter((s) => s.status === "ready").length} ready`
                            : "No knowledge sources yet — add FAQs or documents so this tool has something to search."}{" "}
                          <Link href="/app/knowledge" className="text-[var(--accent)]">
                            Manage knowledge
                          </Link>
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      disabled={saving}
                      onClick={() => void toggle(item.key)}
                      className={`pressable relative h-7 w-12 shrink-0 rounded-full border ${
                        on
                          ? "border-transparent bg-[var(--live)]"
                          : "border-[var(--line)] bg-[#0e1014]"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 ${
                          on ? "left-6" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
