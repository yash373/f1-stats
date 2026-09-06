import { NextResponse } from "next/server";
import { cached, TTL } from "@/lib/cache";
import { UpstreamError } from "@/lib/http";
import { openf1 } from "@/lib/sources/openf1";
import { resolveLatestSession } from "@/lib/openf1-mapping";

// Proxies OpenF1 with a 5s server-side cache to stay under 3 req/s.
export const revalidate = 0;

async function resolveKey(raw: string | null, year: number): Promise<number> {
  if (raw !== null && raw !== "latest") {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  // The OpenF1 `session_key=latest` alias 404s on positions/intervals —
  // always resolve to a numeric key.
  const latest = await resolveLatestSession(year);
  if (latest === null) throw new Error("no sessions available");
  return latest;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionParam = searchParams.get("session_key") ?? "latest";
  const resource = searchParams.get("resource") ?? "overview"; // overview | positions | drivers | intervals | stints | weather
  const year = Number(searchParams.get("year") ?? new Date().getUTCFullYear());
  try {
    if (resource === "positions") {
      const key = await resolveKey(sessionParam, year);
      const data = await cached(`live-pos-${key}`, TTL.live, () => openf1.positions(key));
      return NextResponse.json({ session_key: key, positions: data });
    }
    if (resource === "drivers") {
      const key = await resolveKey(sessionParam, year);
      const data = await cached(`live-drivers-${key}`, TTL.weekend, () => openf1.drivers(key));
      return NextResponse.json({ session_key: key, drivers: data });
    }
    if (resource === "intervals") {
      const key = await resolveKey(sessionParam, year);
      // Intervals need an explicit date filter. Without one, anchor at the
      // session start for completed sessions, else the last 2 minutes live.
      let dateAfter = searchParams.get("date_after");
      if (!dateAfter) {
        const info = await cached(`live-session-${key}`, TTL.weekend, () =>
          openf1.session(key),
        ).catch(() => []);
        const start = info[0]?.date_start;
        dateAfter =
          start && new Date(start).getTime() < Date.now() - 2 * 60 * 1000
            ? start
            : new Date(Date.now() - 2 * 60 * 1000).toISOString();
      }
      const bucket = dateAfter.slice(0, 16); // minute bucket keeps cache keys bounded
      let data = [];
      try {
        data = await cached(`live-int-${key}-${bucket}`, TTL.live, () =>
          openf1.intervals(key, dateAfter),
        );
      } catch (e) {
        // 404 = session has no intervals coverage — gaps render as "–".
        if (e instanceof UpstreamError && e.status === 404) {
          return NextResponse.json({ session_key: key, intervals: [], coverage: false });
        }
        throw e;
      }
      return NextResponse.json({ session_key: key, intervals: data, coverage: true });
    }
    if (resource === "stints") {
      const key = await resolveKey(sessionParam, year);
      const data = await cached(`live-stints-${key}`, TTL.weekend, () => openf1.stints(key));
      return NextResponse.json({ session_key: key, stints: data });
    }
    if (resource === "weather") {
      const key = await resolveKey(sessionParam, year);
      const data = await cached(`live-weather-${key}`, TTL.weekend, () => openf1.weather(key));
      return NextResponse.json({ session_key: key, weather: data.slice(-1)[0] ?? null });
    }
    const sessions = await cached(`live-sessions-${year}`, TTL.weekend, () =>
      openf1.sessions(year),
    );
    return NextResponse.json({ year, count: sessions.length, sessions });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
