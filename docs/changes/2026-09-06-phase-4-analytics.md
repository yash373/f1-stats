# 2026-09-06 — Phase 4 analytics pages

- Scope: replace `/head-to-head`, `/driver-stats`, `/consistency`, `/race-pace`, `/pit-stops`, `/track-dna` placeholders with real analytics (frontend + api).
- Data layer:
  - `lib/sources/jolpica.ts`: added `pitstops()` + `ErgastPitStop` type; `RaceTable.Races` gains `PitStops?` (shape verified live).
  - `lib/sources/openf1.ts`: added `laps()`, `stints()`, `intervals()` (requires explicit `date>` filter — verified empty without it), `weather()` + `OpenF1Lap/Stint/Interval/Weather` types (laps/stints/weather verified live).
  - `lib/normalize.ts`: new `PitStopRow` + `toPitStops()`.
  - `lib/analytics.ts` (new): shared `getHeadToHead()`, `getDriverStats()` (wins/podiums/poles/DNFs/best), `getPitStops()` (driver-joined stops + team averages) — used by both API routes and pages (pages can't self-fetch during prerender).
- API: `GET /api/v1/head-to-head?season=&d1=&d2=`, `GET /api/v1/pit-stops?season=&round=`, `GET /api/v1/driver-stats?season=` (thin wrappers, ISR 3600).
- Pages (ISR 3600, graceful empty states):
  - `/head-to-head` (searchParams d1/d2 pickers, quali/race score bars, per-round table)
  - `/driver-stats` (Pts/W/Pod/Pol/DNF/Best table)
  - `/consistency` (points-per-round heatmap)
  - `/race-pace` (latest 2026 Race session via OpenF1, median-lap BarChart + table; pit-out laps excluded)
  - `/pit-stops` (round picker, fastest stop, team averages, all stops)
  - `/track-dna` (circuit cards with winner + polesitter)
- Components: `components/race-pace-chart.tsx` (client, Recharts vertical bars with team colors).
- Fixes during verify: typed `rounds`/`drivers`/`results` (`RoundResults[]`, `DriverStat[]`, `SeasonRound[]`) — same implicit-`any[]` pattern as earlier phases.
- Verify: `npm run lint` clean; `npm run build` green (29 routes); manual: `/head-to-head?d1=antonelli&d2=russell`, `/race-pace`, `/pit-stops?round=11`, `/api/v1/driver-stats?season=2026`.
- Follow-ups (Phase 5): Postgres-gated `/admin` + curated pages; (Phase 6): live timing upgrade + launch polish.
