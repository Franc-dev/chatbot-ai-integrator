"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "@signal/ui";
import { widgetThemeFrom } from "@signal/core/builtins";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ModelPicker } from "@/components/model-picker";
import { DEFAULT_MODELS, type CatalogModel } from "@/lib/models";

const DEFAULT_THEME = {
  accent: "#ff4d19",
  bg: "#12141a",
  fg: "#f6f1e8",
  panel: "#1a1d26",
} as const;

type ThemeKey = keyof typeof DEFAULT_THEME;
type WidgetColors = Record<ThemeKey, string>;

type Cred = { id: string; label: string; last4: string; provider: string; models?: string[] };
type Agent = {
  id: string;
  name: string;
  modelRef: string;
  credentialId: string | null;
  greeting: string | null;
  placeholder: string | null;
  theme?: unknown;
  credential?: Cred | null;
};
type PubKey = {
  id: string;
  start: string;
  agentId: string | null;
  createdAt: string;
  agentName: string | null;
};
type Model = CatalogModel;

const COLOR_FIELDS: { key: ThemeKey; label: string; hint: string }[] = [
  { key: "accent", label: "Accent", hint: "Launcher, send, user bubble · --sig-accent" },
  { key: "bg", label: "Background", hint: "Panel wash · --sig-bg" },
  { key: "fg", label: "Text", hint: "Copy and icons · --sig-fg" },
  { key: "panel", label: "Panel", hint: "Composer and chrome · --sig-panel" },
];

function toHex6(value: string, fallback: string) {
  const v = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return `#${v.slice(1).toLowerCase()}`;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    const r = v[1]!.toLowerCase();
    const g = v[2]!.toLowerCase();
    const b = v[3]!.toLowerCase();
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return fallback;
}

function colorsFromAgent(agent: Agent | undefined): WidgetColors {
  const stored = widgetThemeFrom(agent?.theme);
  return {
    accent: toHex6(stored.accent ?? "", DEFAULT_THEME.accent),
    bg: toHex6(stored.bg ?? "", DEFAULT_THEME.bg),
    fg: toHex6(stored.fg ?? "", DEFAULT_THEME.fg),
    panel: toHex6(stored.panel ?? "", DEFAULT_THEME.panel),
  };
}

