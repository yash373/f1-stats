"use client";

import { useEffect, useState } from "react";

interface Position {
  driver_number: number;
  position: number;
  date: string;
}

export default function LiveTimingPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const res = await fetch("/api/v1/live?resource=positions");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (alive) {
          setPositions(json.positions ?? []);
          setError(null);
        }
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    }
    poll();
    const id = setInterval(poll, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Live Timing</h1>
      <p className="text-sm text-zinc-500">
        Polls internal proxy every 5s (upstream OpenF1, ~3s broadcast delay). Outside race
        weekends this shows the latest session.
      </p>
      {error && <p className="text-sm text-amber-600">Upstream error: {error}</p>}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-zinc-500">
              <th className="px-4 py-2">Pos</th>
              <th className="px-4 py-2">Car</th>
              <th className="px-4 py-2 text-right">Updated</th>
            </tr>
          </thead>
          <tbody>
            {positions.slice(0, 22).map((p, i) => (
              <tr key={`${p.driver_number}-${i}`} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-2">{p.position}</td>
                <td className="px-4 py-2">#{p.driver_number}</td>
                <td className="px-4 py-2 text-right text-zinc-500">{p.date}</td>
              </tr>
            ))}
            {positions.length === 0 && !error && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-zinc-500">
                  Waiting for session data…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
