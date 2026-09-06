import Link from "next/link";
import { getIncidents } from "@/lib/curated";

export const revalidate = 3600;

export const metadata = { title: "Destructors Championship" };

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default async function DestructorsPage() {
  const { available, rows, total } = await getIncidents(2026);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">2026 Destructors Championship</h1>
      {!available ? (
        <p className="text-sm text-amber-600">
          Pending database setup — crash damage has no open API. Provision DATABASE_URL and add
          entries via <Link href="/admin" className="underline">/admin</Link>.
        </p>
      ) : (
        <>
          <p className="text-sm text-zinc-500">Total crash damage: <span className="font-bold text-zinc-900">{fmt(total)}</span></p>
          {rows.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No incidents recorded yet — add them via <Link href="/admin" className="underline">/admin</Link>.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-zinc-500">
                    <th className="px-4 py-2">Driver</th>
                    <th className="px-4 py-2 text-right">Round</th>
                    <th className="px-4 py-2 text-right">Cost</th>
                    <th className="px-4 py-2 text-right">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-zinc-100">
                      <td className="px-4 py-2">
                        <Link href={`/drivers/${r.driverId}`} className="font-medium hover:underline">
                          {r.driver}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-right">{r.roundNo}</td>
                      <td className="px-4 py-2 text-right font-medium">{fmt(r.cost)}</td>
                      <td className="px-4 py-2 text-right text-zinc-500">{r.note || "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
