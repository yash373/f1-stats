import { NextResponse } from "next/server";
import { cached, TTL } from "@/lib/cache";
import { openf1 } from "@/lib/sources/openf1";

// Proxies OpenF1 with a 5s server-side cache to stay under 3 req/s.
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionKey = searchParams.get("session_key") ?? "latest";
  const resource = searchParams.get("resource") ?? "overview"; // overview | positions | drivers
  try {
    if (resource === "positions") {
      const key = sessionKey === "latest" ? "latest" : Number(sessionKey);
      const data = await cached(`live-pos-${sessionKey}`, TTL.live, () =>
        openf1.positions(key as number | "latest"),
      );
      return NextResponse.json({ session_key: sessionKey, positions: data });
    }
    if (resource === "drivers") {
      const key = sessionKey === "latest" ? "latest" : Number(sessionKey);
      const data = await cached(`live-drivers-${sessionKey}`, TTL.weekend, () =>
        openf1.drivers(key as number | "latest"),
      );
      return NextResponse.json({ session_key: sessionKey, drivers: data });
    }
    const year = Number(searchParams.get("year") ?? new Date().getUTCFullYear());
    const sessions = await cached(`live-sessions-${year}`, TTL.weekend, () =>
      openf1.sessions(year),
    );
    return NextResponse.json({ year, count: sessions.length, sessions });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
