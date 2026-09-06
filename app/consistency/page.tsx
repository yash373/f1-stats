import Link from "next/link";
import { cached, TTL } from "@/lib/cache";
import { jolpica } from "@/lib/sources/jolpica";
import { toStandingRows } from "@/lib/normalize";
import { getSeasonResults, type RoundResults } from "@/lib/season-data";

export const revalidate = 3600;

function cellColor(pts: number) {
  if (pts >= 25) return "bg-red-600 text-white";
  if (pts >= 15) return "bg-red-500/70 text-white";
  if (pts >= 10) return "bg-orange-500/60";
  if (pts >= 1) return "bg-yellow-500/40";
  return "bg-zinc-100 dark:bg-zinc-800";
}

export default async function ConsistencyPage() {
  const standings = await cached("dstand-2026", TTL.season, () =>
    jolpica.driverStandings(2026),
  ).catch(() => null);
  const drivers = toStandingRows(standings?.MRData.StandingsTable?.StandingsLists[0]?.DriverStandings);
  let rounds: RoundResults[] = [];
  try {
    rounds = await getSeasonResults(2026);
  } catch {
    rounds = [];
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">2026 Consistency</h1>
      <p className="text-sm text-zinc-500">Points scored per round — darker means more points.</p>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-zinc-500">
              <th className="px-4 py-2">Driver</th>
              {rounds.map((r) => (
                <th key={r.round} className="px-2 py-2 text-center" title={r.name}>
                  R{r.round}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-2">
                  <Link href={`/drivers/${d.id}`} className="font-mono text-xs hover:underline">
                    {d.code}
                  </Link>
                </td>
                {rounds.map((r) => {
                  const pts = r.race.find((x) => x.driverId === d.id)?.points ?? 0;
                  return (
                    <td key={r.round} className="px-2 py-1 text-center">
                      <span className={`inline-block min-w-8 rounded px-1 py-0.5 text-xs ${cellColor(pts)}`}>
                        {pts}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
