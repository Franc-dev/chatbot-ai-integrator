# Signal Console — agent notes

- Next.js App Router. **No server actions.** Mutations go through Hono at `/api/*`.
- Prisma 6.19 with `prisma-client-js`, `engineType = "client"` (no Rust engine). Connections go through the `@prisma/adapter-pg` driver adapter, so any new `PrismaClient` needs one. Import the client from `@signal/db`.
- Tenant queries must use `forOrg(orgId)` or include `orgId` in `where`.
- Provider keys are sealed with AES-256-GCM (`@signal/core` vault). Never return plaintext.
- z.ai has two endpoints: general `/api/paas/v4` vs coding `/api/coding/paas/v4`. Do not guess.
- Jobs: `packages/jobs` + `POST /api/internal/jobs/drain`. No pg-boss, no worker process.
- Design: Signal Console — body is Mona Sans via next/font `--font-sans` (no Commissioner, Switzer, or Fontshare). Instrument Serif via `next/font` on `.display` headings only. JetBrains Mono for code. Flare `#FF4D19`, mint only for live state. Motion tokens live in `packages/ui/src/styles/motion.css`. Never `ease-in` on UI.
- Tools UI is internal agent capabilities (searchKnowledge, collectLead, handoffToHuman, getConversationContext) against the knowledge base. Keep HTTP tool registration off the customer UI.
- Widget: Preact + Shadow DOM in `@signal/widget-core`. Keep gzip under 40KB.
