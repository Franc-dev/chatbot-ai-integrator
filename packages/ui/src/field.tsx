import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-[13px] text-[var(--fg)]">{label}</span>
      {children}
      {hint ? <span className="text-[12px] leading-5 text-[var(--mute)]">{hint}</span> : null}
    </div>
  );
}

const control =
  "w-full rounded-sm border border-[var(--line)] bg-[#0e1014] px-3 py-2.5 text-[14px] text-[var(--fg)] outline-none placeholder:text-[var(--mute)] focus:border-[var(--accent)]";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(control, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(control, "min-h-28 resize-y", props.className)} />;
}
