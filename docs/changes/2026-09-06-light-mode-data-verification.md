# 2026-09-06 — Light mode default + full data verification

- **Light mode**: forced light (`defaultTheme="light"`, no `dark` class on `<html>`, toggle stays hidden until dark is re-verified). Audit: nearly all components already carry light styles (`bg-white`, `text-zinc-900` body); `text-white` usages are confined to red/colored chips; charts use defaults readable on white.
- **Verification harness** (`scripts/verify-content.mjs`, new): asserts real content on 21 pages + 13 API payloads (names, points, non-empty arrays, valid durations, no upstream-error banners) — exits nonzero on failure. Run: `node scripts/verify-content.mjs <baseUrl>`.
- **Failures found and fixed by the harness**:
  - Race-pace picked the latest *listed* Race session, which is a future entry with no laps (404) → walks back to the latest past session with lap data. Same future-session bug fixed in `listRaceSessions` (telemetry-lab default).
  - Driver-stats intermittently empty under cold-start bursts (Jolpica 429 storm) → 400ms pacing between season fan-out batches + Jolpica retries raised to 4 attempts (≤4s). Same pacing added to championship progression.
  - OpenF1 transient 429/5xx → single retry in the OpenF1 client.
  - Two harness markers corrected (React renders `R{1}` as `R<!-- -->1`; driver-stats header is `Pod`).
- Verify: lint clean; build green; **74/74 checks pass on a cold server, two consecutive runs**.
