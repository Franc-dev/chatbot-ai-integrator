"use client";

import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { cn } from "@signal/ui";
import { formatStamp } from "@/lib/format";

export type DeskMsg = {
  role: string;
  content: string;
  at?: string;
};

export function DeskTranscript({
  messages,
  streaming,
  empty,
  className,
}: {
  messages: DeskMsg[];
  streaming?: boolean;
  empty?: ReactNode;
  className?: string;
}) {
  const last = messages.at(-1);
  const showDots = streaming && last?.role === "assistant" && !last.content;
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, streaming]);

  return (
    <div ref={scroller} className={cn("flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-5 py-5", className)}>
      {!messages.length ? empty : null}
      {messages.map((message, index) => {
        const user = message.role === "user";
        const system = message.role !== "user" && message.role !== "assistant";
        if (system) {
          return (
            <p key={`${message.role}-${index}`} className="text-center text-[12px] text-[var(--mute)]">
              {message.content}
            </p>
          );
        }
        return (
          <div
            key={`${message.role}-${index}`}
            className={cn("flex max-w-[min(42rem,88%)] flex-col gap-1", user ? "ml-auto items-end" : "items-start")}
          >
            <div
              className={cn(
                "whitespace-pre-wrap px-3.5 py-2.5 text-[14px] leading-6",
                user
                  ? "rounded-[16px_16px_4px_16px] bg-[color-mix(in_oklab,var(--accent)_88%,black)] text-white"
                  : "rounded-[4px_16px_16px_16px] border border-[var(--line)] bg-[color-mix(in_oklab,var(--panel)_88%,white_4%)]",
              )}
            >
              {!message.content && showDots && index === messages.length - 1 ? <TypingDots /> : message.content}
            </div>
            {message.at && message.content ? (
              <time className="tabular px-1 text-[10px] tracking-wide text-[var(--mute)]">
                {formatStamp(message.at)}
              </time>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-0.5" aria-label="Typing">
      <i className="sig-dot size-1.5 rounded-full bg-[var(--mute)]" />
      <i className="sig-dot size-1.5 rounded-full bg-[var(--mute)] [animation-delay:120ms]" />
      <i className="sig-dot size-1.5 rounded-full bg-[var(--mute)] [animation-delay:240ms]" />
    </span>
  );
}

export function DeskComposer({
  value,
  onChange,
  onSend,
  placeholder,
  disabled,
  busy,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  busy?: boolean;
}) {
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim() || disabled || busy) return;
    onSend();
  }

  return (
    <form onSubmit={submit} className="shrink-0 border-t border-[var(--line)] p-3">
      <div className="flex items-end gap-2 rounded-2xl border border-[var(--line)] bg-[var(--panel)] py-1.5 pl-4 pr-1.5 transition-[border-color,box-shadow] duration-[var(--dur-press)] ease-[var(--ease-out)] focus-within:border-[color-mix(in_oklab,var(--accent)_50%,var(--line))] focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_18%,transparent)]">
        <textarea
          value={value}
          rows={1}
          disabled={disabled}
          placeholder={placeholder ?? "Ask anything"}
          aria-label="Message"
          className="max-h-32 min-h-11 flex-1 resize-none bg-transparent py-2.5 text-[14px] leading-6 outline-none placeholder:text-[var(--mute)]"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (!value.trim() || disabled || busy) return;
              onSend();
            }
          }}
        />
        <button
          type="submit"
          disabled={disabled || busy || !value.trim()}
          aria-label="Send"
          className="pressable grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--accent)] text-white disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </form>
  );
}
