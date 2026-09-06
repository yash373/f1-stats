import { NextResponse } from "next/server";
import { cached, TTL } from "@/lib/cache";
import { isDbConfigured, prisma } from "@/lib/db";
import { openf1 } from "@/lib/sources/openf1";

export const revalidate = 3600;

// GET /api/v1/telemetry?session_key=11357&driver_number=16
// Speed/throttle/brake/gear traces, DB-first with live upstream fallback.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionKey = Number(searchParams.get("session_key"));
  const driverNumber = Number(searchParams.get("driver_number"));
  if (!Number.isFinite(sessionKey) || !Number.isFinite(driverNumber)) {
    return NextResponse.json({ error: "session_key and driver_number required" }, { status: 400 });
  }
  try {
    if (isDbConfigured()) {
      try {
        const rows = await prisma.carDatum.findMany({
          where: { sessionKey, driverNumber },
          orderBy: { date: "asc" },
          take: 20000,
        });
        if (rows.length > 0) {
          return NextResponse.json({
            session_key: sessionKey,
            driver_number: driverNumber,
            source: "db",
            points: rows.map((r) => ({
              t: r.date.toISOString(),
              speed: r.speed,
              throttle: r.throttle,
              brake: r.brake,
              gear: r.gear,
              rpm: r.rpm,
            })),
          });
        }
      } catch {
        // Fall through to live upstream.
      }
    }
    const live = await cached(`telemetry-${sessionKey}-${driverNumber}`, TTL.weekend, () =>
      openf1.carData(sessionKey, driverNumber),
    );
    return NextResponse.json({
      session_key: sessionKey,
      driver_number: driverNumber,
      source: "live",
      points: live.filter((_, i) => i % 4 === 0).map((c) => ({
        t: c.date,
        speed: c.speed,
        throttle: c.throttle,
        brake: c.brake,
        gear: c.n_gear,
        rpm: c.rpm,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
