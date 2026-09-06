import Link from "next/link";
import { cached, TTL } from "@/lib/cache";
import { jolpica } from "@/lib/sources/jolpica";
import { toStandingRows } from "@/lib/normalize";
import { getSeasonResults, type RoundResults } from "@/lib/season-data";
import { teamColor } from "@/lib/team-colors";

export const revalidate = 3600;
export const maxDuration = 60;

export default async function DriverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const standings = await cached("dstand-2026", TTL.season, () =>
    jolpica.driverStandings(2026),
  ).catch(() => null);
  const rows = toStandingRows(standings?.MRData.StandingsTable?.StandingsLists[0]?.DriverStandings);
  const driver = rows.find((d) => d.id === id);

  let seasonResults: RoundResults[] = [];
  try {
    seasonResults = await getSeasonResults(2026);
  } catch {
    seasonResults = [];
  }

  const finishes = seasonResults.map((r) => {
    const race = r.race.find((x) => x.driverId === id);
    const quali = r.quali.find((x) => x.driverId === id);
    return {
      round: r.round,
      name: r.name,
      qualiPos: quali?.position ?? null,
      racePos: race?.position ?? null,
      points: race?.points ?? 0,
      status: race?.status ?? "–",
    };
  }).filter((f) => f.racePos !== null || f.qualiPos !== null);

  const name = driver?.name ?? finishes.length > 0 ? id : id;
  const podiums = finishes.filter((f) => f.racePos !== null && f.racePos <= 3).length;
  const poles = finishes.filter((f) => f.qualiPos === 1).length;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/drivers" className="text-sm text-red-600 hover:underline">
          ← All drivers
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <span
            className="inline-block h-8 w-2 rounded"
            style={{ background: teamColor(driver?.teamId ?? "") }}
          />
          <div>
            <h1 className="text-2xl font-bold">
              {name}{" "}
              <span className="font-mono text-lg text-zinc-500">{driver?.code}</span>
            </h1>
            <p className="text-sm text-zinc-500">
              {driver?.team ? (
                <Link href={`/teams/${driver.teamId}`} className="hover:underline">
                  {driver.team}
                </Link>
              ) : (
                "2026 season"
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Championship", value: driver ? `P${driver.position}` : "–" },
          { label: "Points", value: driver ? String(driver.points) : "–" },
          { label: "Wins", value: driver ? String(driver.wins) : "–" },
          { label: "Podiums", value: String(podiums) },
          { label: "Poles", value: String(poles) },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-xs uppercase text-zinc-500">{s.label}</p>
            <p className="mt-1 text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">2026 race-by-race</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-zinc-500">
                <th className="px-4 py-2">R</th>
                <th className="px-4 py-2">Grand Prix</th>
                <th className="px-4 py-2 text-right">Quali</th>
                <th className="px-4 py-2 text-right">Race</th>
                <th className="px-4 py-2 text-right">Pts</th>
                <th className="px-4 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {finishes.map((f) => (
                <tr key={f.round} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-2">{f.round}</td>
                  <td className="px-4 py-2">
                    <Link href={`/results/${f.round}`} className="hover:underline">
                      {f.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right">{f.qualiPos ?? "–"}</td>
                  <td className="px-4 py-2 text-right font-medium">{f.racePos ?? "–"}</td>
                  <td className="px-4 py-2 text-right">{f.points}</td>
                  <td className="px-4 py-2 text-right text-zinc-500">{f.status}</td>
                </tr>
              ))}
              {finishes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                    No results found for this driver.
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
