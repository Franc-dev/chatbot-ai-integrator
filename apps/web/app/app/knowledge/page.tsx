"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Button,
  Field,
  Input,
  RichTextEditor,
  SELECT_NONE,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@signal/ui";
import { toast } from "sonner";
import { api } from "@/lib/api";

type Source = {
  id: string;
  title: string;
  kind: string;
  status: string;
  chunkCount: number;
  error: string | null;
  agentId: string | null;
  uri: string | null;
};

type Agent = { id: string; name: string };

const KINDS = [
  { value: "text", label: "Notes", hint: "Paste FAQs, policies, or product copy." },
  { value: "faq", label: "FAQ", hint: "Questions and answers the bot should recite." },
  { value: "url", label: "URL", hint: "Fetch and index a live page." },
  { value: "sitemap", label: "Sitemap", hint: "Crawl up to twenty pages from a sitemap." },
  { value: "file", label: "File", hint: "Upload a text, Markdown, or CSV note." },
] as const;

const KIND_LABEL: Record<string, string> = Object.fromEntries(
  KINDS.map((item) => [item.value, item.label]),
);

function isUrlKind(kind: string) {
  return kind === "url" || kind === "sitemap";
}

function looksLikeUrl(uri?: string | null) {
  return !!uri && /^https?:\/\//i.test(uri.trim());
}

function usesEditor(kind: string) {
  return kind === "text" || kind === "faq";
}

