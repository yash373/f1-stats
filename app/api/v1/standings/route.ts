import { NextResponse } from "next/server";
import { cached, TTL } from "@/lib/cache";
import { jolpica } from "@/lib/sources/jolpica";
import { toConstructorRows, toStandingRows } from "@/lib/normalize";

export const revalidate = 3600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const season = searchParams.get("season") ?? "2026";
  const type = searchParams.get("type") ?? "drivers"; // drivers | constructors
  try {
    if (type === "constructors") {
      const data = await cached(`cstand-${season}`, TTL.season, () =>
        jolpica.constructorStandings(season),
      );
      return NextResponse.json({
        season: Number(season),
        standings: toConstructorRows(
          data.MRData.StandingsTable?.StandingsLists[0]?.ConstructorStandings,
        ),
      });
    }
    const data = await cached(`dstand-${season}`, TTL.season, () =>
      jolpica.driverStandings(season),
    );
    return NextResponse.json({
      season: Number(season),
      standings: toStandingRows(
        data.MRData.StandingsTable?.StandingsLists[0]?.DriverStandings,
      ),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
