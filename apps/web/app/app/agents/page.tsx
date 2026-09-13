"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Field, Input, Textarea } from "@signal/ui";
import { toast } from "sonner";
import { api } from "@/lib/api";

type Agent = { id: string; name: string; slug: string; modelRef: string; published: boolean };

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(
    "You represent this company. Answer from the knowledge base when you can. Be precise.",
  );

  async function load() {
    const data = await api<{ agents: Agent[] }>("/api/v1/agents");
    setAgents(data.agents);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/api/v1/agents", {
        method: "POST",
        body: JSON.stringify({
          name,
          slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          systemPrompt,
          modelRef: "openai/gpt-4.1-mini",
        }),
      });
      toast.success("Agent created");
      setName("");
      setSlug("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create agent");
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_380px]">
      <div>
        <p className="text-[13px] text-[var(--mute)]">Agents</p>
        <h1 className="display mt-2 text-5xl italic">Your chatbots</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-7 text-[var(--mute)]">
          Each agent is a branded chatbot. Give it a name, then add knowledge and turn on tools.
        </p>
        {agents.length ? (
          <ul className="mt-8 divide-y divide-[var(--line)] overflow-hidden rounded-sm border border-[var(--line)]">
            {agents.map((a) => (
              <li key={a.id} className="flex items-center justify-between bg-[#101217] px-5 py-4">
                <div>
                  <p className="text-[16px] ">{a.name}</p>
                  <p className="mt-0.5 text-[13px] text-[var(--mute)]">{a.modelRef}</p>
                </div>
                <Link href={`/app/agents/${a.id}`} className="text-[14px] text-[var(--accent)]">
                  Open playground
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="panel mt-8 rounded-sm p-8">
            <p className="text-[16px]">No agents yet</p>
            <p className="mt-2 text-[14px] leading-6 text-[var(--mute)]">
              Use the form to create your first one. You can attach knowledge and tools after.
            </p>
          </div>
        )}
      </div>
      <form onSubmit={create} className="panel h-fit rounded-sm p-6">
        <p className="text-[15px] ">Create an agent</p>
        <div className="mt-5 grid gap-4">
          <Field label="Name" hint="Shown in the widget header.">
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Support" />
          </Field>
          <Field label="URL slug" hint="Optional. Used in your own links.">
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="support" />
          </Field>
          <Field label="Instructions">
            <Textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} />
          </Field>
          <Button type="submit">Create agent</Button>
        </div>
      </form>
    </div>
  );
}