export default function KnowledgePage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [kind, setKind] = useState("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [uri, setUri] = useState("");
  const [agentId, setAgentId] = useState("");
  const [fileName, setFileName] = useState("");
  const [editorKey, setEditorKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [repairUri, setRepairUri] = useState<Record<string, string>>({});

  async function load() {
    const [k, a] = await Promise.all([
      api<{ sources: Source[] }>("/api/v1/knowledge"),
      api<{ agents: Agent[] }>("/api/v1/agents"),
    ]);
    setSources(k.sources);
    setAgents(a.agents);
  }

  useEffect(() => {
    load().catch(() => undefined);
    const t = setInterval(() => load().catch(() => undefined), 4000);
    return () => clearInterval(t);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const bodyContent = isUrlKind(kind) ? "" : content;
    const bodyUri = isUrlKind(kind) ? uri : "";
    if (usesEditor(kind) && !bodyContent.trim()) {
      toast.error("Write something before adding it to knowledge.");
      return;
    }
    if (isUrlKind(kind) && !bodyUri.trim()) {
      toast.error("Add the URL to fetch.");
      return;
    }
    if (kind === "file" && !bodyContent.trim()) {
      toast.error("Choose a text file to index.");
      return;
    }
    setBusy(true);
    try {
      await api("/api/v1/knowledge", {
        method: "POST",
        body: JSON.stringify({
          kind,
          title,
          content: bodyContent,
          uri: bodyUri,
          agentId: agentId || undefined,
        }),
      });
      toast.success("Queued. The agent can search this after it is ready.");
      setContent("");
      setUri("");
      setFileName("");
      setEditorKey((key) => key + 1);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add source");
    } finally {
      setBusy(false);
    }
  }

  async function reindex(source: Source) {
    const nextUri = (repairUri[source.id] ?? source.uri ?? "").trim();
    if (isUrlKind(source.kind) && !looksLikeUrl(nextUri)) {
      toast.error("Paste the page URL, then index again.");
      return;
    }
    try {
      await api(`/api/v1/knowledge/${source.id}/reindex`, {
        method: "POST",
        body: JSON.stringify({ uri: nextUri || undefined }),
      });
      toast.success("Queued again.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reindex");
    }
  }

  const ready = sources.filter((s) => s.status === "ready").length;
  const kindMeta = KINDS.find((item) => item.value === kind);

  return (
    <div className="mx-auto max-w-[920px] pb-16">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] text-[var(--mute)]">Knowledge</p>
          <h1 className="display mt-2 text-5xl italic">What the chatbot knows</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-7 text-[var(--mute)]">
            This desk is where sources become searchable.{" "}
            <Link href="/app/tools" className="text-[var(--accent)]">
              Enable the tool
            </Link>{" "}
            so a visitor’s question can hit the ledger.
          </p>
        </div>
        <p className="tabular text-[13px] leading-5 text-[var(--mute)] sm:text-right">
          <span className={ready ? "text-[var(--live)]" : ""}>{ready} ready</span>
          <span className="mx-2 text-[#2c3038]">/</span>
          {sources.length} source{sources.length === 1 ? "" : "s"}
        </p>
      </header>

      <form
        onSubmit={submit}
        className="relative mt-10 overflow-hidden rounded-sm border border-[#2c3038] bg-[#14161b]"
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-[color-mix(in_oklab,var(--accent)_70%,transparent)]"
        />
        <div className="flex flex-col gap-5 border-b border-[#2c3038] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="tabular text-[11px] tracking-[0.14em] text-[var(--mute)]">01 · COMPOSE</p>
            <p className="mt-1 text-[16px]">Add a source</p>
          </div>
          <div className="grid w-full gap-3 sm:max-w-[16rem]">
            <Field label="Type">
              <Select
                value={kind}
                onValueChange={(value) => {
                  setKind(value);
                  setContent("");
                  setUri("");
                  setFileName("");
                  setEditorKey((key) => key + 1);
                }}
              >
                <SelectTrigger aria-label="Type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KINDS.map((item) => (
                    <SelectItem key={item.value} value={item.value} hint={item.hint}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <Field label="Title">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={kind === "faq" ? "Hours, shipping, returns…" : "Name this source"}
              className="h-12 text-[16px]"
            />
          </Field>

          <div className="mt-5">
            {usesEditor(kind) ? (
              <Field
                label="Content"
                hint={
                  kind === "faq"
                    ? "Write the question, then the answer. Headings and lists are kept."
                    : "Headings and lists are kept when this source is indexed."
                }
              >
                <RichTextEditor
                  key={`${kind}-${editorKey}`}
                  placeholder={
                    kind === "faq"
                      ? "Q: What are your hours? A: 9–5 on weekdays."
                      : "Write the notes, policy, or product copy the agent should know…"
                  }
                  onMarkdownChange={setContent}
                />
              </Field>
            ) : isUrlKind(kind) ? (
              <Field
                label="URL"
                hint={
                  kind === "sitemap"
                    ? "We’ll pull up to twenty <loc> pages from the sitemap."
                    : "The page is fetched and stripped to text on ingest."
                }
              >
                <Input
                  value={uri}
                  onChange={(e) => setUri(e.target.value)}
                  placeholder="https://"
                  inputMode="url"
                  className="h-12 tabular text-[14px]"
                />
              </Field>
            ) : (
              <Field label="File" hint="Drop a text note. The file is read here, then queued like any other source.">
                <FileStage
                  fileName={fileName}
                  onFile={async (file) => {
                    const text = await file.text();
                    setContent(text);
                    setFileName(file.name);
                    if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ""));
                  }}
                />
              </Field>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-[#2c3038] bg-[#101217] px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div className="grid w-full gap-1.5 sm:max-w-xs">
            <p className="tabular text-[11px] tracking-[0.14em] text-[var(--mute)]">02 · ROUTE</p>
            <Field label="Agent" hint="Leave blank to share this source with every agent.">
              <Select
                value={agentId || SELECT_NONE}
                onValueChange={(value) => setAgentId(value === SELECT_NONE ? "" : value)}
              >
                <SelectTrigger aria-label="Agent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_NONE}>All agents</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <p className="max-w-xs text-[12px] leading-5 text-[var(--mute)] sm:text-right">
              {kindMeta?.hint}
            </p>
            <Button type="submit" loading={busy} className="min-w-[11rem]">
              {busy ? "Queuing…" : "Add to knowledge"}
            </Button>
          </div>
        </div>
      </form>

      <section className="mt-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="display text-3xl italic">Ledger</h2>
          <p className="tabular text-[12px] text-[var(--mute)]">
            {sources.length ? "Indexed for Search knowledge" : "Waiting on the first source"}
          </p>
        </div>
        {sources.length ? (
          <ul className="mt-5 divide-y divide-[var(--line)] overflow-hidden rounded-sm border border-[var(--line)]">
            {sources.map((s) => {
              const missingUrl = isUrlKind(s.kind) && !looksLikeUrl(s.uri);
              const canRetry = s.status === "error" || (s.status === "ready" && s.chunkCount === 0);
              return (
              <li key={s.id} className="flex flex-col gap-3 bg-[#101217] px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[16px]">{s.title}</p>
                  <p className="mt-0.5 text-[13px] text-[var(--mute)]">
                    {KIND_LABEL[s.kind] ?? s.kind} · {s.chunkCount} passages
                    {s.agentId
                      ? ` · ${agents.find((a) => a.id === s.agentId)?.name ?? "one agent"}`
                      : " · all agents"}
                    {s.error ? ` · ${s.error}` : ""}
                  </p>
                  {missingUrl && canRetry ? (
                    <div className="mt-3 max-w-md">
                      <Input
                        value={repairUri[s.id] ?? ""}
                        onChange={(e) => setRepairUri((current) => ({ ...current, [s.id]: e.target.value }))}
                        placeholder="https://example.com/about"
                        inputMode="url"
                        className="h-10 tabular text-[13px]"
                        aria-label={`URL for ${s.title}`}
                      />
                    </div>
                  ) : looksLikeUrl(s.uri) ? (
                    <p className="mt-1 truncate text-[12px] tabular text-[var(--mute)]">{s.uri}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {canRetry ? (
                    <button
                      type="button"
                      className="text-[13px] text-[var(--accent)]"
                      onClick={() => void reindex(s)}
                    >
                      Index again
                    </button>
                  ) : null}
                  <span
                    className={`tabular text-[13px] ${s.status === "ready" && s.chunkCount > 0 ? "text-[var(--live)]" : "text-[var(--mute)]"}`}
                  >
                    {s.status}
                  </span>
                </div>
              </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-5 rounded-sm border border-dashed border-[#2c3038] px-5 py-8">
            <p className="text-[16px]">No sources yet</p>
            <p className="mt-2 max-w-lg text-[14px] leading-6 text-[var(--mute)]">
              Add a FAQ or a page of copy in the desk above. Until something is ready, Search
              knowledge has nothing to return.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function FileStage({
  fileName,
  onFile,
}: {
  fileName: string;
  onFile: (file: File) => void | Promise<void>;
}) {
  const [over, setOver] = useState(false);

  async function take(file?: File | null) {
    if (!file) return;
    await onFile(file);
  }

  return (
    <label
      className={`relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed bg-[#0e1014] px-6 text-center transition-[border-color] duration-[var(--dur-press)] ease-[var(--ease-out)] ${
        over ? "border-[var(--accent)]" : "border-[#2c3038]"
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        void take(event.dataTransfer.files[0]);
      }}
    >
      <input
        type="file"
        accept=".txt,.md,.markdown,.csv,.json,.html,.htm,text/plain,text/markdown,text/csv"
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(event) => {
          void take(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <p className="tabular text-[11px] tracking-[0.14em] text-[var(--mute)]">DROP OR BROWSE</p>
      <p className="mt-2 text-[16px]">{fileName || "Text file for the knowledge base"}</p>
      <p className="mt-2 max-w-sm text-[13px] leading-5 text-[var(--mute)]">
        .txt, .md, .csv — the file body is queued the same way as notes.
      </p>
    </label>
  );
}
