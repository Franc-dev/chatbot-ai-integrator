# Deployment and secret rotation

## Hosting

- App: Vercel (Next.js 16, Node runtime, fluid compute, `maxDuration` 300 on chat and drain).
- Database: Prisma Postgres. Copy both the pooled `DATABASE_URL` and the direct `DIRECT_URL` into Vercel env.
- Jobs: `POST /api/internal/jobs/drain` kicked by `waitUntil` after enqueue. Cron at 03:00 UTC is a daily backstop (Hobby-safe).

## Required env

| Name | Notes |
| --- | --- |
| `DATABASE_URL` | Pooled Prisma Postgres URL |
| `DIRECT_URL` | Direct URL for migrations |
| `BETTER_AUTH_SECRET` | ≥16 random chars |
| `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` | Public origin |
| `ENCRYPTION_KEY` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `JOB_DRAIN_SECRET` | Long random string |

## First deploy

Vercel's **Root Directory** must be `apps/web`, otherwise framework detection fails with
"No Next.js version detected" — the repo root has no `next` dependency. `apps/web/vercel.json`
then steps back up to the workspace root for both install and build, so pnpm links the whole
monorepo and Turbo runs `prisma generate` before `next build`. `packages/db` also carries a
`postinstall` that generates the client, so any `pnpm install` leaves usable Prisma types.

The database needs the `vector` extension, so pick a Postgres that offers pgvector
(Prisma Postgres, Neon, Supabase).

`prisma/migrations/0001_init` is only the HNSW index, not a table baseline. Create the
schema with `db push` against the production direct URL, once:

```bash
pnpm install
pnpm --filter @signal/db generate

# point at production, not the local prisma dev instance
$env:DATABASE_URL="<pooled url>"; $env:DIRECT_URL="<direct url>"
pnpm --filter @signal/db exec prisma db push
pnpm --filter @signal/db exec prisma db execute `
  --file prisma/migrations/0001_init/migration.sql --schema prisma/schema.prisma

pnpm widget:build
vercel link
vercel --prod
```

Set every env var below in the Vercel project first; `getEnv()` throws at boot when one
is missing. `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` must be the deployed origin, or
sign-in cookies and the widget snippet point at localhost.

A custom OpenAI-compatible credential pointing at `localhost` will not resolve from
Vercel. Give the local server a public hostname or keep that agent on a hosted provider.

## Rotate the envelope key

1. Generate a new `ENCRYPTION_KEY`.
2. Write a one-off script that `openSecret`s each `ProviderCredential` with the old key and `sealSecret`s with the new one, incrementing `keyVersion`.
3. Swap the env var, then redeploy. Never commit either key.

## Rotate org API keys

Mint a new `sk_` / `pk_` from the console, update customer embeds, revoke the old row (`PublishableKey.revoked = true` or Better Auth revoke).
