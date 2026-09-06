# 2026-09-06 — Live timing latest-session fix

- Symptom: live-timing page showed "Upstream error: HTTP 502" on every 5s poll.
- Root cause: OpenF1's `session_key=latest` alias 404s on `positions` and `intervals` (verified live), and our proxy converted that to 502. `stints`/`weather`/`drivers` still accept the alias.
- Fix:
  - `lib/openf1-mapping.ts`: new `resolveLatestSession()` — latest started session (excludes future entries), cached.
  - `/api/v1/live`: resolves missing/`"latest"` keys to numeric before calling OpenF1; echoes the resolved key; intervals anchors at session start for completed sessions (2-min window only when live); intervals 404 (no coverage for that session — verified on Monza quali 11357) returns 200 with `coverage:false` so gaps render "–" instead of erroring.
  - Live-timing page defaults to the latest numeric session once the list loads, so gap anchoring applies.
- Verify: lint clean; build green; all five resources 200 via `session_key=latest` (positions 890 rows, stints 101, drivers 22, weather present, intervals honest `coverage:false`); full harness green.
