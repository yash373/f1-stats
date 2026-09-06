# 2026-09-06 — Phase 6 live timing upgrade + launch polish

- Scope: richer `/live-timing`, global loading/error states, README runbook, rate-limit hardening (frontend + api).
- Live timing:
  - `GET /api/v1/live` gains `intervals` (defaults `date_after` to last 2 min, minute-bucketed cache keys), `stints`, `weather` (latest reading) resources.
  - `/live-timing` rewritten: session picker (2026 sessions), gap tower (gap-to-leader + interval via date-filtered OpenF1 intervals), tyre badges (latest stint per driver: compound + age), weather bar (air/track temp, humidity, rain, wind). Fast poll (positions + intervals) every 5s, slow poll (drivers/stints/weather) every 60s — stays under OpenF1's 3 req/s.
- Rate-limit hardening (found by smoke test: cold burst returned 502s on h2h + pit-stops):
  - `lib/sources/jolpica.ts`: retry 429s up to 4 attempts with exponential backoff + `Retry-After` respect (max 8s).
  - `lib/season-data.ts`: rounds fetched in batches of 5 instead of a full parallel fan-out.
  - Verified: cold-burst smoke (h2h + pit-stops + driver-stats + consistency + h2h page) all 200; Hungary pit stops return 45 rows, fastest Antonelli 21.326s.
- Polish: `app/loading.tsx` (skeleton), `app/error.tsx` (retry), `README.md` rewritten as runbook (setup, DB, API index, Vercel deploy, docs convention).
- Verify: `npm run lint` clean; `npm run build` green (29 routes); full smoke: 6 API + 11 pages, all 200.
- Launch notes: provision `DATABASE_URL` + `ADMIN_SECRET` + `CRON_SECRET` on Vercel to unlock curated flow and crons; seed 2023–2026 via `/api/cron/sync-history`.
