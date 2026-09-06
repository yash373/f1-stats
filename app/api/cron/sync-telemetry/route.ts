import { NextResponse } from "next/server";
import { isDbConfigured, prisma } from "@/lib/db";
import { openf1 } from "@/lib/sources/openf1";

// Ingests one OpenF1 session into Postgres with downsampling:
// - laps: all rows
// - car_data: ~1Hz (every 4th sample at ~3.7Hz)
// - location: every 8th sample (dots + outline stay smooth, rows stay bounded)
// Protected by CRON_SECRET. Trigger: GET /api/cron/sync-telemetry?session_key=11357
// Without session_key, syncs the latest Race session of the current year (used by the hourly cron).
export const maxDuration = 300;

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  let sessionKey = Number(searchParams.get("session_key"));
  if (!Number.isFinite(sessionKey)) {
    const year = new Date().getUTCFullYear();
    const sessions = await openf1.sessions(year);
    const races = sessions.filter((s) => s.session_name === "Race");
    const latest = races[races.length - 1];
    if (!latest) return NextResponse.json({ error: "no race session found" }, { status: 404 });
    sessionKey = latest.session_key;
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ mode: "dry-run (DATABASE_URL not set)", sessionKey });
  }

  const [laps, carData, location] = await Promise.all([
    openf1.laps(sessionKey),
    openf1.carData(sessionKey),
    openf1.location(sessionKey),
  ]);

  // Idempotent: wipe session rows first so re-runs don't duplicate.
  await prisma.$transaction([
    prisma.lap.deleteMany({ where: { sessionKey } }),
    prisma.carDatum.deleteMany({ where: { sessionKey } }),
    prisma.trackPoint.deleteMany({ where: { sessionKey } }),
  ]);

  if (laps.length > 0) {
    await prisma.lap.createMany({
      data: laps.map((l) => ({
        sessionKey,
        driverNumber: l.driver_number,
        lapNumber: l.lap_number,
        duration: l.lap_duration,
        sector1: l.duration_sector_1,
        sector2: l.duration_sector_2,
        sector3: l.duration_sector_3,
        isPitOutLap: l.is_pit_out_lap,
      })),
      skipDuplicates: true,
    });
  }

  const carRows = carData.filter((_, i) => i % 4 === 0);
  for (let i = 0; i < carRows.length; i += 2000) {
    await prisma.carDatum.createMany({
      data: carRows.slice(i, i + 2000).map((c) => ({
        sessionKey,
        driverNumber: c.driver_number,
        date: new Date(c.date),
        speed: c.speed,
        throttle: c.throttle,
        brake: c.brake,
        gear: c.n_gear,
        rpm: c.rpm,
        drs: c.drs,
      })),
    });
  }

  const locRows = location.filter((_, i) => i % 8 === 0);
  for (let i = 0; i < locRows.length; i += 2000) {
    await prisma.trackPoint.createMany({
      data: locRows.slice(i, i + 2000).map((p) => ({
        sessionKey,
        driverNumber: p.driver_number,
        date: new Date(p.date),
        x: p.x,
        y: p.y,
      })),
    });
  }

  return NextResponse.json({
    ok: true,
    sessionKey,
    laps: laps.length,
    carData: carRows.length,
    trackPoints: locRows.length,
  });
}
