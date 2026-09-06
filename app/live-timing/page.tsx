"use client";

import { useCallback, useEffect, useState } from "react";
import { TrackMap } from "@/components/track-map";
import { motion } from "@/lib/motion";

interface Session {
  session_key: number;
  session_name: string;
  location: string;
  date_start: string;
}

interface DriverMeta {
  driver_number: number;
  name_acronym: string;
  team_colour: string;
}

interface Position {
  driver_number: number;
  position: number;
  date: string;
}

interface Interval {
  driver_number: number;
  gap_to_leader: number | null;
  interval: number | null;
  date: string;
}

interface Stint {
  driver_number: number;
  compound: string;
  tyre_age_at_start: number;
  lap_end: number;
}

interface Weather {
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  rainfall: number;
  wind_speed: number;
  date: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: "#E80020",
  MEDIUM: "#FFD12E",
  HARD: "#EBEBEB",
  INTERMEDIATE: "#43B02A",
  WET: "#0067AD",
};

export default function LiveTimingPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionKey, setSessionKey] = useState("latest");
  const [drivers, setDrivers] = useState<Map<number, DriverMeta>>(new Map());
  const [positions, setPositions] = useState<Position[]>([]);
  const [intervals, setIntervals] = useState<Map<number, Interval>>(new Map());
  const [stints, setStints] = useState<Map<number, Stint>>(new Map());
  const [weather, setWeather] = useState<Weather | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSlow = useCallback(async (key: string) => {
    const [d, s, w] = await Promise.all([
      fetchJson<{ drivers: DriverMeta[] }>(`/api/v1/live?resource=drivers&session_key=${key}`),
      fetchJson<{ stints: Stint[] }>(`/api/v1/live?resource=stints&session_key=${key}`),
      fetchJson<{ weather: Weather | null }>(`/api/v1/live?resource=weather&session_key=${key}`),
    ]);
    setDrivers(new Map(d.drivers.map((x) => [x.driver_number, x])));
    const latest = new Map<number, Stint>();
    for (const st of s.stints) {
      const cur = latest.get(st.driver_number);
      if (!cur || st.lap_end >= cur.lap_end) latest.set(st.driver_number, st);
    }
    setStints(latest);
    setWeather(w.weather);
  }, []);

  const pollFast = useCallback(async (key: string) => {
    const [p, iv] = await Promise.all([
      fetchJson<{ positions: Position[] }>(`/api/v1/live?resource=positions&session_key=${key}`),
      fetchJson<{ intervals: Interval[] }>(`/api/v1/live?resource=intervals&session_key=${key}`),
    ]);
    setPositions(p.positions ?? []);
    const latest = new Map<number, Interval>();
    for (const row of iv.intervals ?? []) latest.set(row.driver_number, row);
    setIntervals(latest);
    setError(null);
  }, []);

  useEffect(() => {
    fetchJson<{ sessions: Session[] }>("/api/v1/live?year=2026")
      .then((j) => setSessions(j.sessions ?? []))
      .catch((e) => setError((e as Error).message));
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (alive) {
          await loadSlow(sessionKey);
          await pollFast(sessionKey);
        }
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    })();
    const fast = setInterval(() => pollFast(sessionKey).catch((e) => setError((e as Error).message)), 5000);
    const slow = setInterval(() => loadSlow(sessionKey).catch(() => {}), 60000);
    return () => {
      alive = false;
      clearInterval(fast);
      clearInterval(slow);
    };
  }, [sessionKey, loadSlow, pollFast]);

  const tower = [...positions]
    .sort((a, b) => a.position - b.position)
    .slice(0, 22);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Live Timing</h1>
        <select
          value={sessionKey}
          onChange={(e) => setSessionKey(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="latest">Latest session</option>
          {sessions.map((s) => (
            <option key={s.session_key} value={s.session_key}>
              {s.location} — {s.session_name}
            </option>
          ))}
        </select>
      </div>

      {weather && (
        <div className="flex flex-wrap gap-4 rounded-xl border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span>Air {weather.air_temperature.toFixed(1)}°C</span>
          <span>Track {weather.track_temperature.toFixed(1)}°C</span>
          <span>Humidity {weather.humidity.toFixed(0)}%</span>
          <span>Rain {weather.rainfall ? "yes" : "no"}</span>
          <span>Wind {weather.wind_speed.toFixed(1)} m/s</span>
        </div>
      )}

      {error && <p className="text-sm text-amber-600">Upstream error: {error}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-semibold uppercase text-zinc-500">Track map</h2>
          <TrackMap
            sessionKey={sessionKey === "latest" ? "latest" : Number(sessionKey)}
            drivers={[...drivers.values()].map((d) => ({
              driver_number: d.driver_number,
              acronym: d.name_acronym,
              color: d.team_colour ? `#${d.team_colour}` : "#888888",
            }))}
          />
        </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-zinc-500">
              <th className="px-4 py-2">Pos</th>
              <th className="px-4 py-2">Driver</th>
              <th className="px-4 py-2 text-right">Gap</th>
              <th className="px-4 py-2 text-right">Int</th>
              <th className="px-4 py-2 text-right">Tyre</th>
            </tr>
          </thead>
          <tbody>
            {tower.map((p) => {
              const meta = drivers.get(p.driver_number);
              const iv = intervals.get(p.driver_number);
              const st = stints.get(p.driver_number);
              return (
                <motion.tr
                  key={p.driver_number}
                  layout
                  transition={{ type: "spring", stiffness: 350, damping: 32 }}
                  className="border-t border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-4 py-2 font-medium">{p.position}</td>
                  <td className="px-4 py-2">
                    <span
                      className="mr-2 inline-block h-3 w-1 rounded"
                      style={{ background: meta?.team_colour ? `#${meta.team_colour}` : "#888" }}
                    />
                    <span className="font-mono font-medium">
                      {meta?.name_acronym ?? `#${p.driver_number}`}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs">
                    {p.position === 1 ? "LEADER" : iv?.gap_to_leader != null ? `+${iv.gap_to_leader.toFixed(3)}` : "–"}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs">
                    {p.position === 1 ? "–" : iv?.interval != null ? `+${iv.interval.toFixed(3)}` : "–"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {st ? (
                      <span
                        className="rounded px-1.5 py-0.5 font-mono text-xs"
                        style={{ background: `${COMPOUND_COLORS[st.compound] ?? "#888"}33` }}
                      >
                        {st.compound[0]} · {st.tyre_age_at_start}
                      </span>
                    ) : (
                      <span className="text-zinc-500">–</span>
                    )}
                  </td>
                </motion.tr>
              );
            })}
            {tower.length === 0 && !error && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                  Waiting for session data…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
      <p className="text-xs text-zinc-500">
        Positions/gaps poll every 5s; tyres/weather every 60s. Upstream OpenF1 has a ~3s broadcast delay.
      </p>
    </div>
  );
}
