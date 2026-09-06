import Link from "next/link";
import type { QualiResultRow, RaceResultRow } from "@/lib/normalize";
import { teamColor } from "@/lib/team-colors";

export function RaceResultTable({ rows }: { rows: RaceResultRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-zinc-500">
            <th className="px-4 py-2">Pos</th>
            <th className="px-4 py-2">Driver</th>
            <th className="px-4 py-2">Team</th>
            <th className="px-4 py-2 text-right">Grid</th>
            <th className="px-4 py-2 text-right">+/-</th>
            <th className="px-4 py-2 text-right">Pts</th>
            <th className="px-4 py-2 text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.driverId} className="border-t border-zinc-100">
              <td className="px-4 py-2 font-medium">{r.position ?? "–"}</td>
              <td className="px-4 py-2">
                <span
                  className="mr-2 inline-block h-3 w-1 rounded"
                  style={{ background: teamColor(r.teamId) }}
                />
                <Link href={`/drivers/${r.driverId}`} className="font-medium hover:underline">
                  {r.driver}
                </Link>{" "}
                <span className="text-xs text-zinc-500">{r.code}</span>
              </td>
              <td className="px-4 py-2">
                <Link href={`/teams/${r.teamId}`} className="hover:underline">
                  {r.team}
                </Link>
              </td>
              <td className="px-4 py-2 text-right">{r.grid || "–"}</td>
              <td
                className={`px-4 py-2 text-right font-medium ${r.delta === null ? "" : r.delta > 0 ? "text-green-600" : r.delta < 0 ? "text-red-600" : ""}`}
              >
                {r.delta === null ? "–" : r.delta > 0 ? `+${r.delta}` : r.delta}
              </td>
              <td className="px-4 py-2 text-right font-medium">{r.points}</td>
              <td className="px-4 py-2 text-right text-zinc-500">{r.status}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-zinc-500">
                No results yet for this session.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function QualiResultTable({ rows }: { rows: QualiResultRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-zinc-500">
            <th className="px-4 py-2">Pos</th>
            <th className="px-4 py-2">Driver</th>
            <th className="px-4 py-2">Team</th>
            <th className="px-4 py-2 text-right">Q1</th>
            <th className="px-4 py-2 text-right">Q2</th>
            <th className="px-4 py-2 text-right">Q3</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.driverId} className="border-t border-zinc-100">
              <td className="px-4 py-2 font-medium">{r.position}</td>
              <td className="px-4 py-2">
                <span
                  className="mr-2 inline-block h-3 w-1 rounded"
                  style={{ background: teamColor(r.teamId) }}
                />
                <Link href={`/drivers/${r.driverId}`} className="font-medium hover:underline">
                  {r.driver}
                </Link>{" "}
                <span className="text-xs text-zinc-500">{r.code}</span>
              </td>
              <td className="px-4 py-2">
                <Link href={`/teams/${r.teamId}`} className="hover:underline">
                  {r.team}
                </Link>
              </td>
              <td className="px-4 py-2 text-right font-mono text-xs">{r.q1 ?? "–"}</td>
              <td className="px-4 py-2 text-right font-mono text-xs">{r.q2 ?? "–"}</td>
              <td className="px-4 py-2 text-right font-mono text-xs">{r.q3 ?? "–"}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                No qualifying data yet for this round.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
