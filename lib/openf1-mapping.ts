import { cached, TTL } from "@/lib/cache";
import { openf1 } from "@/lib/sources/openf1";
import { getSeasonRounds } from "@/lib/season-data";

// Maps a Jolpica season/round to an OpenF1 race session_key by date proximity.
// Returns null when no session is within 4 days (future rounds, 2023+ coverage only).
export async function findRaceSession(season: number, round: number): Promise<number | null> {
  return cached(`round-session-${season}-${round}`, TTL.history, async () => {
    const [rounds, sessions] = await Promise.all([
      getSeasonRounds(season),
      openf1.sessions(season).catch(() => []),
    ]);
    const info = rounds.find((r) => r.round === round);
    if (!info) return null;
    const target = new Date(info.date).getTime();
    let best: number | null = null;
    let bestDiff = 4 * 86400 * 1000;
    for (const s of sessions) {
      if (s.session_name !== "Race") continue;
      const diff = Math.abs(new Date(s.date_start).getTime() - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = s.session_key;
      }
    }
    return best;
  });
}

export async function listRaceSessions(season: number) {
  return cached(`race-sessions-${season}`, TTL.weekend, async () => {
    const sessions = await openf1.sessions(season);
    const now = Date.now();
    return sessions
      .filter((s) => s.session_name === "Race" && new Date(s.date_start).getTime() <= now)
      .map((s) => ({
        session_key: s.session_key,
        location: s.location,
        date_start: s.date_start,
      }));
  });
}
