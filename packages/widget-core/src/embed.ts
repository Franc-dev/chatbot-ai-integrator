import { mountWidget } from "./mount";

function boot() {
  const script =
    (document.currentScript as HTMLScriptElement | null) ??
    document.querySelector<HTMLScriptElement>("script[data-key]");
  const key = script?.dataset.key?.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  if (!key) return;
  const apiBase = script?.dataset.api ?? "";
  mountWidget(document.body, { publishableKey: key, apiBase });
}

boot();

declare global {
  interface Window {
    SignalWidget?: { mount: typeof mountWidget };
  }
}

window.SignalWidget = { mount: mountWidget };
