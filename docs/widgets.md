# Widgets

`@signal/widget-core` ships a Preact + Shadow DOM chat widget.

## Script tag

```html
<script src="https://your-console.example/embed.js" data-key="pk_…" async></script>
```

Gzip budget: 40KB. Current build is checked by `pnpm --filter @signal/widget-core size`.

## Framework wrappers

```tsx
import { SignalChat } from "@signal/widget-react";
<SignalChat publishableKey="pk_…" apiBase="https://your-console.example" />
```

```ts
import { SignalChat } from "@signal/widget-vue";
```

```tsx
import { SignalChat, SignalScript } from "@signal/widget-next";
```

```ts
import { SignalChat } from "@signal/widget-nuxt";
```

## Theme contract

Set CSS variables on the host:

- `--sig-bg` `--sig-fg` `--sig-accent` `--sig-live` `--sig-line` `--sig-panel` `--sig-font`

The dashboard can also store a JSON `theme` on the agent, returned by `GET /api/public/v1/widget/:key`.
