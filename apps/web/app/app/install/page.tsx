"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Field,
  SELECT_NONE,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@signal/ui";
import { toast } from "sonner";
import { api } from "@/lib/api";

type Agent = { id: string; name: string };

export default function InstallPage() {
  const [key, setKey] = useState<string | null>(null);
  const [origin, setOrigin] = useState("https://your-domain");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState("");
  const snippet = `<script src="${origin}/embed.js" data-key="${key ?? "YOUR_KEY"}" async></script>`;

  useEffect(() => {
    setOrigin(window.location.origin);
    api<{ agents: Agent[] }>("/api/v1/agents")
      .then((d) => setAgents(d.agents))
      .catch(() => undefined);
  }, []);

  async function mint() {
    try {
      const data = await api<{ key: string }>("/api/v1/keys/publishable", {
        method: "POST",
        body: JSON.stringify({ agentId: agentId || undefined }),
      });
      setKey(data.key);
      toast.success("Copy this key now. We will not show it again.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create a key");
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-[13px] text-[var(--mute)]">Install</p>
      <h1 className="display mt-2 text-5xl italic">Put the widget on your site</h1>
      <ol className="mt-8 space-y-6">
        <li className="panel rounded-sm p-6">
          <p className="text-[13px] text-[var(--accent)]">{"Step 1"}</p>
          <h2 className="mt-1 text-[18px]">{"Create a publishable key"}</h2>
          <p className="mt-2 text-[14px] leading-6 text-[var(--mute)]">
            {"This key is safe in the browser. It only starts chats for your workspace."}
          </p>
          {agents.length ? (
            <div className="mt-4 max-w-sm">
              <Field label="Agent">
                <Select
                  value={agentId || SELECT_NONE}
                  onValueChange={(value) => setAgentId(value === SELECT_NONE ? "" : value)}
                >
                  <SelectTrigger aria-label="Agent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SELECT_NONE}>First published agent</SelectItem>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          ) : null}
          <Button className="mt-4" type="button" onClick={() => void mint()}>
            {"Create key"}
          </Button>
          {key ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-sm border border-[var(--line)] bg-[#0e1014] px-3 py-2">
              <code className="tabular break-all text-[13px] text-[var(--live)]">{key}</code>
              <Button size="sm" variant="ghost" type="button" onClick={() => void copy(key)}>
                {"Copy"}
              </Button>
            </div>
          ) : null}
        </li>
        <li className="panel rounded-sm p-6">
          <p className="text-[13px] text-[var(--accent)]">{"Step 2"}</p>
          <h2 className="mt-1 text-[18px]">{"Paste one script tag"}</h2>
          <pre className="mt-4 overflow-auto rounded-sm bg-[#0e1014] p-4 text-[13px] leading-6">
            {snippet}
          </pre>
          <Button className="mt-3" variant="ghost" type="button" onClick={() => void copy(snippet)}>
            {"Copy snippet"}
          </Button>
        </li>
        <li className="panel rounded-sm p-6">
          <p className="text-[13px] text-[var(--accent)]">{"Step 3"}</p>
          <h2 className="mt-1 text-[18px]">{"Preview it here"}</h2>
          <p className="mt-2 text-[14px] leading-6 text-[var(--mute)]">
            {"Open the fixture page with your key to confirm the chat bubble works."}
          </p>
          <a
            href={key ? `/embed/fixture?key=${encodeURIComponent(key)}` : "/embed/fixture"}
            className="mt-4 inline-flex h-10 items-center rounded-sm bg-[var(--accent)] px-4 text-[14px] text-white"
          >
            {"Open preview"}
          </a>
        </li>
      </ol>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Snippet title="React">{`import { SignalChat } from '@signal/widget-react'\n\n<SignalChat publishableKey="${key ?? "YOUR_KEY"}" />`}</Snippet>
        <Snippet title="Vue">{`import { SignalChat } from '@signal/widget-vue'`}</Snippet>
        <Snippet title="Next.js">{`import { SignalChat } from '@signal/widget-next'`}</Snippet>
        <Snippet title="Nuxt">{`import { SignalChat } from '@signal/widget-nuxt'`}</Snippet>
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
