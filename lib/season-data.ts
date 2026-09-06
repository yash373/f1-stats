import { cached, TTL } from "@/lib/cache";
import { jolpica } from "@/lib/sources/jolpica";
import {
  toQualiResults,
  toRaceResults,
  type QualiResultRow,
  type RaceResultRow,
} from "@/lib/normalize";

export interface SeasonRound {
  round: number;
  name: string;
  date: string;
}

export async function getSeasonRounds(season: number): Promise<SeasonRound[]> {
  try {
    const data = await cached(`schedule-${season}`, TTL.season, () =>
      jolpica.schedule(season),
    );
    return (
      data.MRData.RaceTable?.Races.map((r) => ({
        round: Number(r.round),
        name: r.raceName,
        date: r.date,
      })) ?? []
    );
  } catch {
    return [];
  }
}

export interface RoundResults {
  round: number;
  name: string;
  race: RaceResultRow[];
  quali: QualiResultRow[];
}

// All race + quali results for a season, cached as one blob.
// Individual round fetches are also cached per round for reuse.
// Rounds are fetched in small batches with a short pause between them —
// a full parallel fan-out trips Jolpica's rate limiter.
export async function getSeasonResults(season: number): Promise<RoundResults[]> {
  const rounds = await getSeasonRounds(season);
  const out: RoundResults[] = [];
  for (let i = 0; i < rounds.length; i += 5) {
    if (i > 0) await new Promise((r) => setTimeout(r, 400));
    const batch = await Promise.all(
      rounds.slice(i, i + 5).map(async (r) =>
        cached(`season-results-${season}-${r.round}`, TTL.season, async () => {
          const [raceRes, qualiRes] = await Promise.all([
            jolpica.results(season, r.round).catch(() => null),
            jolpica.qualifying(season, r.round).catch(() => null),
          ]);
          return {
            round: r.round,
            name: raceRes?.MRData.RaceTable?.Races[0]?.raceName ?? r.name,
            race: toRaceResults(raceRes?.MRData.RaceTable?.Races[0]?.Results),
            quali: toQualiResults(qualiRes?.MRData.RaceTable?.Races[0]?.QualifyingResults),
          } satisfies RoundResults;
        }),
      ),
    );
    out.push(...batch);
  }
  return out;
}
