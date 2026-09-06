import Link from "next/link";
import { cached, TTL } from "@/lib/cache";
import { jolpica } from "@/lib/sources/jolpica";
import { toStandingRows } from "@/lib/normalize";
import { getHeadToHead } from "@/lib/analytics";

export const revalidate = 3600;

function ScoreBar({ a, b }: { a: number; b: number }) {
  const total = a + b || 1;
  return (
    <div className="flex h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div className="bg-red-600" style={{ width: `${(a / total) * 100}%` }} />
      <div className="bg-zinc-400" style={{ width: `${(b / total) * 100}%` }} />
    </div>
  );
}

export default async function HeadToHeadPage({
  searchParams,
}: {
  searchParams: Promise<{ d1?: string; d2?: string }>;
}) {
  const params = await searchParams;
  const standings = await cached("dstand-2026", TTL.season, () =>
    jolpica.driverStandings(2026),
  ).catch(() => null);
  const drivers = toStandingRows(standings?.MRData.StandingsTable?.StandingsLists[0]?.DriverStandings);
  const d1 = params.d1 ?? drivers[0]?.id ?? "antonelli";
  const d2 = params.d2 ?? drivers[1]?.id ?? "russell";

  let h2h = null;
  try {
    h2h = await getHeadToHead(2026, d1, d2);
  } catch {
    h2h = null;
  }

  const picker = (key: "d1" | "d2", current: string) => (
    <div className="flex flex-wrap gap-1">
      {drivers.map((d) => (
        <Link
          key={d.id}
          href={`/head-to-head?d1=${key === "d1" ? d.id : d1}&d2=${key === "d2" ? d.id : d2}`}
          className={`rounded px-2 py-1 font-mono text-xs ${d.id === current ? "bg-red-600 text-white" : "bg-zinc-200 dark:bg-zinc-800"}`}
        >
          {d.code}
        </Link>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Head To Head</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm text-zinc-500">Driver 1</p>
          {picker("d1", d1)}
        </div>
        <div className="space-y-2">
          <p className="text-sm text-zinc-500">Driver 2</p>
          {picker("d2", d2)}
        </div>
      </div>

      {!h2h ? (
        <p className="text-sm text-zinc-500">Comparison unavailable — check upstream.</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {h2h.drivers.map((d, i) => (
              <div key={i} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="font-semibold">{d.name}</p>
                <p className="text-sm text-zinc-500">{d.team} · {d.points} pts</p>
              </div>
            ))}
          </div>
          <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <p className="text-sm">Qualifying: {h2h.quali.d1} – {h2h.quali.d2}</p>
              <ScoreBar a={h2h.quali.d1} b={h2h.quali.d2} />
            </div>
            <div>
              <p className="text-sm">Race: {h2h.race.d1} – {h2h.race.d2}</p>
              <ScoreBar a={h2h.race.d1} b={h2h.race.d2} />
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-zinc-500">
                  <th className="px-4 py-2">R</th>
                  <th className="px-4 py-2">GP</th>
                  <th className="px-4 py-2 text-right">Quali</th>
                  <th className="px-4 py-2 text-right">Race</th>
                  <th className="px-4 py-2 text-right">Pts</th>
                </tr>
              </thead>
              <tbody>
                {h2h.rounds.map((r) => (
                  <tr key={r.round} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="px-4 py-2">{r.round}</td>
                    <td className="px-4 py-2">{r.name}</td>
                    <td className="px-4 py-2 text-right font-mono text-xs">{r.quali[0] ?? "–"} : {r.quali[1] ?? "–"}</td>
                    <td className="px-4 py-2 text-right font-mono text-xs">{r.race[0] ?? "–"} : {r.race[1] ?? "–"}</td>
                    <td className="px-4 py-2 text-right font-mono text-xs">{r.points[0]} : {r.points[1]}</td>
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
