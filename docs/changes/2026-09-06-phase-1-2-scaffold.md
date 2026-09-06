# 2026-09-06 — Phase 1+2 scaffold

- Scope: backend/api/frontend foundation (Next.js full-stack only, full-clone sitemap, live timing).
- What: create-next-app (Next 16, Tailwind v4) moved into repo; added `next-themes, clsx, tailwind-merge, lucide-react, recharts, @tanstack/react-table, prisma, @prisma/client, @upstash/redis, zod`.
- Layout: `app/layout.tsx` + `ThemeProvider` + `Sidebar` (17 links mirroring formula1dashboard.com) + dark/light toggle.
- Home: KPI cards + live driver/constructor standings via Jolpica (`app/page.tsx`, ISR 3600).
- Pages with real data: `/schedule`, `/driver-standings`, `/constructor-standings`, `/live-timing` (5s client poll of internal proxy). Remaining 12 routes are placeholders for Phase 3.
- Backend: `prisma/schema.prisma` (Season, Circuit, Team, Driver, DriverSeat, Round, Session, SessionResult, PitStop, standings, TechUpgrade, PowerUnitElement, Incident); `lib/db.ts` (graceful without DATABASE_URL); `lib/cache.ts` (memory + optional Upstash, TTLs: live 5s / weekend 5m / season 1h / history 24h); `lib/sources/jolpica.ts`, `lib/sources/openf1.ts`; `lib/normalize.ts`; `lib/team-colors.ts`; `.env.example`.
- API: `GET /api/v1/health`, `/api/v1/schedule?season=`, `/api/v1/standings?season=&type=`, `/api/v1/results?season=&round=`, `/api/v1/live?resource=&session_key=&year=`; cron `GET /api/cron/sync-history?season=` (Jolpica→Postgres upsert, dry-run without DB) and `/api/cron/sync-weekend?year=` (OpenF1 probe); `vercel.json` crons (Mon 06:00 + every 15 min).
- Verify: `npx prisma generate && npm run build` (green), `npm run lint` (clean); manual: `/`, `/schedule`, `/api/v1/health`, `/api/v1/standings?season=2026`.
- Fixes during verify: pinned `prisma` + `@prisma/client` to v6 stable (v8 RC broke `prisma generate`); repaired `node_modules` binaries via reinstall; typed standings `rows` as `StandingRow[]`; removed unused generic in `jolpica.ts`. Jolpica 2026 driver standings confirmed live (round 13).
- Follow-ups (Phase 3): results/qualifying pages, head-to-head/race-pace/pit-stop analytics queries, lap/stint persistence, /admin for curated Tech/Elements/Destructors, seed 2026 data with DATABASE_URL set.
