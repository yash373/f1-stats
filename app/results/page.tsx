import Link from "next/link";
import { cached, TTL } from "@/lib/cache";
import { jolpica } from "@/lib/sources/jolpica";

export const revalidate = 3600;

export const metadata = { title: "2026 Results" };

export default async function ResultsPage() {
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
      <h1 className="text-2xl font-bold">2026 Results</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {races.map((r) => (
          <Link
            key={r.round}
            href={`/results/${r.round}`}
            className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-red-600/50"
          >
            <p className="text-xs uppercase text-zinc-500">
              Round {r.round} · {r.date}
            </p>
            <p className="mt-1 font-semibold">{r.name}</p>
            <p className="text-sm text-zinc-500">{r.circuit}</p>
          </Link>
        ))}
        {races.length === 0 && (
          <p className="text-sm text-zinc-500">
            Schedule unavailable — check upstream or run sync.
          </p>
        )}
      </div>
    </div>
  );
}
