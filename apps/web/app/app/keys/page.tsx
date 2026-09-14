"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Button,
  Field,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@signal/ui";
import { SUGGESTED_CUSTOM_MODELS, modelsForCustomCredential } from "@signal/contract";
import { toast } from "sonner";
import { api } from "@/lib/api";

type Cred = {
  id: string;
  provider: string;
  label: string;
  last4: string;
  zaiMode: string | null;
  baseUrl?: string | null;
  models?: string[];
  createdAt: string;
  keyVersion?: number;
  agents?: { id: string; name: string }[];
};

const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Gemini" },
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
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [zaiMode, setZaiMode] = useState<"general" | "coding">("general");
  const [models, setModels] = useState(SUGGESTED_CUSTOM_MODELS.join(", "));
  const [busy, setBusy] = useState(false);

  async function load() {
    setRows((await api<{ credentials: Cred[] }>("/api/v1/credentials")).credentials);
  }
  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function save(e: FormEvent) {
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
          models: provider === "custom" ? models : undefined,
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
            <>
              <Field label="Base URL" hint="OpenAI-compatible root, including /v1 if your server uses it.">
                <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://…" required />
              </Field>
              <div className="sm:col-span-2">
                <Field
                  label="Model ids"
                  hint="These appear in the agent Model dropdown. Comma-separated."
                >
                  <Textarea
                    value={models}
                    onChange={(e) => setModels(e.target.value)}
                    placeholder="local-gemma4, local-qwen-7b"
                    className="min-h-20 tabular"
                    spellCheck={false}
                  />
                </Field>
              </div>
            </>
          ) : null}
          <Field label="Label" hint="Name it so you can tell keys apart. Last four digits stay visible.">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="OpenRouter production"
              required
            />
          </Field>
          <Field label="API key">
            <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" required />
          </Field>
        </div>
        <div className="flex justify-end border-t border-[#2c3038] bg-[#101217] px-5 py-4 sm:px-6">
          <Button type="submit" loading={busy} className="min-w-[9rem]">
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
              <VaultRow key={r.id} cred={r} onChanged={load} />
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

const PROVIDER_LABEL: Record<string, string> = Object.fromEntries(
  PROVIDERS.map((item) => [item.value, item.label]),
);

