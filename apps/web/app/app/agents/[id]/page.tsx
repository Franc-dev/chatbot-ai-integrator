"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Field,
  Input,
  SELECT_NONE,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@signal/ui";
import { toast } from "sonner";
import { api } from "@/lib/api";

type Agent = {
  id: string;
  name: string;
  systemPrompt: string;
  modelRef: string;
  credentialId: string | null;
  greeting: string | null;
  placeholder: string | null;
  maxSteps: number;
  theme?: { builtinTools?: Record<string, boolean> } | null;
};

type Cred = { id: string; label: string; provider: string; last4: string };
type Model = { provider: string; modelId: string; displayName: string };
type Msg = { role: "user" | "assistant"; content: string };

const DEFAULT_MODELS: { value: string; label: string; hint?: string }[] = [
  { value: "openai/gpt-4.1-mini", label: "openai/gpt-4.1-mini" },
  { value: "anthropic/claude-sonnet-4.6", label: "anthropic/claude-sonnet-4.6" },
  { value: "openrouter/openai/gpt-4.1-mini", label: "openrouter/openai/gpt-4.1-mini" },
  { value: "vercel-gateway/openai/gpt-4.1-mini", label: "vercel-gateway/openai/gpt-4.1-mini" },
  { value: "zai/glm-4.6", label: "zai/glm-4.6" },
];

function modelOptions(models: Model[]) {
  const seen = new Set(DEFAULT_MODELS.map((item) => item.value));
  const extras = models.flatMap((model) => {
    const value = `${model.provider}/${model.modelId}`;
    if (seen.has(value)) return [];
    seen.add(value);
    return [{ value, label: model.displayName, hint: value }];
  });
  return [...DEFAULT_MODELS, ...extras];
}

export default function AgentBenchPage() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [creds, setCreds] = useState<Cred[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [trace, setTrace] = useState<string[]>([]);

  async function load() {
    const [a, c, m] = await Promise.all([
      api<{ agent: Agent }>(`/api/v1/agents/${id}`),
      api<{ credentials: Cred[] }>("/api/v1/credentials"),
      api<{ models: Model[] }>("/api/v1/models"),
    ]);
    setAgent(a.agent);
    setCreds(c.credentials);
    setModels(m.models);
    if (a.agent.greeting) setMessages([{ role: "assistant", content: a.agent.greeting }]);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [id]);

  async function save() {
    if (!agent) return;
    await api(`/api/v1/agents/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        systemPrompt: agent.systemPrompt,
        modelRef: agent.modelRef,
        credentialId: agent.credentialId,
        greeting: agent.greeting,
        placeholder: agent.placeholder,
        maxSteps: agent.maxSteps,
      }),
    });
    toast.success("Saved");
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!agent || !input.trim()) return;
    const next = [...messages, { role: "user" as const, content: input.trim() }];
    setMessages(next);
    setInput("");
    setTrace((t) => [...t, `user · ${next.at(-1)?.content.slice(0, 80)}`]);
    const res = await fetch("/api/v1/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentId: agent.id,
        visitorId: "playground-operator",
        messages: next,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body?.error?.message ?? "Stream failed");
      return;
    }
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let assistant = "";
    setMessages((m) => [...m, { role: "assistant", content: "" }]);
    if (!reader) return;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const json = JSON.parse(data) as { type?: string; delta?: string; toolName?: string };
          if (json.toolName) setTrace((t) => [...t, `tool · ${json.toolName}`]);
          const piece = json.delta ?? "";
          if (piece) {
            assistant += piece;
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = { role: "assistant", content: assistant };
              return copy;
            });
          }
        } catch {
          assistant += data;
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "assistant", content: assistant };
            return copy;
          });
        }
      }
    }
    setTrace((t) => [...t, "assistant · complete"]);
  }

  if (!agent) return <p className="text-[var(--mute)]">Loading playground…</p>;

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr_280px]">
      <section className="panel rounded-sm p-5">
        <p className="text-[13px] text-[var(--mute)]">Configure</p>
        <h2 className="display mt-1 text-3xl italic">{agent.name}</h2>
        <div className="mt-4 grid gap-3">
          <Field label="Model">
            <Select
              value={agent.modelRef}
              onValueChange={(value) => setAgent({ ...agent, modelRef: value })}
            >
              <SelectTrigger aria-label="Model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modelOptions(models).map((item) => (
                  <SelectItem key={item.value} value={item.value} hint={item.hint}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Credential">
            <Select
              value={agent.credentialId ?? SELECT_NONE}
              onValueChange={(value) =>
                setAgent({ ...agent, credentialId: value === SELECT_NONE ? null : value })
              }
            >
              <SelectTrigger aria-label="Credential">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_NONE}>None (env fallback)</SelectItem>
                {creds.map((c) => (
                  <SelectItem key={c.id} value={c.id} hint={`${c.provider} ···${c.last4}`}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Greeting">
            <Input
              value={agent.greeting ?? ""}
              onChange={(e) => setAgent({ ...agent, greeting: e.target.value })}
            />
          </Field>
          <Field label="Max tool steps">
            <Input
              type="number"
              min={1}
              max={20}
              value={agent.maxSteps}
              onChange={(e) => setAgent({ ...agent, maxSteps: Number(e.target.value) })}
            />
          </Field>
          <Field label="System prompt">
            <Textarea
              value={agent.systemPrompt}
              onChange={(e) => setAgent({ ...agent, systemPrompt: e.target.value })}
            />
          </Field>
          <Button type="button" onClick={() => void save()}>
            Save agent
          </Button>
        </div>
      </section>

      <section className="-mx-2 flex min-h-[70vh] flex-col border border-[var(--line)] bg-[var(--bg)]">
        <header className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <span className="text-[13px] ">Playground</span>
          <span className="tabular text-[11px] text-[var(--live)]">● stream</span>
        </header>
        <div className="flex-1 space-y-3 overflow-auto p-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[80%] border border-[var(--line)] px-3 py-2 text-[14px] ${
                m.role === "user" ? "ml-auto bg-[var(--panel)]" : ""
              }`}
            >
              {m.content}
            </div>
          ))}
        </div>
        <form onSubmit={send} className="flex border-t border-[var(--line)]">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent px-4 py-3 outline-none"
            placeholder={agent.placeholder ?? "Ask the agent…"}
          />
          <Button type="submit" className="rounded-none">
            Send
          </Button>
        </form>
      </section>

      <aside className="panel rounded-sm p-4">
        <p className="text-[13px] text-[var(--mute)]">Tool trace</p>
        <ol className="mt-3 space-y-2 text-[13px] tabular text-[var(--mute)]">
          {trace.map((line, i) => (
            <li key={i}>{String(i + 1).padStart(2, "0")} {line}</li>
          ))}
          {!trace.length ? <li>Waiting for a step…</li> : null}
        </ol>
        <p className="mt-6 text-[13px] text-[var(--mute)]">Internal tools</p>
        <ul className="mt-2 space-y-1 text-[13px]">
          {(["searchKnowledge", "collectLead", "handoffToHuman", "getConversationContext"] as const).map((name) => {
            const on = agent.theme?.builtinTools?.[name] !== false;
            return (
              <li key={name} className={on ? "" : "text-[var(--mute)]"}>
                {on ? "On" : "Off"} · {name}
              </li>
            );
          })}
        </ul>
        <Link href="/app/tools" className="mt-3 inline-block text-[13px] text-[var(--accent)]">
          Configure on Tools
        </Link>
      </aside>
    </div>
  );
}
