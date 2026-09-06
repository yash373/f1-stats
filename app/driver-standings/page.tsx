import { StandingsTable } from "@/components/standings-table";
import { ChampionshipChart } from "@/components/championship-chart";
import { cached, TTL } from "@/lib/cache";
import { jolpica } from "@/lib/sources/jolpica";
import { toStandingRows, type StandingRow } from "@/lib/normalize";
import { getChampionshipProgression, type Progression } from "@/lib/analytics";

export const revalidate = 3600;

export const metadata = { title: "2026 Driver Standings" };

export default async function DriverStandingsPage() {
  let rows: StandingRow[] = [];
  try {
    const data = await cached("dstand-2026", TTL.season, () => jolpica.driverStandings(2026));
    rows = toStandingRows(data.MRData.StandingsTable?.StandingsLists[0]?.DriverStandings);
  } catch {
    rows = [];
  }
  let progression: Progression | null = null;
  try {
    progression = await getChampionshipProgression(2026);
  } catch {
    progression = null;
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">2026 Driver Standings</h1>
      {progression && progression.rounds.length > 1 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Championship progression (top 5)</h2>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <ChampionshipChart data={progression} />
          </div>
        </section>
      )}
      <StandingsTable title="Drivers" rows={rows} href="/driver-standings" />
    </div>
  );
}
