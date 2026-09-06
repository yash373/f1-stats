import Link from "next/link";
import { cached, TTL } from "@/lib/cache";
import { jolpica } from "@/lib/sources/jolpica";
import { toConstructorRows, type StandingRow } from "@/lib/normalize";
import { teamColor } from "@/lib/team-colors";

export const revalidate = 3600;

export default async function TeamsPage() {
  let teams: StandingRow[] = [];
  try {
    const data = await cached("cstand-2026", TTL.season, () =>
      jolpica.constructorStandings(2026),
    );
    teams = toConstructorRows(data.MRData.StandingsTable?.StandingsLists[0]?.ConstructorStandings);
  } catch {
    teams = [];
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">2026 Teams</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {teams.map((t) => (
          <Link
            key={t.id ?? t.name}
            href={`/teams/${t.id}`}
            className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-red-600/50 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-4 w-4 rounded"
                style={{ background: teamColor(t.id ?? "") }}
              />
              <p className="font-semibold">{t.name}</p>
              <span className="ml-auto text-xs text-zinc-500">P{t.position}</span>
            </div>
            <p className="mt-2 text-lg font-bold">
              {t.points} pts <span className="text-sm font-normal text-zinc-500">· {t.wins} wins</span>
            </p>
          </Link>
        ))}
        {teams.length === 0 && (
          <p className="text-sm text-zinc-500">
            Team data unavailable — check upstream or run sync.
          </p>
        )}
      </div>
    </div>
  );
}
