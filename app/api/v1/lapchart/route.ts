import { NextResponse } from "next/server";
import { cached, TTL } from "@/lib/cache";
import { openf1 } from "@/lib/sources/openf1";

export const revalidate = 3600;

// GET /api/v1/lapchart?session_key=11357
// Position timeline (timestamped snapshots, decimated) for the animated lap chart.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionKey = Number(searchParams.get("session_key"));
  if (!Number.isFinite(sessionKey)) {
    return NextResponse.json({ error: "session_key required" }, { status: 400 });
  }
  try {
    const [positions, drivers] = await Promise.all([
      cached(`lapchart-pos-${sessionKey}`, TTL.weekend, () => openf1.positions(sessionKey)),
      cached(`openf1-drivers-${sessionKey}`, TTL.weekend, () => openf1.drivers(sessionKey)),
    ]);
    const meta = new Map(
      drivers.map((d) => [d.driver_number, { acronym: d.name_acronym, color: d.team_colour ? `#${d.team_colour}` : "#888888" }]),
    );
    const step = Math.max(1, Math.floor(positions.length / 4000));
    return NextResponse.json({
      session_key: sessionKey,
      drivers: [...meta.entries()].map(([driver_number, m]) => ({ driver_number, ...m })),
      points: positions
        .filter((_, i) => i % step === 0)
        .map((p) => ({ driver_number: p.driver_number, position: p.position, date: p.date })),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
