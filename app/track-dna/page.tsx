import Link from "next/link";
import { getSeasonResults, getSeasonRounds, type RoundResults, type SeasonRound } from "@/lib/season-data";

export const revalidate = 3600;

export default async function TrackDnaPage() {
  let rounds: SeasonRound[] = [];
  let results: RoundResults[] = [];
  try {
    [rounds, results] = await Promise.all([getSeasonRounds(2026), getSeasonResults(2026)]);
  } catch {
    rounds = [];
    results = [];
  }
  const winnerOf = (round: number) => {
    const r = results.find((x) => x.round === round);
    const w = r?.race.find((x) => x.position === 1);
    const pole = r?.quali.find((x) => x.position === 1);
    return { winner: w ? `${w.driver} (${w.team})` : "–", pole: pole ? `${pole.driver} (${pole.team})` : "–" };
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">2026 Track DNA</h1>
      <p className="text-sm text-zinc-500">Every circuit on the calendar with this season&apos;s winner and polesitter.</p>
      <div className="grid gap-3 md:grid-cols-2">
        {rounds.map((r) => {
          const { winner, pole } = winnerOf(r.round);
          return (
            <Link
              key={r.round}
              href={`/results/${r.round}`}
              className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-red-600/50 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <p className="text-xs uppercase text-zinc-500">Round {r.round} · {r.date}</p>
              <p className="mt-1 font-semibold">{r.name}</p>
              <p className="mt-1 text-sm">Winner: {winner}</p>
              <p className="text-sm text-zinc-500">Pole: {pole}</p>
            </Link>
          );
        })}
        {rounds.length === 0 && (
          <p className="text-sm text-zinc-500">Circuit data unavailable — check upstream.</p>
        )}
      </div>
    </div>
  );
}
