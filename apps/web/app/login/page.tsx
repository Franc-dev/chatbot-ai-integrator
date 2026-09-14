"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Field, Input } from "@signal/ui";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await authClient.signIn.email({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    window.location.href = "/app";
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <form onSubmit={submit} className="panel w-full max-w-md rounded-sm p-8">
        <p className="text-[13px] text-[var(--mute)]">Welcome back</p>
        <h1 className="display mt-2 text-4xl italic">Sign in</h1>
        <div className="mt-8 grid gap-4">
          <Field label="Email">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </Field>
          <Field label="Password">
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </Field>
          <Button loading={busy} type="submit">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </div>
        <p className="mt-6 text-[14px] text-[var(--mute)]">
          Need a workspace?{" "}
          <Link href="/signup" className="text-[var(--accent)]">
            Create one
          </Link>
        </p>
      </form>
    </main>
  );
}
