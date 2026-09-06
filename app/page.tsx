import { KpiCard } from "@/components/kpi-card";
import { StandingsTable } from "@/components/standings-table";
import { cached, TTL } from "@/lib/cache";
import { jolpica } from "@/lib/sources/jolpica";
import { toConstructorRows, toStandingRows, type StandingRow } from "@/lib/normalize";

export const revalidate = 3600;

async function getHomeData(season = 2026) {
  return cached(`home-${season}`, TTL.season, async () => {
    try {
      const [drivers, constructors] = await Promise.all([
        jolpica.driverStandings(season),
        jolpica.constructorStandings(season),
      ]);
      const driverRows: StandingRow[] = toStandingRows(
        drivers.MRData.StandingsTable?.StandingsLists[0]?.DriverStandings,
      ).slice(0, 10);
      const teamRows: StandingRow[] = toConstructorRows(
        constructors.MRData.StandingsTable?.StandingsLists[0]?.ConstructorStandings,
      ).slice(0, 10);
      return { driverRows, teamRows, live: true, error: null as string | null };
    } catch (e) {
      // Surfaced in the UI badge so failures are diagnosable, not silent.
      return { driverRows: [], teamRows: [], live: false, error: (e as Error).message };
    }
  });
}

export default async function Home() {
  const { driverRows, teamRows, live, error } = await getHomeData();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">2026 Season Overview</h1>
        {!live && (
          <span className="rounded bg-amber-500/15 px-2 py-1 text-xs text-amber-600">
            Upstream unavailable{error ? `: ${error}` : " — showing cached/empty state"}
          </span>
        )}
      </div>

      {/* Static content: KPI cards and standings render without waiting on
          client animation. Motion stays on non-critical flourishes only. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard title="Schedule" value="52.2%" sub="Season completed" href="/schedule" />
        <KpiCard title="Fastest Pit Stop" value="1.99s" sub="Best of season" href="/pit-stops" />
        <KpiCard title="Crash Damage" value="$15.0M" sub="Destructors total" href="/destructors-championship" />
        <KpiCard title="Used Elements" value="532" sub="Power-unit pool" href="/used-elements" />
        <KpiCard title="Tech Upgrades" value="370" sub="Tracked parts" href="/tech-updates" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StandingsTable title="Driver Standings" rows={driverRows} href="/driver-standings" />
        <StandingsTable title="Constructor Standings" rows={teamRows} href="/constructor-standings" />
      </div>
    </div>
  );
}
