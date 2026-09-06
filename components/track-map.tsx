"use client";

import { useEffect, useMemo, useState } from "react";

interface TrackDriver {
  driver_number: number;
  points: { x: number; y: number }[];
}

interface Meta {
  driver_number: number;
  acronym: string;
  color: string;
}

// SVG track outline with animated position dots that replay along stored paths.
export function TrackMap({
  sessionKey,
  drivers,
  height = 320,
}: {
  sessionKey: number | "latest";
  drivers: Meta[];
  height?: number;
}) {
  const [tracks, setTracks] = useState<TrackDriver[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch(`/api/v1/track?session_key=${sessionKey}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => {
        if (alive) setTracks(j.drivers ?? []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [sessionKey]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1500);
    return () => clearInterval(id);
  }, []);

  const meta = useMemo(() => new Map(drivers.map((d) => [d.driver_number, d])), [drivers]);

  const bounds = useMemo(() => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const t of tracks) {
      for (const p of t.points) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
    }
    if (!Number.isFinite(minX)) return null;
    return { minX, maxX, minY, maxY };
  }, [tracks]);

  if (!bounds || tracks.length === 0) {
    return <p className="text-sm text-zinc-500">Loading track map…</p>;
  }

  const W = 600;
  const H = 400;
  const pad = 30;
  const sx = (x: number) => pad + ((x - bounds.minX) / (bounds.maxX - bounds.minX || 1)) * (W - pad * 2);
  const sy = (y: number) => pad + ((y - bounds.minY) / (bounds.maxY - bounds.minY || 1)) * (H - pad * 2);
  const outline = tracks[0]?.points ?? [];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      <polyline
        points={outline.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.25}
        strokeWidth={3}
      />
      {tracks.map((t) => {
        const m = meta.get(t.driver_number);
        if (t.points.length === 0) return null;
        const p = t.points[tick % t.points.length];
        return (
          <g key={t.driver_number}>
            <circle cx={sx(p.x)} cy={sy(p.y)} r={9} fill={m?.color ?? "#888"} />
            <text
              x={sx(p.x)}
              y={sy(p.y) + 3.5}
              textAnchor="middle"
              fontSize={8}
              fontWeight="bold"
              fill="#000"
            >
              {m?.acronym ?? t.driver_number}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
