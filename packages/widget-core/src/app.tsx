import { useEffect, useMemo, useRef, useState } from "preact/hooks";

export type WidgetProps = {
  publishableKey: string;
  apiBase?: string;
  visitorId?: string;
};

type Msg = { role: "user" | "assistant"; content: string; at: number };

function visitor() {
  const key = "sig_vid";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

function stamp(at: number) {
  return new Date(at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function IconBars() {
  return (
    <svg class="ico-fill" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="13" width="4" height="8" rx="1.2" />
      <rect x="10" y="8" width="4" height="13" rx="1.2" />
      <rect x="16.5" y="3" width="4" height="18" rx="1.2" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg class="ico-line" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function WidgetApp(props: WidgetProps) {
  const apiBase = props.apiBase ?? "";
  const [open, setOpen] = useState(false);
  const [cfg, setCfg] = useState<{ name: string; greeting?: string | null; placeholder?: string | null; agentId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const live = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const vid = useMemo(() => props.visitorId ?? (typeof localStorage !== "undefined" ? visitor() : "anon"), [props.visitorId]);

  const key = props.publishableKey.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  const titleId = "sig-widget-title";
  const greetingOnly = !error && messages.length === 1 && messages[0]?.role === "assistant";
  const status = error ? "Offline" : busy ? "Live" : "Ready";

  useEffect(() => {
    if (!key.startsWith("pk_") || key.length < 51) {
      setError("Publishable key looks incomplete. Paste the full pk_ key.");
      return;
    }
    fetch(`${apiBase}/api/public/v1/widget`, {
      headers: { "x-publishable-key": key },
    })
      .then(async (r) => {
        const body = await r.json().catch(() => null);
        if (!r.ok) {
          throw new Error(body?.error?.message ?? "Could not load this widget");
        }
        return body;
      })
      .then((data) => {
        setCfg(data);
        if (data.greeting) setMessages([{ role: "assistant", content: data.greeting, at: Date.now() }]);
      })
      .catch((e: Error) => setError(e.message));
  }, [apiBase, key]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    inputRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const el = live.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, busy]);

  async function send() {
    if (!input.trim() || !cfg || busy) return;
    const next = [...messages, { role: "user" as const, content: input.trim(), at: Date.now() }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/api/public/v1/chat`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-publishable-key": key,
        },
        body: JSON.stringify({
          agentId: cfg.agentId,
          visitorId: vid,
          messages: next.map(({ role, content }) => ({ role, content })),
        }),
      });
      if (res.status === 429) {
        setMessages((m) => [...m, { role: "assistant", content: "You've hit the rate limit. Try again in a moment.", at: Date.now() }]);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: { message: "Request failed" } }));
        if (body?.error?.code === "quota_exceeded") {
          setMessages((m) => [...m, { role: "assistant", content: "This workspace is over quota.", at: Date.now() }]);
          return;
        }
        throw new Error(body?.error?.message ?? "Chat failed");
      }
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistant = "";
      setMessages((m) => [...m, { role: "assistant", content: "", at: Date.now() }]);
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const json = JSON.parse(data) as { type?: string; delta?: string; text?: string };
              const piece = json.delta ?? json.text ?? "";
              if (piece) {
                assistant += piece;
                setMessages((m) => {
                  const copy = [...m];
                  const last = copy[copy.length - 1];
                  if (last) copy[copy.length - 1] = { ...last, role: "assistant", content: assistant };
                  return copy;
                });
              }
            } catch {
              assistant += data;
              setMessages((m) => {
                const copy = [...m];
                const last = copy[copy.length - 1];
                if (last) copy[copy.length - 1] = { ...last, role: "assistant", content: assistant };
                return copy;
              });
            }
          }
        }
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: e instanceof Error ? e.message : "Error", at: Date.now() }]);
    } finally {
      setBusy(false);
      live.current?.focus();
    }
  }

  return (
    <div class="wrap">
      {open ? (
        <section class="panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <header class="head">
            <div class="brand">
              <span class="mark" aria-hidden="true">
                <IconBars />
              </span>
              <div class="ident">
                <div class="title" id={titleId}>
                  {cfg?.name ?? "Signal"}
                </div>
                <div class={`pill ${error ? "off" : "on"}`}>
                  <span class="live" />
                  {status}
                </div>
              </div>
            </div>
            <button class="close" type="button" onClick={() => setOpen(false)} aria-label="Close chat">
              <IconClose />
            </button>
          </header>
          <div class="transcript" aria-live="polite" ref={live} tabIndex={-1}>
            {error ? (
              <div class="welcome">
                <p>{error}</p>
              </div>
            ) : greetingOnly ? (
              <div class="welcome">
                <p class="eyebrow">
                  <span class="live" />
                  Here with you
                </p>
                <p>{messages[0]?.content}</p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} class={`row ${m.role}`}>
                  <div class={`bubble ${m.role}`}>
                    {m.content ? (
                      m.content
                    ) : (
                      <span class="dots" aria-label="Typing">
                        <i />
                        <i />
                        <i />
                      </span>
                    )}
                  </div>
                  {m.content ? <time class="stamp">{stamp(m.at)}</time> : null}
                </div>
              ))
            )}
          </div>
          <form
            class="foot"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <div class="composer">
              <input
                ref={inputRef}
                value={input}
                onInput={(e) => setInput((e.target as HTMLInputElement).value)}
                placeholder={cfg?.placeholder ?? "Ask anything"}
                aria-label="Message"
                autoComplete="off"
                disabled={!!error}
              />
              <button class="send" type="submit" disabled={busy || !!error} aria-label="Send message">
                <IconSend />
              </button>
            </div>
          </form>
        </section>
      ) : null}
      <button
        class="launcher"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <IconClose /> : <IconBars />}
      </button>
    </div>
  );
}
