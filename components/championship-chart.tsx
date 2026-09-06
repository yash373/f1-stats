"use client";

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
import type { Progression } from "@/lib/analytics";

export function ChampionshipChart({ data }: { data: Progression }) {
  const rows = data.rounds.map((r) => ({ round: `R${r.round}`, ...r.points }));
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="round" />
          <YAxis />
          <Tooltip />
          <Legend />
          {data.drivers.map((d) => (
            <Line
              key={d.id}
              type="monotone"
              dataKey={d.code}
              stroke={d.color}
              dot={false}
              strokeWidth={2}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
