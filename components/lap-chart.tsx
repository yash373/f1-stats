"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface LapPoint {
  driver_number: number;
  position: number;
  date: string;
}

interface DriverMeta {
  driver_number: number;
  acronym: string;
  color: string;
}

// Position timeline bump chart: x = race time, y = position (reversed axis).
export function LapChart({
  sessionKey,
  drivers,
}: {
  sessionKey: number;
  drivers: DriverMeta[];
}) {
  const [rows, setRows] = useState<Record<string, number | string>[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/v1/lapchart?session_key=${sessionKey}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => {
        if (!alive) return;
        const points = (j.points ?? []) as LapPoint[];
        const t0 = points.length > 0 ? new Date(points[0].date).getTime() : 0;
        const byDriver = new Map<number, { t: number; pos: number }[]>();
        for (const p of points) {
          const arr = byDriver.get(p.driver_number) ?? [];
          arr.push({ t: (new Date(p.date).getTime() - t0) / 60000, pos: p.position });
          byDriver.set(p.driver_number, arr);
        }
        // Resample onto a shared time grid (every ~30s of race time).
        const maxT = Math.max(...[...byDriver.values()].flat().map((x) => x.t), 0);
        const out: Record<string, number | string>[] = [];
        for (let t = 0; t <= maxT; t += 0.5) {
          const row: Record<string, number | string> = { t: Math.round(t * 10) / 10 };
          for (const [num, series] of byDriver) {
            let pos = series[0]?.pos;
            for (const s of series) {
              if (s.t <= t) pos = s.pos;
              else break;
            }
            if (pos !== undefined) row[`d${num}`] = pos;
          }
          out.push(row);
        }
        setRows(out.filter((_, i) => i % 2 === 0));
      })
      .catch((e) => {
        if (alive) setError((e as Error).message);
      });
    return () => {
      alive = false;
    };
  }, [sessionKey]);

  if (error) return <p className="text-sm text-amber-600">Lap chart error: {error}</p>;
  if (rows.length === 0) return <p className="text-sm text-zinc-500">Loading lap chart…</p>;

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="t" tickFormatter={(v: number) => `${v}m`} />
          <YAxis reversed domain={[1, 22]} ticks={[1, 5, 10, 15, 20]} />
          <Tooltip labelFormatter={(v) => `+${v} min`} />
          <Legend />
          {drivers.map((d) => (
            <Line
              key={d.driver_number}
              type="stepAfter"
              dataKey={`d${d.driver_number}`}
              name={d.acronym}
              stroke={d.color}
              dot={false}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
