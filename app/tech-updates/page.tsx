import Link from "next/link";
import { getTechUpgrades } from "@/lib/curated";
import { teamColor } from "@/lib/team-colors";

export const revalidate = 3600;

export const metadata = { title: "Tech Updates" };

export default async function TechUpdatesPage() {
  const { available, rows } = await getTechUpgrades(2026);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">2026 Tech Updates</h1>
      {!available ? (
        <p className="text-sm text-amber-600">
          Pending database setup — tech upgrades have no open API. Provision DATABASE_URL and add
          entries via <Link href="/admin" className="underline">/admin</Link>.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No upgrades recorded yet — add them via <Link href="/admin" className="underline">/admin</Link>.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs uppercase text-zinc-500">Round {r.roundNo}</p>
              <p className="mt-1 font-medium">{r.title}</p>
              <p className="mt-1 text-sm">
                <span className="mr-2 inline-block h-3 w-1 rounded" style={{ background: teamColor(r.teamId) }} />
                <Link href={`/teams/${r.teamId}`} className="hover:underline">{r.team}</Link>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