function VaultRow({ cred, onChanged }: { cred: Cred; onChanged: () => Promise<void> }) {
  const [label, setLabel] = useState(cred.label);
  const [renaming, setRenaming] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [nextKey, setNextKey] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingModels, setEditingModels] = useState(false);
  const [modelsText, setModelsText] = useState(modelsForCustomCredential(cred.models).join(", "));
  const agents = cred.agents ?? [];
  const added = new Date(cred.createdAt).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  async function rename() {
    const next = label.trim();
    if (!next || next === cred.label) {
      setRenaming(false);
      setLabel(cred.label);
      return;
    }
    setBusy(true);
    try {
      await api(`/api/v1/credentials/${cred.id}`, {
        method: "PATCH",
        body: JSON.stringify({ label: next }),
      });
      toast.success("Label updated");
      setRenaming(false);
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not rename");
    } finally {
      setBusy(false);
    }
  }

  async function rotate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/api/v1/credentials/${cred.id}/rotate`, {
        method: "POST",
        body: JSON.stringify({ apiKey: nextKey }),
      });
      toast.success(`Rotated. Now ending ${nextKey.slice(-4)}.`);
      setNextKey("");
      setRotating(false);
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not rotate");
    } finally {
      setBusy(false);
    }
  }

  async function saveModels(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/api/v1/credentials/${cred.id}`, {
        method: "PATCH",
        body: JSON.stringify({ models: modelsText }),
      });
      toast.success("Model ids updated. Reload the agent playground to see them.");
      setEditingModels(false);
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save models");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    try {
      const result = await api<{ detachedAgents: string[] }>(`/api/v1/credentials/${cred.id}`, {
        method: "DELETE",
      });
      const detached = result.detachedAgents?.filter(Boolean) ?? [];
      toast.success(
        detached.length
          ? `Deleted. ${detached.join(", ")} now has no credential.`
          : "Deleted.",
      );
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  return (
    <li className="bg-[#101217] px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {renaming ? (
            <div className="flex max-w-sm gap-2">
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="h-9"
                aria-label="Key label"
              />
              <Button type="button" size="sm" disabled={busy} onClick={() => void rename()}>
                Save
              </Button>
            </div>
          ) : (
            <p className="text-[16px]">{cred.label}</p>
          )}
          <p className="mt-1 text-[13px] leading-6 text-[var(--mute)]">
            {PROVIDER_LABEL[cred.provider] ?? cred.provider}
            {cred.zaiMode ? ` · ${cred.zaiMode}` : ""}
            {" · "}
            <span className="tabular text-[var(--fg)]">••••{cred.last4}</span>
            {" · added "}
            {added}
            {cred.keyVersion && cred.keyVersion > 1 ? ` · rotation ${cred.keyVersion}` : ""}
          </p>
          <p className="mt-0.5 text-[13px] text-[var(--mute)]">
            {agents.length
              ? `Used by ${agents.map((agent) => agent.name).join(", ")}`
              : "Not attached to an agent yet"}
          </p>
          {cred.provider === "custom" ? (
            <p className="mt-0.5 text-[13px] text-[var(--mute)]">
              {cred.baseUrl ? `${cred.baseUrl} · ` : ""}
              <span className="tabular">{modelsForCustomCredential(cred.models).join(", ")}</span>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
          <button
            type="button"
            className="text-[var(--live)]"
            onClick={async () => {
              try {
                await api(`/api/v1/credentials/${cred.id}/test`, { method: "POST" });
                toast.success(`Reachable · ••••${cred.last4}`);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Test failed");
              }
            }}
          >
            Test
          </button>
          <button type="button" onClick={() => setRenaming((open) => !open)}>
            Rename
          </button>
          {cred.provider === "custom" ? (
            <button
              type="button"
              onClick={() => {
                setEditingModels((open) => !open);
                setRotating(false);
                setConfirmDelete(false);
              }}
            >
              Models
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setRotating((open) => !open);
              setConfirmDelete(false);
            }}
          >
            Rotate
          </button>
          <button
            type="button"
            className={confirmDelete ? "text-[var(--accent)]" : ""}
            disabled={busy}
            onClick={() => void remove()}
          >
            {confirmDelete ? "Confirm delete" : "Delete"}
          </button>
        </div>
      </div>
      {rotating ? (
        <form onSubmit={rotate} className="mt-4 max-w-md border-t border-[var(--line)] pt-4">
          <Field
            label="New API key"
            hint={`Replaces the secret for ••••${cred.last4}. Agents keep this credential.`}
          >
            <Input
              value={nextKey}
              onChange={(e) => setNextKey(e.target.value)}
              type="password"
              required
              minLength={8}
            />
          </Field>
          <div className="mt-3 flex gap-2">
            <Button type="submit" size="sm" loading={busy}>
              {busy ? "Rotating…" : "Save rotation"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setRotating(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
      {editingModels && cred.provider === "custom" ? (
        <form onSubmit={(event) => void saveModels(event)} className="mt-4 max-w-xl border-t border-[var(--line)] pt-4">
          <Field
            label="Model ids"
            hint="Comma-separated ids from your local server. They show up in the agent Model dropdown."
          >
            <Textarea
              value={modelsText}
              onChange={(e) => setModelsText(e.target.value)}
              className="min-h-20 tabular"
              spellCheck={false}
              required
            />
          </Field>
          <div className="mt-3 flex gap-2">
            <Button type="submit" size="sm" loading={busy}>
              {busy ? "Saving…" : "Save models"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditingModels(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </li>
  );
}
