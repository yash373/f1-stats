import Link from "next/link";
import { getPowerUnitElements } from "@/lib/curated";

export const revalidate = 3600;

const LIMITS: Record<string, number> = { ICE: 4, TC: 4, "MGU-K": 4, ES: 2, CE: 2, EX: 8 };

export default async function UsedElementsPage() {
  const { available, rows } = await getPowerUnitElements(2026);
  const byDriver = new Map<string, { driverId: string; driver: string; parts: { component: string; count: number }[] }>();
  for (const r of rows) {
    const e = byDriver.get(r.driverId) ?? { driverId: r.driverId, driver: r.driver, parts: [] };
    e.parts.push({ component: r.component, count: r.count });
    byDriver.set(r.driverId, e);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">2026 Used Elements</h1>
      {!available ? (
        <p className="text-sm text-amber-600">
          Pending database setup — PU pools have no open API. Provision DATABASE_URL and add
          entries via <Link href="/admin" className="underline">/admin</Link>.
        </p>
      ) : byDriver.size === 0 ? (
        <p className="text-sm text-zinc-500">
          No elements recorded yet — add them via <Link href="/admin" className="underline">/admin</Link>.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {[...byDriver.values()].map((d) => (
            <div key={d.driverId} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <Link href={`/drivers/${d.driverId}`} className="font-semibold hover:underline">
                {d.driver}
              </Link>
              <div className="mt-2 space-y-1">
                {d.parts.map((p) => {
                  const limit = LIMITS[p.component] ?? 0;
                  const over = limit > 0 && p.count > limit;
                  return (
                    <div key={p.component} className="flex items-center gap-2 text-sm">
                      <span className="w-16 font-mono">{p.component}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
                        <div
                          className={`h-full ${over ? "bg-red-600" : "bg-green-600"}`}
                          style={{ width: `${limit > 0 ? Math.min(100, (p.count / limit) * 100) : 0}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs">
                        {p.count}{limit > 0 ? `/${limit}` : ""} {over && "⚠"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
