// Canonical team colors used across tables, badges and charts.
// Source of truth for Tailwind arbitrary values + Recharts strokes.

export const TEAM_COLORS: Record<string, string> = {
  mercedes: "#27F4D2",
  ferrari: "#E80020",
  mclaren: "#FF8000",
  "red-bull-racing": "#3671C6",
  rb: "#6692FF",
  alpine: "#0093CC",
  haas: "#B6BABD",
  audi: "#C0C0C0",
  williams: "#64C4FF",
  "aston-martin": "#229971",
  cadillac: "#D4AF37",
};

export function teamColor(teamId: string, fallback = "#888888") {
  return TEAM_COLORS[teamId.toLowerCase()] ?? fallback;
}
