import { cached, TTL } from "@/lib/cache";
import { jolpica } from "@/lib/sources/jolpica";
import { toStandingRows, type StandingRow } from "@/lib/normalize";
import { DriverCard } from "@/components/driver-card";

export const revalidate = 3600;

export const metadata = { title: "2026 Drivers" };

export default async function DriversPage() {
  let drivers: StandingRow[] = [];
  try {
    const data = await cached("dstand-2026", TTL.season, () => jolpica.driverStandings(2026));
    drivers = toStandingRows(data.MRData.StandingsTable?.StandingsLists[0]?.DriverStandings);
  } catch {
    drivers = [];
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">2026 Drivers</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {drivers.map((d) => (
          <DriverCard
            key={d.id ?? d.name}
            id={d.id ?? ""}
            code={d.code ?? ""}
            name={d.name}
            team={d.team ?? ""}
            teamId={d.teamId ?? ""}
            points={d.points}
            position={d.position}
          />
        ))}
        {drivers.length === 0 && (
          <p className="text-sm text-zinc-500">
            Driver data unavailable — check upstream or run sync.
          </p>
        )}
      </div>
    </div>
  );
}
