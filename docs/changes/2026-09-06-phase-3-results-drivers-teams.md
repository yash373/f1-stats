# 2026-09-06 — Phase 3 results + drivers + teams

- Scope: replace `/results`, `/drivers`, `/teams` placeholders with real data pages + detail routes (frontend + api).
- Data layer:
  - `lib/sources/jolpica.ts`: added `sprint()` client + `ErgastQualifyingResult` / `ErgastSprintResult` types; `RaceTable.Races` now also carries `QualifyingResults?` / `SprintResults?` (verified live against api.jolpi.ca sprint + qualifying shapes).
  - `lib/normalize.ts`: `StandingRow` gains `id` + `teamId` (backward compatible); new `RaceResultRow` (incl. grid→finish `delta`) / `QualiResultRow` + `toRaceResults()` / `toQualiResults()`.
  - `lib/season-data.ts` (new): `getSeasonRounds()` + `getSeasonResults()` — per-round race+quali aggregation, cached per round and per season (TTL.season).
- API: `GET /api/v1/results?season=&round=&session=race|quali|sprint` (was race-only, hand-mapped; now normalized via shared helpers).
- Pages (all ISR 3600, graceful empty states, no DB required — cached upstream fetch like Phase 1+2):
  - `/results`: round cards from schedule → `/results/[round]` (race + sprint-if-present + qualifying tables with grid delta and Q1/Q2/Q3).
  - `/drivers`: `DriverCard` grid from driver standings → `/drivers/[id]` (stat line: championship, points, wins, podiums, poles + race-by-race table with quali/race/points/status).
  - `/teams`: constructor cards → `/teams/[id]` (drivers list + race-by-race best finish + points).
- Components (new): `components/result-table.tsx` (`RaceResultTable`, `QualiResultTable` with team color bars + cross-links), `components/driver-card.tsx` (`DriverCard`, `TeamBadge`).
- Note: no `DATABASE_URL` in this environment, so DB seeding stays pending — pages read cached upstream directly; `sync-history` dry-run path unchanged.
- Verify: `npm run lint` clean; `npm run build` green (new dynamic routes `/drivers/[id]`, `/teams/[id]`, `/results/[round]`); `next start` smoke test all 200: `/api/v1/results?season=2026&round=5&session=sprint|quali`, `/results`, `/results/5`, `/drivers`, `/drivers/antonelli`, `/teams`, `/teams/mercedes`. Content check: sprint R5 returns Canadian GP + 22 rows (P1 Russell); driver page renders.
- Fixes during verify: typed `drivers`/`teams`/`seasonResults` (`StandingRow[]` / `RoundResults[]`) — same implicit-`any[]` pattern as Phase 1+2.
- Follow-ups (Phase 4): head-to-head / race pace / consistency / pit stops / track DNA analytics; Phase 5: /admin for curated Tech/Elements/Destructors.
