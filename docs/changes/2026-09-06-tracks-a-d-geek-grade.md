# 2026-09-06 — Tracks A–D geek-grade upgrade (on `feature/f1-geek-grade`, merged base: main)

## Track A — reliability (all in this change)
- `lib/http.ts` (new): `fetchJson` with 10s timeout budgets + typed `UpstreamError` (status, retry-after).
- `lib/sources/jolpica.ts` + `openf1.ts`: all upstream fetches go through `fetchJson` (429 retry preserved; `location()` allows 60s for full-session payloads).
- `lib/cache.ts`: stale-while-error — expired entries serve when upstream fails (purged after 7 days) instead of blank pages.
- SEO: title template + OG/Twitter in `app/layout.tsx`; per-page titles on all 15 server pages + `app/live-timing/layout.tsx` (client pages can't export metadata).

## Track B — telemetry pipeline
- Prisma: `Lap`, `CarDatum`, `TrackPoint`, `RoundSession` models + hand-rolled `prisma/migrations/0001_init/migration.sql` (generated offline via `prisma migrate diff`, 18 tables) — first migration in repo history.
- `openf1.ts`: `carData()` + `location()` clients (shapes verified live: ~17k rows/driver/session).
- `app/api/cron/sync-telemetry`: session ingest with downsampling (laps all, car_data ~1Hz, location ~1/8), idempotent re-runs, latest-race default for the hourly `vercel.json` cron.
- APIs (DB-first with live fallback): `/api/v1/telemetry`, `/api/v1/track`, `/api/v1/lapchart` (position timeline — snapshots are time-stamped, not per-lap, so the chart is time-based).
- `lib/openf1-mapping.ts`: Jolpica round → OpenF1 session_key by date proximity (±4d, Race only).

## Track C — epic graphs
- `/telemetry-lab` (new, sidebar): session + dual-driver pickers; overlaid speed traces (`TelemetryTraces`), position history (`LapChart` step chart), SVG track replay (`TrackMap` with advancing dots).
- `/live-timing`: track map panel beside the tower.
- `/results/[round]`: position-history + tyre-strategy Gantt sections when session mapping resolves (2023+), hidden otherwise.
- `/driver-standings`: top-5 championship progression line chart (`getChampionshipProgression` uses per-round standings, batched by 5).
- Decision: stayed on Recharts (already installed) instead of adding ECharts — bump/step/line needs are covered without the extra weight.

## Track D — motion (`motion` package)
- `lib/motion.tsx`: `MotionProvider` (reduced-motion respected), `Reveal` (scroll entrances), `AnimatedNumber` (spring counters), `motion` re-export.
- Wired: provider in root layout; staggered reveals on home KPIs/standings; animated points in `StandingsTable`; spring `layout` animation on live-timing tower rows.

## Verify
- `npm run lint` clean; `npm run build` green (34 routes).
- Smoke (`next start`): 12/12 routes 200 incl. telemetry (4228 live points), track (11 drivers, 23k points), h2h, results/5, telemetry-lab, live-timing.
- Incident found & fixed: full-session `location` payload exceeded the new 10s budget → 60s timeout for that call.
- Not yet done (needs cloud resources): provision Postgres/Redis, run migrations + seeds, enter curated content, deploy — see README runbook.
