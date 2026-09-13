"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Field,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@signal/ui";
import { toast } from "sonner";
import { api } from "@/lib/api";

type Cred = { id: string; provider: string; label: string; last4: string; zaiMode: string | null };

const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "vercel-gateway", label: "Vercel AI Gateway" },
  {
    value: "zai",
    label: "z.ai",
    hint: "General /api/paas/v4 or Coding Plan /api/coding/paas/v4",
  },
  { value: "custom", label: "Custom OpenAI-compatible" },
] as const;

export default function KeysPage() {
  const [rows, setRows] = useState<Cred[]>([]);
  const [provider, setProvider] = useState("openai");
  const [label, setLabel] = useState("Production");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [zaiMode, setZaiMode] = useState<"general" | "coding">("general");
  const [busy, setBusy] = useState(false);

  async function load() {
    setRows((await api<{ credentials: Cred[] }>("/api/v1/credentials")).credentials);
  }
  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/v1/credentials", {
        method: "POST",
        body: JSON.stringify({
          provider,
          label,
          apiKey,
          baseUrl: provider === "custom" ? baseUrl : undefined,
          zaiMode: provider === "zai" ? zaiMode : undefined,
        }),
      });
      toast.success("Saved. We never show the full key again.");
      setApiKey("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save key");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[920px] pb-16">
      <header>
        <p className="text-[13px] text-[var(--mute)]">API keys</p>
        <h1 className="display mt-2 text-5xl italic">Your model providers</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-7 text-[var(--mute)]">
          Keys are sealed with AES-256-GCM. Agents use these to call OpenAI, Anthropic, and others.
        </p>
      </header>

      <form
        onSubmit={save}
        className="relative mt-10 overflow-hidden rounded-sm border border-[#2c3038] bg-[#14161b]"
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-[color-mix(in_oklab,var(--accent)_70%,transparent)]"
        />
        <div className="border-b border-[#2c3038] px-5 py-5 sm:px-6">
          <p className="tabular text-[11px] tracking-[0.14em] text-[var(--mute)]">01 · SEAL</p>
          <p className="mt-1 text-[16px]">Add a key</p>
        </div>
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
          <Field label="Provider">
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger aria-label="Provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((item) => (
                  <SelectItem key={item.value} value={item.value} hint={"hint" in item ? item.hint : undefined}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {provider === "zai" ? (
            <Field label="z.ai endpoint" hint="Coding Plan keys only work on the coding endpoint.">
              <Select
                value={zaiMode}
                onValueChange={(value) => setZaiMode(value as "general" | "coding")}
              >
                <SelectTrigger aria-label="z.ai endpoint">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general" hint="/api/paas/v4">
                    General
                  </SelectItem>
                  <SelectItem value="coding" hint="/api/coding/paas/v4">
                    Coding Plan
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          ) : null}
          {provider === "custom" ? (
            <Field label="Base URL">
              <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://…" />
            </Field>
          ) : null}
          <Field label="Label">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
          <Field label="API key">
            <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" required />
          </Field>
        </div>
        <div className="flex justify-end border-t border-[#2c3038] bg-[#101217] px-5 py-4 sm:px-6">
          <Button type="submit" disabled={busy} className="min-w-[9rem]">
            {busy ? "Saving…" : "Save key"}
          </Button>
        </div>
      </form>

      <section className="mt-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="display text-3xl italic">Vault</h2>
          <p className="tabular text-[12px] text-[var(--mute)]">
            {rows.length ? `${rows.length} sealed` : "No keys yet"}
          </p>
        </div>
        {rows.length ? (
          <ul className="mt-5 divide-y divide-[var(--line)] overflow-hidden rounded-sm border border-[var(--line)]">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between bg-[#101217] px-5 py-4">
                <div>
                  <p className="text-[16px]">{r.label}</p>
                  <p className="mt-0.5 text-[13px] text-[var(--mute)]">
                    {r.provider}
                    {r.zaiMode ? ` / ${r.zaiMode}` : ""} ···{r.last4}
                  </p>
                </div>
                <button
                  className="text-[14px] text-[var(--live)]"
                  onClick={async () => {
                    await api(`/api/v1/credentials/${r.id}/test`, { method: "POST" });
                    toast.success("Reachable");
                  }}
                >
                  Test
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-5 rounded-sm border border-dashed border-[#2c3038] px-5 py-8">
            <p className="text-[16px]">No provider keys yet</p>
            <p className="mt-2 max-w-lg text-[14px] leading-6 text-[var(--mute)]">
              Add at least one key so an agent can answer. z.ai has separate general and coding
              endpoints.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
