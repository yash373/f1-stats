import { NextResponse } from "next/server";
import { jolpica } from "@/lib/sources/jolpica";
import { isDbConfigured, prisma } from "@/lib/db";

// Backfills one season from Jolpica into Postgres (idempotent upserts).
// Protected by CRON_SECRET. Trigger: GET /api/cron/sync-history?season=2026
export const maxDuration = 60;

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // local dev without secret
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const season = Number(searchParams.get("season") ?? 2026);

  if (!isDbConfigured()) {
    // Dry-run: verify upstream is reachable without writing.
    const [drivers, schedule] = await Promise.all([
      jolpica.drivers(season),
      jolpica.schedule(season),
    ]);
    return NextResponse.json({
      mode: "dry-run (DATABASE_URL not set)",
      season,
      drivers: drivers.MRData.DriverTable?.Drivers.length ?? 0,
      races: schedule.MRData.RaceTable?.Races.length ?? 0,
    });
  }

  const schedule = await jolpica.schedule(season);
  const races = schedule.MRData.RaceTable?.Races ?? [];

  await prisma.season.upsert({ where: { year: season }, update: {}, create: { year: season } });
  for (const r of races) {
    await prisma.circuit.upsert({
      where: { id: r.Circuit.circuitId },
      update: { name: r.Circuit.circuitName, country: r.Circuit.Location.country },
      create: {
        id: r.Circuit.circuitId,
        name: r.Circuit.circuitName,
        country: r.Circuit.Location.country,
      },
    });
    await prisma.round.upsert({
      where: { season_roundNo: { season, roundNo: Number(r.round) } },
      update: { name: r.raceName, date: new Date(r.date) },
      create: {
        season,
        roundNo: Number(r.round),
        name: r.raceName,
        date: new Date(r.date),
        circuitId: r.Circuit.circuitId,
      },
    });
  }

  const standings = await jolpica.driverStandings(season).catch(() => null);
  const drows = standings?.MRData.StandingsTable?.StandingsLists[0]?.DriverStandings ?? [];
  for (const s of drows) {
    await prisma.driver.upsert({
      where: { id: s.Driver.driverId },
      update: {},
      create: {
        id: s.Driver.driverId,
        code: s.Driver.code ?? "",
        number: s.Driver.permanentNumber ? Number(s.Driver.permanentNumber) : null,
        firstName: s.Driver.givenName,
        lastName: s.Driver.familyName,
        nationality: s.Driver.nationality,
      },
    });
  }

  return NextResponse.json({ ok: true, season, races: races.length, drivers: drows.length });
}
