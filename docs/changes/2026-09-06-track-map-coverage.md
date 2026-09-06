# 2026-09-06 — Track map coverage fix

- Symptom: track maps stuck on "Loading track map…" (telemetry-lab, live-timing).
- Root cause: OpenF1 returns **422** for `location` on sessions without location coverage (e.g. Zandvoort race 11353 — the default telemetry-lab session). The API turned that into a 502, and `TrackMap` swallowed fetch errors, spinning forever.
- Fix:
  - `/api/v1/track`: 422/404 from upstream (or empty decimated output) returns 200 with `coverage:false, drivers:[]`; DB path also reports `coverage:true`.
  - `TrackMap`: explicit `loading` / `ready` / `empty` ("No track location data published for this session") / `error` states instead of one perpetual loader; outline drawn from the driver with the most points rather than `tracks[0]`; callers pass `key={sessionKey}` so session switches remount with fresh state (also satisfies the set-state-in-effect lint rule).
- Verify: lint clean; build green; `?session_key=11353` → `coverage:false` 200, `?session_key=11357` → 11 drivers; full harness **74/74 pass**.
