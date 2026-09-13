"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  BookOpen,
  Bot,
  Gauge,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Menu,
  Puzzle,
  Sparkles,
  X,
} from "@/lib/nav-icons";

const NAV = [
  { label: "Overview", href: "/app", icon: LayoutDashboard },
  { label: "Agents", href: "/app/agents", icon: Bot },
  { label: "API keys", href: "/app/keys", icon: KeyRound },
  { label: "Knowledge", href: "/app/knowledge", icon: BookOpen },
  { label: "Tools", href: "/app/tools", icon: Puzzle },
  { label: "Inbox", href: "/app/inbox", icon: Inbox },
  { label: "Usage", href: "/app/usage", icon: Gauge },
  { label: "Install", href: "/app/install", icon: Sparkles },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [org, setOrg] = useState("Your workspace");
  const [usage, setUsage] = useState<{ messages: number; costMicros: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useLayoutEffect(() => {
    document.documentElement.classList.add("app-lock");
    return () => document.documentElement.classList.remove("app-lock");
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (mq.matches) setMenuOpen(false);
    };
    closeOnDesktop();
    mq.addEventListener("change", closeOnDesktop);
    return () => mq.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      const { data } = await authClient.organization.list();
      const first = data?.[0];
      if (first) {
        setOrg(first.name);
        await authClient.organization.setActive({ organizationId: first.id });
      }
      const res = await fetch("/api/v1/me");
      const body = await res.json().catch(() => null);
      if (!cancelled && res.ok && body?.usage) setUsage(body.usage);
    }
    boot().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const nav = <NavList path={path} org={org} usage={usage} onNavigate={() => setMenuOpen(false)} />;

  return (
    <div className="flex h-svh overflow-hidden">
      <aside className="hidden h-full w-[240px] shrink-0 flex-col overflow-hidden border-r border-[var(--line)] bg-[#101217] px-4 py-5 md:flex">
        {nav}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--line)] bg-[#101217] px-4 py-3 md:hidden">
          <Link href="/app" className="min-w-0">
            <p className="display text-[28px] italic leading-none">Signal</p>
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-[var(--line)] text-[var(--fg)]"
            aria-label="Open navigation"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>
        </header>
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-8 lg:px-12">
          {children}
        </main>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-[240px] shrink-0 flex-col overflow-hidden bg-[#101217] px-4 py-5">
            <div className="mb-2 flex shrink-0 justify-end">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-[var(--line)]"
                aria-label="Close navigation"
                onClick={() => setMenuOpen(false)}
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function NavList({
  path,
  org,
  usage,
  onNavigate,
}: {
  path: string;
  org: string;
  usage: { messages: number; costMicros: number } | null;
  onNavigate: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <Link href="/app" onClick={onNavigate} className="shrink-0">
        <p className="display text-3xl italic leading-none">Signal</p>
        <p className="mt-1 text-[12px] text-[var(--mute)]">Company chat console</p>
      </Link>
      <nav className="mt-8 flex flex-col gap-1">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = path === href || (href !== "/app" && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex w-full items-center gap-3 whitespace-nowrap rounded-sm px-3 py-2.5 text-[14px] leading-5 ${
                active ? "bg-[var(--line)] text-[var(--fg)]" : "text-[var(--fg)] hover:bg-white/5"
              }`}
            >
              <Icon size={16} strokeWidth={1.75} className="shrink-0" aria-hidden />
              <span className="whitespace-nowrap">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto shrink-0 rounded-sm border border-[var(--line)] px-3 py-3">
        <p className="truncate text-[13px] leading-5">{org}</p>
        <p className="mt-1 tabular text-[12px] leading-5 text-[var(--live)]">
          {usage
            ? `${usage.messages} messages · $${((usage.costMicros ?? 0) / 1_000_000).toFixed(4)}`
            : "Usage appears after the first chat"}
        </p>
      </div>
    </div>
  );
}
