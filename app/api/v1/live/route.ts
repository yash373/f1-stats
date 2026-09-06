import { NextResponse } from "next/server";
import { cached, TTL } from "@/lib/cache";
import { openf1 } from "@/lib/sources/openf1";

// Proxies OpenF1 with a 5s server-side cache to stay under 3 req/s.
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionKey = searchParams.get("session_key") ?? "latest";
  const resource = searchParams.get("resource") ?? "overview"; // overview | positions | drivers | intervals | stints | weather
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
    if (resource === "intervals") {
      const key = sessionKey === "latest" ? "latest" : Number(sessionKey);
      // Intervals only return rows with an explicit date filter; default to the last 2 minutes.
      const dateAfter =
        searchParams.get("date_after") ?? new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const bucket = dateAfter.slice(0, 16); // minute bucket keeps cache keys bounded
      const data = await cached(`live-int-${sessionKey}-${bucket}`, TTL.live, () =>
        openf1.intervals(key as number | "latest", dateAfter),
      );
      return NextResponse.json({ session_key: sessionKey, intervals: data });
    }
    if (resource === "stints") {
      const key = sessionKey === "latest" ? "latest" : Number(sessionKey);
      const data = await cached(`live-stints-${sessionKey}`, TTL.weekend, () =>
        openf1.stints(key as number | "latest"),
      );
      return NextResponse.json({ session_key: sessionKey, stints: data });
    }
    if (resource === "weather") {
      const key = sessionKey === "latest" ? "latest" : Number(sessionKey);
      const data = await cached(`live-weather-${sessionKey}`, TTL.weekend, () =>
        openf1.weather(key as number | "latest"),
      );
      return NextResponse.json({ session_key: sessionKey, weather: data.slice(-1)[0] ?? null });
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
