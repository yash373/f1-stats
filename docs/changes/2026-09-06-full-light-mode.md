# 2026-09-06 — Full light-mode conversion

- Stripped all 92 `dark:` Tailwind variants across 26 files (app + components); zero remain, and the compiled CSS contains zero `.dark` selectors.
- Removed the theme machinery: deleted `components/theme-provider.tsx`, dropped `next-themes` from dependencies (both lockfiles regenerated + frozen-check passes), removed the `@custom-variant dark` block, removed the sidebar toggle remnants.
- `app/layout.tsx` renders plain light HTML with no theme provider, no theme classes, no hydration-suppression needed for theming.
- Verify: lint clean; build green; **74/74 content checks pass** (one transient upstream 502 in an earlier run passed on retry — no code issue).
