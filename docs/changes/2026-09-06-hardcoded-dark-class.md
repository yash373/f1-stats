# 2026-09-06 — Hardcoded dark class for reliable first paint

- Symptom: dark mode unreliable — SSR HTML carried no theme class, so correct theming depended entirely on the next-themes hydration script running.
- Fix: `class="dark h-full"` hardcoded on `<html>` in `app/layout.tsx` while the theme is forced dark-only. First paint is dark with zero JS; next-themes keeps it in sync afterwards. Remove when the light-mode rebuild reintroduces the toggle.
- Note: both Vercel URLs sit behind Deployment Protection (SSO), so the deployment can't be checked externally — prod diagnosis needs the logged-in `/api/v1/health` output or function logs. If the deployment predates the class-based dark variant fix, dark styling was absent there regardless of this change: redeploy from `main`.
- Verify: lint clean; build green; SSR HTML contains `class="dark h-full"`; KPI + standings content present, no amber badge locally.
