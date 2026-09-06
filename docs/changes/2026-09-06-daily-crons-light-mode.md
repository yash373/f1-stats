# 2026-09-06 — Daily crons + light mode fix

- Crons: all three jobs now run once daily (UTC) — `sync-history` 06:00, `sync-weekend` 06:15, `sync-telemetry` 06:30 (was: weekly + every 15 min + hourly). Live freshness during race weekends now comes from on-demand cached fetches, not cron frequency.
- Light mode: the theme toggle silently did nothing because Tailwind v4 defaults the `dark:` variant to `prefers-color-scheme` while next-themes toggles the `.dark` class. Added `@custom-variant dark (&:where(.dark, .dark *))` to `app/globals.css` so all `dark:` utilities respond to the toggle; removed the conflicting `prefers-color-scheme` override so the OS scheme can't fight the manual choice.
- Incident during verify: `//` comments in CSS broke the PostCSS build (`Unknown word`) — converted to `/* */`.
- Verify: `npm run lint` clean; `npm run build` green; compiled CSS contains class-scoped selectors (e.g. `.dark\:bg-black:where(.dark,.dark *)`); smoke test `/`, `/drivers`, `/telemetry-lab`, `/live-timing` all 200.
