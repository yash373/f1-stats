# 2026-09-06 — Observability + static critical content

Context: user reported empty data + broken home cards on both local and prod while builds stayed green. Honest findings: (1) verification only checked HTTP 200, but pages return 200 with empty states — false confidence; (2) all fetch errors were swallowed into generic empty states, hiding the cause; (3) static KPI cards were wrapped in scroll-reveal animation, gating content on JS observers; (4) deploy mapping was unpinned (`origin/main` was scaffold-only).

- `GET /api/v1/health` now deep-checks: pings Jolpica + OpenF1 with latency, reports per-source ok/error, plus `db`/`redis` flags. One call names the failure (timeout vs throttle vs DNS).
- Home badge surfaces the actual upstream error message instead of a generic note.
- Home KPI grid + standings tables render statically (Reveal removed from critical content; motion stays for non-critical flourishes only).
- `AnimatedNumber`: 2s fail-visible fallback — shows the final value even if intersection observation never fires (previously could stick at 0).
- Deploy mapping fixed: `feature/f1-geek-grade` merged to `main`, pushed; Vercel deploys `main`.
- Verify: lint clean; build green; content-asserting smoke (health ok/no DB/no Redis here, no amber badge, 242 pts, KPI cards, Antonelli/Mercedes all present in HTML).
- Still open: prod 502 root cause needs the deployed health output (`/api/v1/health` checks field) — if an upstream fails only from Vercel IPs, set Upstash Redis + `DATABASE_URL` and run `sync-history`.
