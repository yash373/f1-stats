"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface PaceRow {
  acronym: string;
  median: number;
  laps: number;
  color: string;
}

export function RacePaceChart({ rows }: { rows: PaceRow[] }) {
  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis type="number" domain={["auto", "auto"]} tickFormatter={(v: number) => v.toFixed(1)} />
          <YAxis type="category" dataKey="acronym" width={48} />
          <Tooltip formatter={(v) => [`${Number(v).toFixed(3)}s median`, "Pace"]} />
          <Bar dataKey="median" name="Median lap">
            {rows.map((r) => (
              <Cell key={r.acronym} fill={r.color || "#888888"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
