import Link from "next/link";
import { getPitStops } from "@/lib/analytics";
import { getSeasonRounds } from "@/lib/season-data";
import { teamColor } from "@/lib/team-colors";

export const revalidate = 3600;

export const metadata = { title: "Pit Stops" };

export default async function PitStopsPage({
  searchParams,
}: {
  searchParams: Promise<{ round?: string }>;
}) {
  const params = await searchParams;
  const rounds = await getSeasonRounds(2026);
  const round = Number(params.round ?? rounds[rounds.length - 1]?.round ?? 1);

  let data = null;
  try {
    data = await getPitStops(2026, round);
  } catch {
    data = null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">2026 Pit Stops</h1>
      <div className="flex flex-wrap gap-1">
        {rounds.map((r) => (
          <Link
            key={r.round}
            href={`/pit-stops?round=${r.round}`}
            className={`rounded px-2 py-1 text-xs ${r.round === round ? "bg-red-600 text-white" : "bg-zinc-200 dark:bg-zinc-800"}`}
          >
            R{r.round}
          </Link>
        ))}
      </div>

      {!data || data.stops.length === 0 ? (
        <p className="text-sm text-zinc-500">No pit stop data for round {round} yet.</p>
      ) : (
        <>
          <p className="text-sm text-zinc-500">
            {data.raceName} — fastest: {data.fastest?.driver} ({data.fastest?.duration.toFixed(3)}s)
          </p>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Team averages</h2>
            <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-zinc-500">
                    <th className="px-4 py-2">Team</th>
                    <th className="px-4 py-2 text-right">Stops</th>
                    <th className="px-4 py-2 text-right">Avg</th>
                    <th className="px-4 py-2 text-right">Best</th>
                  </tr>
                </thead>
                <tbody>
                  {data.teams.map((t) => (
                    <tr key={t.teamId} className="border-t border-zinc-100 dark:border-zinc-800">
                      <td className="px-4 py-2">
                        <span className="mr-2 inline-block h-3 w-1 rounded" style={{ background: teamColor(t.teamId) }} />
                        <Link href={`/teams/${t.teamId}`} className="hover:underline">{t.team}</Link>
                      </td>
                      <td className="px-4 py-2 text-right">{t.stops}</td>
                      <td className="px-4 py-2 text-right font-mono text-xs">{t.avg.toFixed(3)}s</td>
                      <td className="px-4 py-2 text-right font-mono text-xs">{t.best.toFixed(3)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">All stops</h2>
            <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-zinc-500">
                    <th className="px-4 py-2">Driver</th>
                    <th className="px-4 py-2 text-right">Lap</th>
                    <th className="px-4 py-2 text-right">Stop</th>
                    <th className="px-4 py-2 text-right">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.stops].sort((a, b) => a.duration - b.duration).map((s, i) => (
                    <tr key={`${s.driverId}-${s.stop}-${i}`} className="border-t border-zinc-100 dark:border-zinc-800">
                      <td className="px-4 py-2">
                        <Link href={`/drivers/${s.driverId}`} className="hover:underline">{s.driver}</Link>{" "}
                        <span className="text-xs text-zinc-500">{s.code}</span>
                      </td>
                      <td className="px-4 py-2 text-right">{s.lap}</td>
                      <td className="px-4 py-2 text-right">{s.stop}</td>
                      <td className="px-4 py-2 text-right font-mono text-xs">{s.duration.toFixed(3)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
