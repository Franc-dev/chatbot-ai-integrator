export const widgetCss = `
:host {
  all: initial;
  --sig-bg: #12141a;
  --sig-fg: #f6f1e8;
  --sig-accent: #ff4d19;
  --sig-live: #3ee0b0;
  --sig-line: #2a2e38;
  --sig-panel: #1a1d26;
  --sig-mute: #9aa0ab;
  --sig-font: "Mona Sans", "Segoe UI", Tahoma, sans-serif;
  --sig-display: "Iowan Old Style", Palatino, Georgia, serif;
  --sig-ease: cubic-bezier(0.23, 1, 0.32, 1);
  --sig-ease-io: cubic-bezier(0.77, 0, 0.175, 1);
  --sig-dur: 200ms;
  --sig-press: 140ms;
  font-family: var(--sig-font);
  font-synthesis: none;
  line-height: 1.45;
  color: var(--sig-fg);
  -webkit-font-smoothing: antialiased;
}
:host * { box-sizing: border-box; }
button, input { font: inherit; letter-spacing: inherit; word-spacing: normal; }
button { color: inherit; }
:focus { outline: none; }
:focus-visible {
  outline: 2px solid var(--sig-accent);
  outline-offset: 2px;
}
.wrap {
  position: fixed; right: 20px; bottom: 20px; z-index: 2147483000;
  font-family: var(--sig-font);
  color: var(--sig-fg);
}
.launcher {
  width: 56px; height: 56px; border: 0; border-radius: 18px;
  background: var(--sig-accent); color: #fff; cursor: pointer;
  display: grid; place-items: center;
  box-shadow: 0 10px 28px color-mix(in oklab, var(--sig-accent) 38%, transparent);
  transition: transform var(--sig-press) var(--sig-ease), box-shadow var(--sig-press) var(--sig-ease);
}
.launcher svg { width: 22px; height: 22px; }
.ico-fill { fill: currentColor; }
.ico-line { fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; }
.launcher:hover { transform: translateY(-1px); }
.launcher:active { transform: scale(0.97); }
.launcher[aria-expanded="true"] {
  background: var(--sig-panel);
  color: var(--sig-fg);
  box-shadow: 0 8px 20px rgba(0,0,0,.35);
  border: 1px solid var(--sig-line);
}
.panel {
  position: absolute; right: 0; bottom: 72px;
  width: min(372px, calc(100vw - 28px));
  max-height: min(520px, calc(100vh - 112px));
  display: flex; flex-direction: column;
  background:
    radial-gradient(120% 70% at 0% -8%, color-mix(in oklab, var(--sig-accent) 20%, transparent), transparent 46%),
    linear-gradient(180deg, var(--sig-panel) 0%, var(--sig-bg) 42%);
  color: var(--sig-fg);
  border: 1px solid color-mix(in oklab, var(--sig-line) 80%, white 8%);
  border-radius: 22px;
  box-shadow:
    0 24px 60px rgba(0,0,0,.45),
    0 0 0 1px rgba(255,255,255,.03) inset;
  overflow: hidden;
  transform-origin: bottom right;
  animation: enter var(--sig-dur) var(--sig-ease);
}
.panel::after {
  content: "";
  position: absolute; inset: 0; pointer-events: none; border-radius: inherit;
  background: repeating-linear-gradient(-18deg, transparent, transparent 3px, rgba(255,255,255,.018) 3px, rgba(255,255,255,.018) 4px);
}
@keyframes enter {
  from { opacity: 0; transform: scale(0.96) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.head {
  position: relative; z-index: 1;
  padding: 14px 14px 12px 16px;
  display: flex; align-items: center; gap: 10px;
}
.brand { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
.mark {
  width: 30px; height: 30px; border-radius: 9px; flex: none;
  display: grid; place-items: center;
  background: color-mix(in oklab, var(--sig-accent) 18%, var(--sig-panel));
  color: var(--sig-accent);
}
.mark svg { width: 14px; height: 14px; fill: currentColor; }
.ident { min-width: 0; }
.title {
  font-family: var(--sig-display);
  font-size: 22px; font-style: italic; font-weight: 400;
  letter-spacing: 0.01em; word-spacing: 0.06em;
  line-height: 1.1; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
.pill {
  display: inline-flex; align-items: center; gap: 6px;
  margin-top: 4px; padding: 2px 8px 2px 6px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--sig-fg) 6%, transparent);
  color: var(--sig-mute);
  font-size: 11px; letter-spacing: 0.02em; word-spacing: 0.08em;
  line-height: 1.3;
}
.pill.on { color: color-mix(in oklab, var(--sig-live) 70%, var(--sig-fg)); }
.pill.off { color: var(--sig-mute); }
.live {
  width: 7px; height: 7px; border-radius: 99px; flex: none;
  background: var(--sig-mute);
}
.pill.on .live {
  background: var(--sig-live);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--sig-live) 22%, transparent);
  animation: pulse 1.8s var(--sig-ease-io) infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 3px color-mix(in oklab, var(--sig-live) 18%, transparent); }
  50% { box-shadow: 0 0 0 5px color-mix(in oklab, var(--sig-live) 8%, transparent); }
}
.close {
  width: 32px; height: 32px; border-radius: 10px; flex: none;
  display: grid; place-items: center; cursor: pointer;
  background: color-mix(in oklab, var(--sig-fg) 5%, transparent);
  border: 1px solid var(--sig-line); color: var(--sig-fg);
  transition: background var(--sig-press) var(--sig-ease), transform var(--sig-press) var(--sig-ease);
}
.close svg { width: 12px; height: 12px; stroke: currentColor; fill: none; stroke-width: 1.8; }
.close:hover { background: color-mix(in oklab, var(--sig-fg) 10%, transparent); }
.close:active { transform: scale(0.97); }
.transcript {
  position: relative; z-index: 1;
  flex: 1 1 auto; overflow: auto;
  min-height: 168px; max-height: 340px;
  padding: 4px 14px 8px;
  display: flex; flex-direction: column; gap: 10px;
}
.welcome {
  margin: auto 0 8px;
  padding: 18px 16px 16px;
  border-radius: 16px;
  background:
    linear-gradient(180deg, color-mix(in oklab, var(--sig-accent) 10%, var(--sig-panel)), var(--sig-panel));
  border: 1px solid color-mix(in oklab, var(--sig-accent) 18%, var(--sig-line));
}
.eyebrow {
  display: flex; align-items: center; gap: 7px;
  margin: 0 0 8px;
  color: color-mix(in oklab, var(--sig-live) 72%, var(--sig-fg));
  font-size: 11px; letter-spacing: 0.04em; word-spacing: 0.1em;
  text-transform: uppercase;
}
.eyebrow .live { background: var(--sig-live); }
.welcome p {
  margin: 0;
  font-size: 17px; line-height: 1.45;
  letter-spacing: 0.01em; word-spacing: 0.06em;
}
.row { display: flex; flex-direction: column; gap: 4px; max-width: 88%; }
.row.user { align-self: flex-end; align-items: flex-end; }
.row.assistant { align-self: flex-start; align-items: flex-start; }
.bubble {
  padding: 10px 13px;
  font-size: 14px; line-height: 1.5;
  letter-spacing: 0.01em; word-spacing: 0.05em;
  white-space: pre-wrap; overflow-wrap: anywhere;
}
.bubble.assistant {
  background: color-mix(in oklab, var(--sig-panel) 88%, white 4%);
  border: 1px solid var(--sig-line);
  border-radius: 4px 16px 16px 16px;
}
.bubble.user {
  background: color-mix(in oklab, var(--sig-accent) 88%, black);
  color: #fff;
  border: 0;
  border-radius: 16px 16px 4px 16px;
}
.stamp {
  font-size: 10px; letter-spacing: 0.03em; word-spacing: 0.08em;
  color: var(--sig-mute); padding: 0 4px;
}
.dots { display: flex; gap: 5px; padding: 2px 0; }
.dots i {
  display: block; width: 6px; height: 6px; border-radius: 99px;
  background: var(--sig-mute);
  animation: hop 1s var(--sig-ease-io) infinite;
}
.dots i:nth-child(2) { animation-delay: 120ms; }
.dots i:nth-child(3) { animation-delay: 240ms; }
@keyframes hop {
  0%, 80%, 100% { transform: translateY(0); opacity: .45; }
  40% { transform: translateY(-3px); opacity: 1; }
}
.foot { position: relative; z-index: 1; padding: 8px 12px 12px; }
.composer {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 5px 5px 14px;
  background: var(--sig-panel);
  border: 1px solid var(--sig-line);
  border-radius: 16px;
  transition: border-color var(--sig-press) var(--sig-ease), box-shadow var(--sig-press) var(--sig-ease);
}
.composer:focus-within {
  border-color: color-mix(in oklab, var(--sig-accent) 50%, var(--sig-line));
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--sig-accent) 18%, transparent);
}
.composer input {
  flex: 1; min-width: 0; background: transparent; border: 0;
  color: var(--sig-fg); padding: 9px 0; outline: none;
  letter-spacing: 0.01em; word-spacing: 0.08em;
}
.composer input::placeholder { color: var(--sig-mute); letter-spacing: 0.01em; word-spacing: 0.08em; }
.composer input:focus-visible { outline: none; }
.send {
  width: 40px; height: 40px; border: 0; border-radius: 12px; flex: none;
  display: grid; place-items: center; cursor: pointer;
  background: var(--sig-accent); color: #fff;
  transition: transform var(--sig-press) var(--sig-ease), opacity var(--sig-press) var(--sig-ease);
}
.send svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.send:hover { transform: translateY(-1px); }
.send:active { transform: scale(0.97); }
.send:disabled { opacity: .45; cursor: default; transform: none; }
@media (prefers-reduced-motion: reduce) {
  .panel { animation: none; }
  .launcher, .close, .send, .composer { transition: none; }
  .pill.on .live, .dots i { animation: none; }
}
`;
