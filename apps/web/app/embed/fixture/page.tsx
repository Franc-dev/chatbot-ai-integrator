"use client";

import { useEffect, useState } from "react";

const COPY = {
  kicker: "Widget preview",
  title: "Try the chat on a blank page",
  body: "Paste a publishable key from Install. The orange button in the corner is the widget.",
  load: "Load widget",
  short: "This key looks truncated. Paste the full pk_ value from Install.",
} as const;

function cleanKey(value: string) {
  return value.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

type SignalWindow = Window & {
  SignalWidget?: {
    mount: (target: HTMLElement, props: { publishableKey: string }) => { unmount: () => void };
  };
};

export default function FixturePage() {
  const [key, setKey] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = cleanKey(new URLSearchParams(window.location.search).get("key") ?? "");
    setKey(fromQuery);
    if (!fromQuery) return;
    if (!fromQuery.startsWith("pk_") || fromQuery.length < 51) {
      setNotice(COPY.short);
      return;
    }

    let cancelled = false;
    let unmount: (() => void) | undefined;

    void import("@signal/widget-core")
      .then(({ mountWidget }) => {
        if (cancelled) return;
        document.querySelector("signal-widget")?.remove();
        const handle = mountWidget(document.body, { publishableKey: fromQuery });
        unmount = handle.unmount;
      })
      .catch(() => {
        if (cancelled) return;
        const script = document.createElement("script");
        script.src = "/embed.js";
        script.dataset.key = fromQuery;
        script.onload = () => {
          if (cancelled || document.querySelector("signal-widget")) return;
          (window as SignalWindow).SignalWidget?.mount(document.body, { publishableKey: fromQuery });
        };
        document.body.appendChild(script);
      });

    return () => {
      cancelled = true;
      unmount?.();
    };
  }, []);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const next = new URL(window.location.href);
    next.searchParams.set("key", cleanKey(key));
    window.location.href = next.toString();
  }

  return (
    <main
      className="min-h-screen bg-[#111318] px-8 py-12 text-[#f4f1ea]"
      style={{ wordSpacing: "0.18em", letterSpacing: 0, fontKerning: "none" }}
    >
      <div className="max-w-xl">
        <p className="text-[13px] text-[#9aa0ab]">{COPY.kicker}</p>
        <h1 className="display mt-2 text-5xl italic" style={{ wordSpacing: "0.22em", letterSpacing: 0 }}>
          {COPY.title}
        </h1>
        <p className="mt-4 text-[16px] leading-7 text-[#9aa0ab]">{COPY.body}</p>
        {notice ? <p className="mt-3 text-[14px] text-[#ff4d19]">{notice}</p> : null}
        <form onSubmit={apply} className="mt-8 flex gap-2">
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="pk_…"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="h-11 flex-1 rounded-sm border border-[#2c3038] bg-[#0e1014] px-3 text-[14px] outline-none"
            style={{ wordSpacing: "normal", letterSpacing: "0.02em" }}
          />
          <button type="submit" className="h-11 rounded-sm bg-[#ff4d19] px-4 text-[14px] text-white">
            {COPY.load}
          </button>
        </form>
      </div>
    </main>
  );
}
