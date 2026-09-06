import { StandingsTable } from "@/components/standings-table";
import { cached, TTL } from "@/lib/cache";
import { jolpica } from "@/lib/sources/jolpica";
import { toStandingRows, type StandingRow } from "@/lib/normalize";

export const revalidate = 3600;

export default async function DriverStandingsPage() {
  let rows: StandingRow[] = [];
  try {
    const data = await cached("dstand-2026", TTL.season, () => jolpica.driverStandings(2026));
    rows = toStandingRows(data.MRData.StandingsTable?.StandingsLists[0]?.DriverStandings);
  } catch {
    rows = [];
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">2026 Driver Standings</h1>
      <StandingsTable title="Drivers" rows={rows} href="/driver-standings" />
    </div>
  );
}
