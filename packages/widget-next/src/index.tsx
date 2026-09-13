"use client";

export { SignalChat } from "@signal/widget-react";

export function SignalScript({ publishableKey, src }: { publishableKey: string; src: string }) {
  return <script src={src} data-key={publishableKey} async />;
}