export default function InstallPage() {
  const [origin, setOrigin] = useState("https://your-domain");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [keys, setKeys] = useState<PubKey[]>([]);
  const [creds, setCreds] = useState<Cred[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [agentId, setAgentId] = useState("");
  const [modelRef, setModelRef] = useState(DEFAULT_MODELS[0]!.value);
  const [credentialId, setCredentialId] = useState("");
  const [greeting, setGreeting] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [theme, setTheme] = useState<WidgetColors>({ ...DEFAULT_THEME });
  const [minted, setMinted] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [minting, setMinting] = useState(false);

  const agent = useMemo(() => agents.find((row) => row.id === agentId), [agents, agentId]);
  const snippet = `<script src="${origin}/embed.js" data-key="${minted ?? "YOUR_KEY"}" async></script>`;
  const credential = creds.find((row) => row.id === credentialId) ?? agent?.credential ?? null;

  function adopt(next: Agent) {
    setAgentId(next.id);
    setModelRef(next.modelRef);
    setCredentialId(next.credentialId ?? "");
    setGreeting(next.greeting ?? "");
    setPlaceholder(next.placeholder ?? "");
    setTheme(colorsFromAgent(next));
  }

  async function refresh() {
    const [install, credentials, catalog] = await Promise.all([
      api<{ agents: Agent[]; keys: PubKey[] }>("/api/v1/install"),
      api<{ credentials: Cred[] }>("/api/v1/credentials"),
      api<{ models: Model[] }>("/api/v1/models"),
    ]);
    setAgents(install.agents);
    setKeys(install.keys);
    setCreds(credentials.credentials);
    setModels(catalog.models);
    return install.agents;
  }

  useEffect(() => {
    setOrigin(window.location.origin);
    refresh()
      .then((rows) => {
        const current = rows[0];
        if (current) adopt(current);
      })
      .catch(() => undefined);
  }, []);

  async function save() {
    if (!agentId) return;
    setSaving(true);
    try {
      await api(`/api/v1/agents/${agentId}`, {
        method: "PATCH",
        body: JSON.stringify({
          modelRef,
          credentialId: credentialId || null,
          greeting: greeting || null,
          placeholder: placeholder || null,
          widgetTheme: theme,
        }),
      });
      toast.success("Widget settings saved. Reload the fixture to see the look.");
      const rows = await refresh();
      const current = rows.find((row) => row.id === agentId) ?? rows[0];
      if (current) adopt(current);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function mint() {
    if (!agentId) {
      toast.error("Choose an agent first");
      return;
    }
    setMinting(true);
    try {
      const data = await api<{ key: string }>("/api/v1/keys/publishable", {
        method: "POST",
        body: JSON.stringify({ agentId }),
      });
      setMinted(data.key);
      toast.success("Copy this key now. We will not show it again.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create a key");
    } finally {
      setMinting(false);
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <p className="text-[13px] text-[var(--mute)]">Install</p>
      <h1 className="display mt-2 text-5xl italic">Control the widget</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--mute)]">
        Pick the agent visitors talk to, the vault credential it uses, and the colors on the bubble.
        A publishable <code className="tabular text-[var(--fg)]">pk_</code> key is bound to that
        agent at mint time — the LLM secret stays on the agent, not the snippet.
      </p>

      {!agents.length ? (
        <div className="panel mt-8 rounded-sm p-8">
          <p className="text-[16px]">Create an agent first</p>
          <p className="mt-2 text-[14px] leading-6 text-[var(--mute)]">
            Install binds a publishable key to one agent. Add a chatbot, then come back here to
            style it and mint a key.
          </p>
          <Link
            href="/app/agents"
            className="pressable mt-4 inline-flex h-10 items-center rounded-sm bg-[var(--accent)] px-4 text-[14px] text-white"
          >
            Go to Agents
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <section className="panel rounded-sm p-6">
              <p className="text-[13px] text-[var(--accent)]">Agent</p>
              <h2 className="mt-1 text-[18px]">Who answers</h2>
              <p className="mt-2 text-[14px] leading-6 text-[var(--mute)]">
                The widget always chats as this agent. Prompt and tools stay on the agent editor.
              </p>
              <div className="mt-4 max-w-md">
                <Field label="Agent">
                  <Select
                    value={agentId || SELECT_NONE}
                    onValueChange={(value) => {
                      const next = agents.find((row) => row.id === value);
                      if (next) adopt(next);
                    }}
                  >
                    <SelectTrigger aria-label="Agent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              {agent ? (
                <Link
                  href={`/app/agents/${agent.id}`}
                  className="mt-3 inline-block text-[13px] text-[var(--accent)]"
                >
                  Open playground
                </Link>
              ) : null}
            </section>

            <section className="panel rounded-sm p-6">
              <p className="text-[13px] text-[var(--accent)]">Model</p>
              <h2 className="mt-1 text-[18px]">Credential and model</h2>
              <p className="mt-2 text-[14px] leading-6 text-[var(--mute)]">
                Chat uses this agent’s vault credential and model. Store secrets on{" "}
                <Link href="/app/keys" className="text-[var(--accent)]">
                  API keys
                </Link>
                — never on the publishable widget key.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ModelPicker
                  models={models}
                  modelRef={modelRef}
                  credentialId={credentialId || null}
                  credentials={creds}
                  onChange={(next) => {
                    setModelRef(next.modelRef);
                    setCredentialId(next.credentialId ?? "");
                  }}
                  onPersisted={() => refresh().then(() => undefined)}
                />
                <Field
                  label="Vault credential"
                  hint={
                    credential
                      ? `${credential.provider} · ••••${credential.last4}`
                      : "Add a key on API keys, then attach it here."
                  }
                >
                  <Select
                    value={credentialId || SELECT_NONE}
                    onValueChange={(value) => setCredentialId(value === SELECT_NONE ? "" : value)}
                  >
                    <SelectTrigger aria-label="Credential">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SELECT_NONE}>None (env fallback)</SelectItem>
                      {creds.map((row) => (
                        <SelectItem
                          key={row.id}
                          value={row.id}
                          hint={`${row.provider} ···${row.last4}`}
                        >
                          {row.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </section>

            <section className="panel rounded-sm p-6">
              <p className="text-[13px] text-[var(--accent)]">Look</p>
              <h2 className="mt-1 text-[18px]">Colors and copy</h2>
              <p className="mt-2 text-[14px] leading-6 text-[var(--mute)]">
                Stored on the agent as <code className="tabular">theme.widget</code>. Live mint stays
                for status only. Defaults: accent {DEFAULT_THEME.accent}, bg {DEFAULT_THEME.bg}, fg{" "}
                {DEFAULT_THEME.fg}, panel {DEFAULT_THEME.panel}.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {COLOR_FIELDS.map((field) => (
                  <ColorField
                    key={field.key}
                    label={field.label}
                    hint={field.hint}
                    value={theme[field.key]}
                    fallback={DEFAULT_THEME[field.key]}
                    onChange={(hex) => setTheme((current) => ({ ...current, [field.key]: hex }))}
                  />
                ))}
                <Field label="Greeting" hint="First assistant line in the bubble.">
                  <Input
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    placeholder="Hi — ask me anything."
                  />
                </Field>
                <Field label="Placeholder" hint="Composer hint text.">
                  <Input
                    value={placeholder}
                    onChange={(e) => setPlaceholder(e.target.value)}
                    placeholder="Ask anything"
                  />
                </Field>
              </div>
              <Button className="mt-5" type="button" loading={saving} onClick={() => void save()}>
                {saving ? "Saving…" : "Save widget settings"}
              </Button>
            </section>

            <section className="panel rounded-sm p-6">
              <p className="text-[13px] text-[var(--accent)]">Key</p>
              <h2 className="mt-1 text-[18px]">Publishable key</h2>
              <p className="mt-2 text-[14px] leading-6 text-[var(--mute)]">
                Mint a <code className="tabular">pk_</code> bound to{" "}
                {agent?.name ?? "the selected agent"}. Paste it on your site or the fixture. After
                saving look or minting, reload{" "}
                <Link href="/embed/fixture" className="text-[var(--accent)]">
                  /embed/fixture
                </Link>{" "}
                so the widget fetches config again.
              </p>
              <Button className="mt-4" type="button" loading={minting} onClick={() => void mint()}>
                {minting ? "Minting…" : "Mint publishable key"}
              </Button>
              {minted ? (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-sm border border-[var(--line)] bg-[#0e1014] px-3 py-2">
                  <code className="break-all text-[13px] text-[var(--fg)]">{minted}</code>
                  <Button size="sm" variant="ghost" type="button" onClick={() => void copy(minted)}>
                    Copy
                  </Button>
                </div>
              ) : null}
              <pre className="mt-4 overflow-auto rounded-sm bg-[#0e1014] p-4 text-[13px] leading-6">
                {snippet}
              </pre>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="ghost" type="button" onClick={() => void copy(snippet)}>
                  Copy snippet
                </Button>
                <a
                  href={minted ? `/embed/fixture?key=${encodeURIComponent(minted)}` : "/embed/fixture"}
                  className="pressable inline-flex h-10 items-center rounded-sm border border-[var(--line)] px-4 text-[14px]"
                >
                  Open preview
                </a>
              </div>
              {keys.length ? (
                <ul className="mt-6 divide-y divide-[var(--line)] overflow-hidden rounded-sm border border-[var(--line)]">
                  {keys.map((row) => (
                    <li key={row.id} className="flex items-center justify-between gap-3 bg-[#101217] px-4 py-3">
                      <div>
                        <code className="text-[13px]">{row.start}…</code>
                        <p className="mt-0.5 text-[13px] text-[var(--mute)]">
                          {row.agentName ?? "Unbound agent"}
                        </p>
                      </div>
                      <p className="tabular text-[12px] text-[var(--mute)]">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-6 text-[13px] text-[var(--mute)]">No publishable keys yet.</p>
              )}
            </section>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <SwatchPreview colors={theme} greeting={greeting} placeholder={placeholder} name={agent?.name} />
            <div className="panel rounded-sm p-5">
              <p className="text-[13px] text-[var(--mute)]">This key does not hold the LLM secret</p>
              <p className="mt-2 text-[14px] leading-6 text-[var(--mute)]">
                {credential
                  ? `${credential.label} · ${credential.provider} · ••••${credential.last4}`
                  : "No vault credential on this agent yet."}{" "}
                · {modelRef}
              </p>
            </div>
          </aside>
        </div>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Snippet title="React">{`import { SignalChat } from '@signal/widget-react'\n\n<SignalChat publishableKey="${minted ?? "YOUR_KEY"}" />`}</Snippet>
        <Snippet title="Vue">{`import { SignalChat } from '@signal/widget-vue'`}</Snippet>
        <Snippet title="Next.js">{`import { SignalChat } from '@signal/widget-next'`}</Snippet>
        <Snippet title="Nuxt">{`import { SignalChat } from '@signal/widget-nuxt'`}</Snippet>
      </div>
    </div>
  );
}

function ColorField({
  label,
  hint,
  value,
  fallback,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  fallback: string;
  onChange: (hex: string) => void;
}) {
  const hex = toHex6(value, fallback);
  const [text, setText] = useState(hex);
  useEffect(() => {
    setText(hex);
  }, [hex]);
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          aria-label={label}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-11 cursor-pointer rounded-sm border border-[var(--line)] bg-[#0e1014] p-1"
        />
        <Input
          value={text}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="tabular"
          onChange={(e) => {
            const next = e.target.value;
            setText(next);
            if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(next.trim())) {
              onChange(toHex6(next, fallback));
            }
          }}
          onBlur={() => setText(hex)}
        />
      </div>
    </Field>
  );
}

function SwatchPreview({
  colors,
  greeting,
  placeholder,
  name,
}: {
  colors: WidgetColors;
  greeting: string;
  placeholder: string;
  name?: string;
}) {
  return (
    <div
      className="overflow-hidden rounded-sm border"
      style={{
        background: colors.bg,
        color: colors.fg,
        borderColor: "color-mix(in oklab, var(--line) 80%, white 8%)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: colors.panel }}
      >
        <div>
          <p className="display text-[22px] italic leading-none">{name ?? "Signal"}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-[var(--live)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--live)]" />
            Ready
          </p>
        </div>
        <span
          className="grid h-8 w-8 place-items-center rounded-sm text-[12px] text-white"
          style={{ background: colors.accent }}
        >
          ●
        </span>
      </div>
      <div className="px-4 py-4 text-[14px] leading-6">{greeting || "Hi — ask me anything."}</div>
      <div className="flex justify-end px-4 pb-3">
        <span
          className="rounded-sm px-2.5 py-1 text-[12px] text-white"
          style={{ background: colors.accent }}
        >
          Hi
        </span>
      </div>
      <div className="px-3 pb-3">
        <div
          className="flex h-10 items-center justify-between rounded-sm px-3 text-[13px]"
          style={{ background: colors.panel, color: colors.fg }}
        >
          <span className="text-[var(--mute)]">{placeholder || "Ask anything"}</span>
          <span
            className="grid h-7 w-7 place-items-center rounded-sm text-[11px] text-white"
            style={{ background: colors.accent }}
          >
            →
          </span>
        </div>
      </div>
    </div>
  );
}

function Snippet({ title, children }: { title: string; children: string }) {
  return (
    <div className="panel rounded-sm p-4">
      <p className="text-[13px]">{title}</p>
      <pre className="mt-2 whitespace-pre-wrap text-[12px] leading-5 text-[var(--mute)]">{children}</pre>
    </div>
  );
}
