import type { StandingRow } from "@/lib/normalize";
import { AnimatedNumber } from "@/lib/motion";

export function StandingsTable({
  title,
  rows,
  href,
}: {
  title: string;
  rows: StandingRow[];
  href: string;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="font-semibold">{title}</h2>
        <a href={href} className="text-sm text-red-600 hover:underline">
          Full standings
        </a>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-zinc-500">
            <th className="px-4 py-2">Pos</th>
            <th className="px-4 py-2">Driver / Team</th>
            <th className="px-4 py-2 text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-t border-zinc-100 dark:border-zinc-800">
              <td className="px-4 py-2">{r.position}</td>
              <td className="px-4 py-2">
                {r.name}
                {r.team ? <span className="text-zinc-500"> · {r.team}</span> : null}
              </td>
              <td className="px-4 py-2 text-right font-medium">
                <AnimatedNumber value={r.points} />
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-zinc-500">
                No data yet — run sync or check upstream API.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
