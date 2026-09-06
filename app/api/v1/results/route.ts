import { NextResponse } from "next/server";
import { cached, TTL } from "@/lib/cache";
import { jolpica } from "@/lib/sources/jolpica";
import { toQualiResults, toRaceResults } from "@/lib/normalize";

export const revalidate = 3600;

// GET /api/v1/results?season=2026&round=5&session=race|quali|sprint
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const season = searchParams.get("season") ?? "2026";
  const round = searchParams.get("round") ?? "1";
  const session = searchParams.get("session") ?? "race";
  try {
    if (session === "quali") {
      const data = await cached(`quali-${season}-${round}`, TTL.season, () =>
        jolpica.qualifying(season, round),
      );
      const race = data.MRData.RaceTable?.Races[0];
      return NextResponse.json({
        season: Number(season),
        round: Number(round),
        session,
        raceName: race?.raceName ?? null,
        results: toQualiResults(race?.QualifyingResults),
      });
    }
    if (session === "sprint") {
      const data = await cached(`sprint-${season}-${round}`, TTL.season, () =>
        jolpica.sprint(season, round),
      );
      const race = data.MRData.RaceTable?.Races[0];
      return NextResponse.json({
        season: Number(season),
        round: Number(round),
        session,
        raceName: race?.raceName ?? null,
        results: toRaceResults(race?.SprintResults),
      });
    }
    const data = await cached(`results-${season}-${round}`, TTL.season, () =>
      jolpica.results(season, round),
    );
    const race = data.MRData.RaceTable?.Races[0];
    return NextResponse.json({
      season: Number(season),
      round: Number(round),
      session: "race",
      raceName: race?.raceName ?? null,
      results: toRaceResults(race?.Results),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
