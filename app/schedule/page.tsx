import { cached, TTL } from "@/lib/cache";
import { jolpica } from "@/lib/sources/jolpica";

export const revalidate = 3600;

export default async function SchedulePage() {
  let races: { round: number; name: string; date: string; circuit: string }[] = [];
  try {
    const data = await cached("schedule-2026", TTL.season, () => jolpica.schedule(2026));
    races =
      data.MRData.RaceTable?.Races.map((r) => ({
        round: Number(r.round),
        name: r.raceName,
        date: r.date,
        circuit: r.Circuit.circuitName,
      })) ?? [];
  } catch {
    races = [];
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">2026 Schedule</h1>
      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-zinc-500">
              <th className="px-4 py-2">R</th>
              <th className="px-4 py-2">Grand Prix</th>
              <th className="px-4 py-2">Circuit</th>
              <th className="px-4 py-2 text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            {races.map((r) => (
              <tr key={r.round} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-2">{r.round}</td>
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2">{r.circuit}</td>
                <td className="px-4 py-2 text-right">{r.date}</td>
              </tr>
            ))}
            {races.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                  Schedule unavailable — check upstream or run sync.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
