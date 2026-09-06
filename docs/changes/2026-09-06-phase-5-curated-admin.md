# 2026-09-06 — Phase 5 curated + admin (Postgres-gated)

- Scope: replace `/tech-updates`, `/used-elements`, `/destructors-championship` placeholders with Postgres-backed curated pages + `/admin` entry (frontend + backend).
- Backend:
  - `lib/curated.ts` (new): `getTechUpgrades()`, `getPowerUnitElements()`, `getIncidents()` — all return `{ available: false }` when `DATABASE_URL` is missing/unreachable, so pages degrade to explicit pending states instead of crashing.
  - `app/admin/actions.ts` (new): `addTechUpgrade`, `setPowerUnitElement` (upsert on season/driver/component), `addIncident` server actions; every action requires the `ADMIN_SECRET` form field and `DATABASE_URL`, and revalidates its page.
  - `scripts/seed-curated.mjs` + `data/curated.json` (new): reproducible seed for the three curated tables (`DATABASE_URL=... node scripts/seed-curated.mjs`); dataset starts empty by design — curated content has no open API and no facts are fabricated; `ensureDriver`/`team` upserts use placeholder names replaced by the next sync-history run.
  - `.env.example`: added `ADMIN_SECRET`.
- Pages (ISR 3600):
  - `/admin` (new, `revalidate = 0`): three entry forms when `ADMIN_SECRET` + `DATABASE_URL` are set, otherwise an explicit "pending database setup" state. Not in sidebar (not part of the inspiration sitemap; linked from pending states).
  - `/tech-updates` (upgrades grouped newest-first), `/used-elements` (per-driver component bars with 2026 pool limits + over-limit flags), `/destructors-championship` (cost-sorted table + season total).
- Verify: `npm run lint` clean; `npm run build` green (curated pages prerender the pending state without a DB); `node --check scripts/seed-curated.mjs` OK. DB-backed flow (migrate → seed → admin create → pages render) is documented but untested here — no DATABASE_URL in this environment.
- Follow-up (Phase 6): live timing upgrade + launch polish; provisioning Postgres unlocks the curated flow end to end.
