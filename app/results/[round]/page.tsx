import Link from "next/link";
import { cached, TTL } from "@/lib/cache";
import { jolpica } from "@/lib/sources/jolpica";
import {
  toQualiResults,
  toRaceResults,
  type QualiResultRow,
  type RaceResultRow,
} from "@/lib/normalize";
import { QualiResultTable, RaceResultTable } from "@/components/result-table";
import { LapChart } from "@/components/lap-chart";
import { findRaceSession } from "@/lib/openf1-mapping";
import { openf1 } from "@/lib/sources/openf1";

export const revalidate = 3600;

async function getRoundData(season: number, round: string) {
  return cached(`round-${season}-${round}`, TTL.season, async () => {
    const [raceRes, qualiRes, sprintRes] = await Promise.all([
      jolpica.results(season, round).catch(() => null),
      jolpica.qualifying(season, round).catch(() => null),
      jolpica.sprint(season, round).catch(() => null),
    ]);
    const race = raceRes?.MRData.RaceTable?.Races[0];
    const quali = qualiRes?.MRData.RaceTable?.Races[0];
    const sprint = sprintRes?.MRData.RaceTable?.Races[0];
    return {
      raceName: race?.raceName ?? quali?.raceName ?? `Round ${round}`,
      date: race?.date ?? quali?.date ?? "",
      circuit: race?.Circuit.circuitName ?? quali?.Circuit.circuitName ?? "",
      race: toRaceResults(race?.Results),
      quali: toQualiResults(quali?.QualifyingResults),
      sprint: toRaceResults(sprint?.SprintResults),
    };
  });
}

export default async function RoundPage({
  params,
}: {
  params: Promise<{ round: string }>;
}) {
  const { round } = await params;
  let data: {
    raceName: string;
    date: string;
    circuit: string;
    race: RaceResultRow[];
    quali: QualiResultRow[];
    sprint: RaceResultRow[];
  };
  try {
    data = await getRoundData(2026, round);
  } catch {
    data = { raceName: `Round ${round}`, date: "", circuit: "", race: [], quali: [], sprint: [] };
  }

  // OpenF1 session mapping unlocks lap chart + strategy when available (2023+).
  let sessionKey: number | null = null;
  let lapDrivers: { driver_number: number; acronym: string; color: string }[] = [];
  let stints: { driver: string; code: string; compound: string; lap_start: number; lap_end: number }[] = [];
  try {
    sessionKey = await findRaceSession(2026, Number(round));
    if (sessionKey !== null) {
      const [driverList, stintList] = await Promise.all([
        cached(`openf1-drivers-${sessionKey}`, TTL.weekend, () => openf1.drivers(sessionKey as number)),
        cached(`openf1-stints-${sessionKey}`, TTL.weekend, () => openf1.stints(sessionKey as number)),
      ]);
      const meta = new Map(driverList.map((d) => [d.driver_number, d]));
      lapDrivers = driverList.map((d) => ({
        driver_number: d.driver_number,
        acronym: d.name_acronym,
        color: d.team_colour ? `#${d.team_colour}` : "#888888",
      }));
      stints = stintList.map((s) => ({
        driver: meta.get(s.driver_number)?.full_name ?? `#${s.driver_number}`,
        code: meta.get(s.driver_number)?.name_acronym ?? "",
        compound: s.compound,
        lap_start: s.lap_start,
        lap_end: s.lap_end,
      }));
    }
  } catch {
    sessionKey = null;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/results" className="text-sm text-red-600 hover:underline">
          ← All results
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{data.raceName}</h1>
        <p className="text-sm text-zinc-500">
          {data.circuit} {data.date ? `· ${data.date}` : ""}
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Race</h2>
        <RaceResultTable rows={data.race} />
      </section>

      {data.sprint.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Sprint</h2>
          <RaceResultTable rows={data.sprint} />
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Qualifying</h2>
        <QualiResultTable rows={data.quali} />
      </section>

      {sessionKey !== null && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Position history</h2>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <LapChart sessionKey={sessionKey} drivers={lapDrivers} />
          </div>
        </section>
      )}

      {stints.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Tyre strategy</h2>
          <div className="space-y-1">
            {stints.slice(0, 60).map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-12 font-mono">{s.code}</span>
                <span className="w-24 truncate">{s.compound}</span>
                <div className="h-2 flex-1 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full bg-red-600/70"
                    style={{
                      marginLeft: `${Math.min(100, s.lap_start * 1.5)}%`,
                      width: `${Math.max(2, Math.min(100, (s.lap_end - s.lap_start + 1) * 1.5))}%`,
                    }}
                  />
                </div>
                <span className="w-20 text-right font-mono text-zinc-500">
                  L{s.lap_start}–L{s.lap_end}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
