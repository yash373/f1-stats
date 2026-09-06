import { cached, TTL } from "@/lib/cache";
import { openf1 } from "@/lib/sources/openf1";
import { RacePaceChart, type PaceRow } from "@/components/race-pace-chart";

export const revalidate = 3600;

export const metadata = { title: "Race Pace" };

function median(values: number[]) {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export default async function RacePacePage() {
  let sessionLabel = "";
  let rows: PaceRow[] = [];
  let error: string | null = null;
  try {
    const sessions = await cached("openf1-sessions-2026", TTL.weekend, () => openf1.sessions(2026));
    const races = sessions.filter((s) => s.session_name === "Race");
    const latest = races[races.length - 1];
    if (!latest) throw new Error("no race sessions found");
    sessionLabel = `${latest.location} — ${latest.session_name} (${latest.date_start.slice(0, 10)})`;
    const [laps, drivers] = await Promise.all([
      cached(`openf1-laps-${latest.session_key}`, TTL.weekend, () => openf1.laps(latest.session_key)),
      cached(`openf1-drivers-${latest.session_key}`, TTL.weekend, () => openf1.drivers(latest.session_key)),
    ]);
    const meta = new Map(drivers.map((d) => [d.driver_number, d]));
    const byDriver = new Map<number, number[]>();
    for (const lap of laps) {
      if (lap.lap_duration === null || lap.is_pit_out_lap) continue;
      const arr = byDriver.get(lap.driver_number) ?? [];
      arr.push(lap.lap_duration);
      byDriver.set(lap.driver_number, arr);
    }
    rows = [...byDriver.entries()]
      .filter(([, v]) => v.length >= 3)
      .map(([num, v]) => ({
        acronym: meta.get(num)?.name_acronym ?? String(num),
        median: Math.round(median(v) * 1000) / 1000,
        laps: v.length,
        color: meta.get(num)?.team_colour ? `#${meta.get(num)?.team_colour}` : "#888888",
      }))
      .sort((a, b) => a.median - b.median);
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Race Pace</h1>
      <p className="text-sm text-zinc-500">
        Median representative lap per driver (pit-out laps excluded). {sessionLabel}
      </p>
      {error ? (
        <p className="text-sm text-amber-600">Upstream error: {error}</p>
      ) : (
        <>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <RacePaceChart rows={rows} />
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-zinc-500">
                  <th className="px-4 py-2">Driver</th>
                  <th className="px-4 py-2 text-right">Median</th>
                  <th className="px-4 py-2 text-right">Laps</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.acronym} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="px-4 py-2 font-mono">{r.acronym}</td>
                    <td className="px-4 py-2 text-right font-mono text-xs">{r.median.toFixed(3)}s</td>
                    <td className="px-4 py-2 text-right">{r.laps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
