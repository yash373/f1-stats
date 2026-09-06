# 2026-09-06 — Vercel Prisma build fix

- Vercel failed typecheck: `PrismaClient` missing from `@prisma/client` (plus follow-on implicit-`any` errors in `telemetry/route.ts` and `lib/curated.ts`). Root cause: the generated client lives in gitignored `node_modules/.prisma` — present locally from a manual `prisma generate`, absent on Vercel's fresh install.
- Fix: `"build": "prisma generate && next build"` plus `"postinstall": "prisma generate"` (`prisma` is already in dependencies, so the CLI exists at install/build time).
- Verify: deleted `node_modules/.prisma` locally and ran `npm run build` — client regenerates, typecheck + 34-route build green. This mirrors Vercel's clean-room build.
