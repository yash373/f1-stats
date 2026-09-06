import { StandingsTable } from "@/components/standings-table";
import { cached, TTL } from "@/lib/cache";
import { jolpica } from "@/lib/sources/jolpica";
import { toConstructorRows, type StandingRow } from "@/lib/normalize";

export const revalidate = 3600;

export const metadata = { title: "2026 Constructor Standings" };

export default async function ConstructorStandingsPage() {
  let rows: StandingRow[] = [];
  try {
    const data = await cached("cstand-2026", TTL.season, () =>
      jolpica.constructorStandings(2026),
    );
    rows = toConstructorRows(data.MRData.StandingsTable?.StandingsLists[0]?.ConstructorStandings);
  } catch {
    rows = [];
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">2026 Constructor Standings</h1>
      <StandingsTable title="Constructors" rows={rows} href="/constructor-standings" />
    </div>
  );
}
