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
    </div>
  );
}
