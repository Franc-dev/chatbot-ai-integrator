# Signal Console

Multi-tenant control panel for embeddable company chat agents. Next.js 16, Prisma 6.19 (`prisma-client-js`), Prisma Postgres, Better Auth, Vercel AI SDK, Tailwind v4.

## Local

```bash
pnpm install
cp .env.example .env
# fill ENCRYPTION_KEY, BETTER_AUTH_SECRET, JOB_DRAIN_SECRET
pnpm --filter @signal/db dev          # prisma dev (local Prisma Postgres)
# press h, copy DATABASE_URL into .env and packages/db/.env
pnpm db:generate
pnpm --filter @signal/db exec prisma db push
pnpm widget:build
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) (3001 avoids a common local collision on 3000). Create a desk, vault a provider key, commission an agent, then `/embed/fixture?key=pk_…`.

## Packages

- `apps/web` — console + HTTP APIs (no server actions)
- `packages/db` — Prisma schema / client
- `packages/core` — vault, providers, agent runtime, RAG, SSRF
- `packages/jobs` — Job table drain
- `packages/ui` — Signal Console design system
- `packages/widget-*` — Shadow DOM core + React/Vue/Next/Nuxt wrappers

See [docs/deployment.md](docs/deployment.md).
