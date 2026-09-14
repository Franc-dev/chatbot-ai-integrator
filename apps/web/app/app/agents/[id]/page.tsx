"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  cn,
} from "@signal/ui";
import { widgetThemeFrom } from "@signal/core/builtins";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ModelPicker } from "@/components/model-picker";
import { DeskComposer, DeskTranscript, type DeskMsg } from "@/components/desk-thread";
import type { CatalogModel } from "@/lib/models";

type Agent = {
  id: string;
  name: string;
  systemPrompt: string;
  modelRef: string;
  credentialId: string | null;
  greeting: string | null;
  placeholder: string | null;
  maxSteps: number;
  theme?: { builtinTools?: Record<string, boolean>; widget?: Record<string, string> } | null;
};

type Cred = { id: string; label: string; provider: string; last4: string; models?: string[] };
type Model = CatalogModel;
type Pane = "setup" | "chat" | "tape";

const TOOLS = ["searchKnowledge", "collectLead", "handoffToHuman", "getConversationContext"] as const;

export default function AgentBenchPage() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [creds, setCreds] = useState<Cred[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [messages, setMessages] = useState<DeskMsg[]>([]);
  const [input, setInput] = useState("");
  const [trace, setTrace] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pane, setPane] = useState<Pane>("chat");

  async function load() {
    const [agentRes, credRes, modelRes] = await Promise.allSettled([
      api<{ agent: Agent }>(`/api/v1/agents/${id}`),
      api<{ credentials: Cred[] }>("/api/v1/credentials"),
      api<{ models: Model[] }>("/api/v1/models"),
    ]);
    if (agentRes.status !== "fulfilled") throw agentRes.reason;
    const next = agentRes.value.agent;
    setAgent(next);
    if (next.greeting) {
      setMessages([{ role: "assistant", content: next.greeting }]);
    }
    if (credRes.status === "fulfilled") setCreds(credRes.value.credentials);
    if (modelRes.status === "fulfilled") setModels(modelRes.value.models);
    else toast.error("Model catalog failed to load. Custom Qwen/Gemma still work after a refresh.");
  }

  async function refreshCatalog() {
    const [credRes, modelRes] = await Promise.allSettled([
      api<{ credentials: Cred[] }>("/api/v1/credentials"),
      api<{ models: Model[] }>("/api/v1/models"),
    ]);
    if (credRes.status === "fulfilled") setCreds(credRes.value.credentials);
    if (modelRes.status === "fulfilled") setModels(modelRes.value.models);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [id]);

  async function save() {
    if (!agent) return;
    setSaving(true);
    try {
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function send() {
    if (!agent || !input.trim() || busy) return;
    const next = [...messages, { role: "user", content: input.trim(), at: new Date().toISOString() }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setTrace((t) => [...t, `user · ${next.at(-1)?.content.slice(0, 80)}`]);
    setMessages((m) => [...m, { role: "assistant", content: "" }]);
    const res = await fetch("/api/v1/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentId: agent.id,
        visitorId: "playground-operator",
        messages: next.map(({ role, content }) => ({ role, content })),
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message = body?.error?.message ?? "Stream failed";
      toast.error(message);
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: message };
        return copy;
      });
      setBusy(false);
      return;
    }
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let assistant = "";
    if (!reader) {
      setBusy(false);
      return;
    }
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const json = JSON.parse(data) as {
              type?: string;
              delta?: string;
              text?: string;
              errorText?: string;
              toolName?: string;
            };
            if (json.toolName) setTrace((t) => [...t, `tool · ${json.toolName}`]);
            if (json.type === "error" || json.errorText) {
              const message = json.errorText?.trim() || "The model provider rejected this request.";
              assistant = message;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: message, at: new Date().toISOString() };
                return copy;
              });
              toast.error(message);
              setTrace((t) => [...t, `error · ${message}`]);
              continue;
            }
            const piece = json.delta ?? json.text ?? "";
            if (piece) {
              assistant += piece;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: assistant };
                return copy;
              });
            }
          } catch {
            /* ignore keep-alives */
          }
        }
      }
      if (!assistant.trim()) {
        const message = "The model did not reply. Check the credential and provider credits.";
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: message, at: new Date().toISOString() };
          return copy;
        });
        toast.error(message);
        setTrace((t) => [...t, `error · ${message}`]);
        return;
      }
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant") copy[copy.length - 1] = { ...last, at: new Date().toISOString() };
        return copy;
      });
      setTrace((t) => [...t, "assistant · complete"]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Stream failed";
      toast.error(message);
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: message };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  function resetChat() {
    setMessages(agent?.greeting ? [{ role: "assistant", content: agent.greeting }] : []);
    setTrace([]);
    setInput("");
  }

  if (!agent) {
    return (
      <div className="grid h-full place-items-center text-[14px] text-[var(--mute)]">Loading playground…</div>
    );
  }

  const credential = creds.find((row) => row.id === agent.credentialId);
  const panes: { id: Pane; label: string }[] = [
    { id: "setup", label: "Setup" },
    { id: "chat", label: "Chat" },
    { id: "tape", label: "Tape" },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] bg-[#101217] px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <Link href="/app/agents" className="text-[12px] text-[var(--mute)]">
            ← Agents
          </Link>
          <h1 className="display truncate text-3xl italic leading-none">{agent.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`tabular text-[11px] ${busy ? "text-[var(--live)]" : "text-[var(--mute)]"}`}>
            {busy ? "● stream" : "Ready"}
          </span>
          <Button type="button" size="sm" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </header>

      <div className="flex shrink-0 gap-1 border-b border-[var(--line)] px-3 py-2 xl:hidden">
        {panes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPane(item.id)}
            className={`rounded-sm px-3 py-1.5 text-[13px] ${
              pane === item.id ? "bg-[var(--line)]" : "text-[var(--mute)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            "min-h-0 w-full shrink-0 overflow-y-auto border-r border-[var(--line)] bg-[#101217] xl:w-[340px]",
            pane !== "setup" && "max-xl:hidden",
          )}
        >
          <div className="grid gap-4 p-5">
            <p className="text-[13px] text-[var(--mute)]">Instrument</p>
            <ModelPicker
              models={models}
              modelRef={agent.modelRef}
              credentialId={agent.credentialId}
              credentials={creds}
              onChange={(next) => setAgent({ ...agent, ...next })}
              onPersisted={() => refreshCatalog()}
            />
            <Field label="Vault key" hint="Catalog models can fall back to env. Custom Qwen/Gemma must use the Mitsumi key.">
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
            {credential ? (
              <p className="tabular text-[12px] text-[var(--mute)]">
                {credential.provider} ···{credential.last4}
              </p>
            ) : null}
            <Field label="Greeting">
              <Input
                value={agent.greeting ?? ""}
                onChange={(e) => setAgent({ ...agent, greeting: e.target.value })}
              />
            </Field>
            <Field label="Placeholder">
              <Input
                value={agent.placeholder ?? ""}
                onChange={(e) => setAgent({ ...agent, placeholder: e.target.value })}
              />
            </Field>
            <p className="text-[13px] leading-5 text-[var(--mute)]">
              Colors and the publishable key live on{" "}
              <Link href="/app/install" className="text-[var(--accent)]">
                Install
              </Link>
              .
            </p>
            <WidgetSwatches theme={agent.theme} />
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
                className="min-h-40"
              />
            </Field>
          </div>
        </aside>

        <section
          className={cn(
            "relative flex min-h-0 min-w-0 flex-1 flex-col",
            pane !== "chat" && "max-xl:hidden",
          )}
          style={{
            background:
              "radial-gradient(120% 70% at 0% -8%, color-mix(in oklab, var(--accent) 14%, transparent), transparent 46%), var(--bg)",
          }}
        >
          <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-2.5">
            <p className="text-[13px] text-[var(--mute)]">Playground</p>
            <button type="button" className="text-[12px] text-[var(--mute)] hover:text-[var(--fg)]" onClick={resetChat}>
              Clear
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <DeskTranscript
              messages={messages}
              streaming={busy}
              empty={
                <div className="m-auto max-w-sm px-2 text-center">
                  <p className="text-[11px] uppercase tracking-[0.04em] text-[var(--live)]">
                    <span className="mr-2 inline-block size-1.5 rounded-full bg-[var(--live)]" />
                    Here with you
                  </p>
                  <p className="display mt-3 text-4xl italic">Try a turn</p>
                  <p className="mt-2 text-[14px] leading-6 text-[var(--mute)]">
                    This stream uses the model and vault key on the left. It is not the widget key.
                  </p>
                </div>
              }
            />
          </div>
          <DeskComposer
            value={input}
            onChange={setInput}
            onSend={() => void send()}
            placeholder={agent.placeholder ?? "Ask the agent…"}
            busy={busy}
          />
        </section>

        <aside
          className={cn(
            "min-h-0 w-full shrink-0 overflow-y-auto border-l border-[var(--line)] bg-[#101217] xl:w-[280px]",
            pane !== "tape" && "max-xl:hidden",
          )}
        >
          <div className="p-5">
            <p className="text-[13px] text-[var(--mute)]">Tool tape</p>
            <ol className="mt-3 space-y-2 text-[13px] tabular text-[var(--mute)]">
              {trace.map((line, i) => (
                <li key={`${line}-${i}`} className="border-l border-[var(--line)] pl-3">
                  <span className="text-[11px] text-[var(--mute)]">{String(i + 1).padStart(2, "0")}</span> {line}
                </li>
              ))}
              {!trace.length ? <li>Waiting for a step…</li> : null}
            </ol>
            <p className="mt-8 text-[13px] text-[var(--mute)]">Internal tools</p>
            <ul className="mt-2 space-y-2 text-[13px]">
              {TOOLS.map((name) => {
                const on = agent.theme?.builtinTools?.[name] !== false;
                return (
                  <li key={name} className="flex items-center justify-between gap-3">
                    <span className={on ? "" : "text-[var(--mute)]"}>{name}</span>
                    <span className={on ? "text-[var(--live)]" : "text-[var(--mute)]"}>{on ? "On" : "Off"}</span>
                  </li>
                );
              })}
            </ul>
            <Link href="/app/tools" className="mt-4 inline-block text-[13px] text-[var(--accent)]">
              Configure on Tools
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function WidgetSwatches({ theme }: { theme: Agent["theme"] }) {
  const colors = widgetThemeFrom(theme);
  const chips = [
    ["accent", colors.accent ?? "#ff4d19"],
    ["bg", colors.bg ?? "#12141a"],
    ["fg", colors.fg ?? "#f6f1e8"],
    ["panel", colors.panel ?? "#1a1d26"],
  ] as const;
  return (
    <div className="flex gap-2">
      {chips.map(([label, hex]) => (
        <span key={label} className="flex items-center gap-1.5 text-[11px] text-[var(--mute)]">
          <span
            className="h-4 w-4 rounded-sm border border-[var(--line)]"
            style={{ background: hex }}
            title={`${label} ${hex}`}
          />
          {label}
        </span>
      ))}
    </div>
  );
}
