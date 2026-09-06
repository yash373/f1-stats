import { NextResponse } from "next/server";
import { cached, TTL } from "@/lib/cache";
import { jolpica } from "@/lib/sources/jolpica";

export const revalidate = 3600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const season = searchParams.get("season") ?? "2026";
  try {
    const data = await cached(`schedule-${season}`, TTL.season, () =>
      jolpica.schedule(season),
    );
    const races =
      data.MRData.RaceTable?.Races.map((r) => ({
        round: Number(r.round),
        name: r.raceName,
        date: r.date,
        circuit: r.Circuit.circuitName,
        country: r.Circuit.Location.country,
      })) ?? [];
    return NextResponse.json({ season: Number(season), count: races.length, races });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
