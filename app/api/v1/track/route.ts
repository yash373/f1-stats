import { NextResponse } from "next/server";
import { cached, TTL } from "@/lib/cache";
import { isDbConfigured, prisma } from "@/lib/db";
import { UpstreamError } from "@/lib/http";
import { openf1 } from "@/lib/sources/openf1";

export const revalidate = 3600;
export const maxDuration = 60;

// GET /api/v1/track?session_key=11357
// Decimated x/y positions per driver for the track map, DB-first with fallback.
// Not every session has location coverage — those return 200 with
// coverage:false so the UI shows an explicit empty state instead of spinning.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionKey = Number(searchParams.get("session_key"));
  if (!Number.isFinite(sessionKey)) {
    return NextResponse.json({ error: "session_key required" }, { status: 400 });
  }
  try {
    if (isDbConfigured()) {
      try {
        const rows = await prisma.trackPoint.findMany({
          where: { sessionKey },
          orderBy: [{ driverNumber: "asc" }, { date: "asc" }],
          take: 60000,
        });
        if (rows.length > 0) {
          const byDriver = new Map<number, { x: number; y: number }[]>();
          for (const r of rows) {
            const arr = byDriver.get(r.driverNumber) ?? [];
            if (arr.length % 2 === 0) arr.push({ x: r.x, y: r.y });
            byDriver.set(r.driverNumber, arr);
          }
          return NextResponse.json({
            session_key: sessionKey,
            source: "db",
            coverage: true,
            drivers: [...byDriver.entries()].map(([driver_number, points]) => ({ driver_number, points })),
          });
        }
      } catch {
        // Fall through to live upstream.
      }
    }
    let live = [];
    try {
      live = await cached(`track-${sessionKey}`, TTL.weekend, () =>
        openf1.location(sessionKey),
      );
    } catch (e) {
      // 422/404 = session has no location coverage (common for older sessions).
      if (e instanceof UpstreamError && (e.status === 422 || e.status === 404)) {
        return NextResponse.json({ session_key: sessionKey, source: "live", coverage: false, drivers: [] });
      }
      throw e;
    }
    const byDriver = new Map<number, { x: number; y: number }[]>();
    live.forEach((p, i) => {
      if (i % 16 !== 0) return;
      const arr = byDriver.get(p.driver_number) ?? [];
      arr.push({ x: p.x, y: p.y });
      byDriver.set(p.driver_number, arr);
    });
    const drivers = [...byDriver.entries()]
      .filter(([, points]) => points.length > 0)
      .map(([driver_number, points]) => ({ driver_number, points }));
    if (drivers.length === 0) {
      return NextResponse.json({ session_key: sessionKey, source: "live", coverage: false, drivers: [] });
    }
    return NextResponse.json({ session_key: sessionKey, source: "live", coverage: true, drivers });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
