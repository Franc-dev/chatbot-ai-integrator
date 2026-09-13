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

```bash
pnpm install
pnpm --filter @signal/db generate
pnpm --filter @signal/db exec prisma migrate deploy
pnpm --filter @signal/widget-core build
# copy packages/widget-core/dist/embed*.js to apps/web/public/embed.js
vercel --prod
```

## Rotate the envelope key

1. Generate a new `ENCRYPTION_KEY`.
2. Write a one-off script that `openSecret`s each `ProviderCredential` with the old key and `sealSecret`s with the new one, incrementing `keyVersion`.
3. Swap the env var, then redeploy. Never commit either key.

## Rotate org API keys

Mint a new `sk_` / `pk_` from the console, update customer embeds, revoke the old row (`PublishableKey.revoked = true` or Better Auth revoke).
