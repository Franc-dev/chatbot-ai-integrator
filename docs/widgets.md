# Widgets

`@signal/widget-core` ships a Preact + Shadow DOM chat widget.

## Script tag

```html
<script src="https://your-console.example/embed.js" data-key="pk_…" async></script>
```

Gzip budget: 40KB. Current build is checked by `pnpm --filter @signal/widget-core size`.

A publishable `pk_` key is bound to **one agent** at mint time on `/app/install`. Chat uses that agent’s vault `credentialId` and `modelRef`. The widget key is not an LLM API key and never carries plaintext provider secrets. Store those on `/app/keys` and attach them to the agent.

## Theme contract

Widget look comes from the bound agent’s `theme.widget`, returned by `GET /api/public/v1/widget`. The embed applies these as CSS variables on the widget wrap (only keys that are set):

| Token | Agent field | Default |
| --- | --- | --- |
| `--sig-accent` | `accent` | `#ff4d19` |
| `--sig-bg` | `bg` | `#12141a` |
| `--sig-fg` | `fg` | `#f6f1e8` |
| `--sig-panel` | `panel` | `#1a1d26` |

`--sig-live` stays mint for ready/live status. Set colors, greeting, and placeholder on **Install** (`/app/install`). The agent playground can edit the prompt; look is controlled from Install.

You can still override the same variables on the host if you need a one-off embed.

## Fixture

`/embed/fixture` loads whatever `pk_` you paste (or pass as `?key=`). After saving look or minting a new key, reload the fixture so the widget fetches config again.

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
