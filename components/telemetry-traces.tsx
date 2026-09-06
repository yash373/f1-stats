"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TracePoint {
  t: string;
  speed: number;
  throttle: number;
  brake: number;
  gear: number;
}

interface Series {
  label: string;
  color: string;
  points: { s: number; speed: number; throttle: number }[];
}

// Overlaid speed traces for two drivers, x = seconds into the session window.
// Downsampled to <= 1500 points per driver for smooth rendering.
export function TelemetryTraces({
  sessionKey,
  drivers,
}: {
  sessionKey: number;
  drivers: { driver_number: number; acronym: string; color: string }[];
}) {
  const [data, setData] = useState<Series[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const all = await Promise.all(
          drivers.map(async (d) => {
            const res = await fetch(
              `/api/v1/telemetry?session_key=${sessionKey}&driver_number=${d.driver_number}`,
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = (await res.json()) as { points: TracePoint[] };
            const t0 = json.points.length > 0 ? new Date(json.points[0].t).getTime() : 0;
            const step = Math.max(1, Math.floor(json.points.length / 1500));
            return {
              label: d.acronym,
              color: d.color,
              points: json.points
                .filter((_, i) => i % step === 0)
                .map((p) => ({
                  s: Math.round((new Date(p.t).getTime() - t0) / 100) / 10,
                  speed: p.speed,
                  throttle: p.throttle,
                })),
            } satisfies Series;
          }),
        );
        if (alive) {
          setData(all);
          setError(null);
        }
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [sessionKey, drivers]);

  const merged = useMemo(() => {
    const len = Math.max(...data.map((d) => d.points.length), 0);
    const rows: Record<string, number>[] = [];
    for (let i = 0; i < len; i++) {
      const row: Record<string, number> = {};
      for (const s of data) {
        const p = s.points[Math.floor((i / len) * s.points.length)];
        if (p) {
          row[`${s.label}_speed`] = p.speed;
          if (row.s === undefined) row.s = p.s;
        }
      }
      rows.push(row);
    }
    return rows.filter((_, i) => i % 2 === 0);
  }, [data]);

  if (error) return <p className="text-sm text-amber-600">Telemetry error: {error}</p>;
  if (data.length === 0) return <p className="text-sm text-zinc-500">Loading traces…</p>;

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={merged} margin={{ right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="s" tickFormatter={(v: number) => `${Math.round(v)}s`} />
          <YAxis tickFormatter={(v: number) => `${v}`} />
          <Tooltip formatter={(v) => [`${v} km/h`, "Speed"]} labelFormatter={(v) => `${v}s`} />
          <Legend />
          <ReferenceArea x1={0} x2={0} />
          {data.map((s) => (
            <Line
              key={s.label}
              type="monotone"
              dataKey={`${s.label}_speed`}
              name={s.label}
              stroke={s.color}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
