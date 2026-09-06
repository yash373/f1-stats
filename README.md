# F1 Dashboard — driver & team stats (unofficial fan project)

Next.js full-stack app inspired by formula1dashboard.com. Data: Jolpica-F1 (history, 1950–present)
+ OpenF1 (live timing & telemetry, 2023+). Curated content (tech upgrades, PU elements, crash
damage) has no open API and is entered via `/admin`.

## Getting started

```bash
cp .env.example .env.local   # fill DATABASE_URL to enable DB features
npm install
npm run dev                  # http://localhost:3000
```

Without `DATABASE_URL` the app runs in upstream-direct mode (cached Jolpica/OpenF1 fetches);
curated pages and `/admin` show pending states.

## Database (optional but recommended)

```bash
npx prisma migrate deploy            # create tables
DATABASE_URL=... node scripts/seed-curated.mjs   # seed curated tables from data/curated.json
```

Then open `/admin` (needs `ADMIN_SECRET`) to add tech upgrades, PU elements and incidents.
Race-weekend history sync: `GET /api/cron/sync-history?season=2026` (Bearer `CRON_SECRET`).

## API

- `GET /api/v1/health` — service + upstream status
- `GET /api/v1/schedule?season=` — calendar
- `GET /api/v1/standings?season=&type=drivers|constructors`
- `GET /api/v1/results?season=&round=&session=race|quali|sprint`
- `GET /api/v1/head-to-head?season=&d1=&d2=`
- `GET /api/v1/driver-stats?season=`
- `GET /api/v1/pit-stops?season=&round=`
- `GET /api/v1/live?resource=overview|positions|drivers|intervals|stints|weather&session_key=&year=`
- `GET /api/cron/sync-history?season=` · `GET /api/cron/sync-weekend?year=`

## Deploy (Vercel)

Set env vars: `DATABASE_URL`, `UPSTASH_REDIS_REST_URL/TOKEN` (optional cache),
`CRON_SECRET`, `ADMIN_SECRET`. Crons are declared in `vercel.json`
(Mon 06:00 history sync, every 15 min weekend probe).

## Docs

Per-change notes live in `docs/changes/` (index: `docs/CHANGELOG.md`).
