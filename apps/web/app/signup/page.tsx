"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Field, Input } from "@signal/ui";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [org, setOrg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await authClient.signUp.email({ name, email, password });
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }
    const slug = org.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await authClient.organization.create({
      name: org || `${name}'s workspace`,
      slug: slug || `workspace-${Date.now()}`,
    });
    setBusy(false);
    window.location.href = "/app";
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <form onSubmit={submit} className="panel w-full max-w-md rounded-sm p-8">
        <p className="text-[13px] text-[var(--mute)]">New workspace</p>
        <h1 className="display mt-2 text-4xl italic">Create your console</h1>
        <div className="mt-8 grid gap-4">
          <Field label="Your name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Company">
            <Input value={org} onChange={(e) => setOrg(e.target.value)} required />
          </Field>
          <Field label="Email">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </Field>
          <Field label="Password">
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={8} required />
          </Field>
          <Button loading={busy} type="submit">
            {busy ? "Creating…" : "Create workspace"}
          </Button>
        </div>
        <p className="mt-6 text-[14px] text-[var(--mute)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--accent)]">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
