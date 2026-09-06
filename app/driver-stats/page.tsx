import Link from "next/link";
import { getDriverStats, type DriverStat } from "@/lib/analytics";
import { teamColor } from "@/lib/team-colors";

export const revalidate = 3600;

export default async function DriverStatsPage() {
  let drivers: DriverStat[] = [];
  try {
    ({ drivers } = await getDriverStats(2026));
  } catch {
    drivers = [];
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">2026 Driver Stats</h1>
      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-zinc-500">
              <th className="px-4 py-2">Driver</th>
              <th className="px-4 py-2 text-right">Pts</th>
              <th className="px-4 py-2 text-right">W</th>
              <th className="px-4 py-2 text-right">Pod</th>
              <th className="px-4 py-2 text-right">Pol</th>
              <th className="px-4 py-2 text-right">DNF</th>
              <th className="px-4 py-2 text-right">Best</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-2">
                  <span
                    className="mr-2 inline-block h-3 w-1 rounded"
                    style={{ background: teamColor(d.teamId ?? "") }}
                  />
                  <Link href={`/drivers/${d.id}`} className="font-medium hover:underline">
                    {d.name}
                  </Link>{" "}
                  <span className="text-xs text-zinc-500">{d.code}</span>
                </td>
                <td className="px-4 py-2 text-right font-medium">{d.points}</td>
                <td className="px-4 py-2 text-right">{d.wins}</td>
                <td className="px-4 py-2 text-right">{d.podiums}</td>
                <td className="px-4 py-2 text-right">{d.poles}</td>
                <td className="px-4 py-2 text-right">{d.dnfs}</td>
                <td className="px-4 py-2 text-right">{d.best === null ? "–" : `P${d.best}`}</td>
              </tr>
            ))}
            {drivers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-zinc-500">
                  Stats unavailable — check upstream.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
