import { NextResponse } from "next/server";
import { cached, TTL } from "@/lib/cache";
import { jolpica } from "@/lib/sources/jolpica";

export const revalidate = 3600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const season = searchParams.get("season") ?? "2026";
  const round = searchParams.get("round") ?? "1";
  try {
    const data = await cached(`results-${season}-${round}`, TTL.season, () =>
      jolpica.results(season, round),
    );
    const race = data.MRData.RaceTable?.Races[0];
    return NextResponse.json({
      season: Number(season),
      round: Number(round),
      raceName: race?.raceName ?? null,
      results: (race?.Results ?? []).map((r) => ({
        position: r.position ?? null,
        points: Number(r.points),
        driver: `${r.Driver.givenName} ${r.Driver.familyName}`,
        code: r.Driver.code ?? "",
        team: r.Constructor.name,
        grid: Number(r.grid),
        laps: Number(r.laps),
        status: r.status,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
