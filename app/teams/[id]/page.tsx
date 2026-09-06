import Link from "next/link";
import { cached, TTL } from "@/lib/cache";
import { jolpica } from "@/lib/sources/jolpica";
import { toConstructorRows, toStandingRows } from "@/lib/normalize";
import { getSeasonResults, type RoundResults } from "@/lib/season-data";
import { teamColor } from "@/lib/team-colors";

export const revalidate = 3600;

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [cstand, dstand] = await Promise.all([
    cached("cstand-2026", TTL.season, () => jolpica.constructorStandings(2026)).catch(() => null),
    cached("dstand-2026", TTL.season, () => jolpica.driverStandings(2026)).catch(() => null),
  ]);
  const team = toConstructorRows(
    cstand?.MRData.StandingsTable?.StandingsLists[0]?.ConstructorStandings,
  ).find((t) => t.id === id);
  const drivers = toStandingRows(
    dstand?.MRData.StandingsTable?.StandingsLists[0]?.DriverStandings,
  ).filter((d) => d.teamId === id);

  let seasonResults: RoundResults[] = [];
  try {
    seasonResults = await getSeasonResults(2026);
  } catch {
    seasonResults = [];
  }
  const rounds = seasonResults.map((r) => {
    const teamResults = r.race.filter((x) => x.teamId === id);
    return {
      round: r.round,
      name: r.name,
      points: teamResults.reduce((sum, x) => sum + x.points, 0),
      best: teamResults.length > 0 ? Math.min(...teamResults.map((x) => x.position ?? 99)) : null,
    };
  }).filter((r) => r.points > 0 || r.best !== null);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/teams" className="text-sm text-red-600 hover:underline">
          ← All teams
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <span
            className="inline-block h-8 w-8 rounded"
            style={{ background: teamColor(id) }}
          />
          <div>
            <h1 className="text-2xl font-bold">{team?.name ?? id}</h1>
            <p className="text-sm text-zinc-500">
              {team ? `P${team.position} · ${team.points} pts · ${team.wins} wins` : "2026 season"}
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Drivers</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {drivers.map((d) => (
            <Link
              key={d.id}
              href={`/drivers/${d.id}`}
              className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-red-600/50 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <p className="font-semibold">
                {d.name} <span className="font-mono text-sm text-zinc-500">{d.code}</span>
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                P{d.position} · {d.points} pts · {d.wins} wins
              </p>
            </Link>
          ))}
          {drivers.length === 0 && (
            <p className="text-sm text-zinc-500">No driver data for this team.</p>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">2026 race-by-race</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-zinc-500">
                <th className="px-4 py-2">R</th>
                <th className="px-4 py-2">Grand Prix</th>
                <th className="px-4 py-2 text-right">Best finish</th>
                <th className="px-4 py-2 text-right">Pts</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((r) => (
                <tr key={r.round} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-2">{r.round}</td>
                  <td className="px-4 py-2">
                    <Link href={`/results/${r.round}`} className="hover:underline">
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right">{r.best === 99 ? "–" : `P${r.best}`}</td>
                  <td className="px-4 py-2 text-right font-medium">{r.points}</td>
                </tr>
              ))}
              {rounds.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                    No results found for this team.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
