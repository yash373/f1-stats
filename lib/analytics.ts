import { cached, TTL } from "@/lib/cache";
import { jolpica } from "@/lib/sources/jolpica";
import { toPitStops, toRaceResults, toStandingRows } from "@/lib/normalize";
import { getSeasonResults, getSeasonRounds } from "@/lib/season-data";

export interface HeadToHead {
  season: number;
  drivers: { name: string; code?: string; team?: string; points: number }[];
  quali: { d1: number; d2: number };
  race: { d1: number; d2: number };
  rounds: {
    round: number;
    name: string;
    quali: (number | null)[];
    race: (number | null)[];
    points: number[];
  }[];
}

export async function getHeadToHead(season: number, d1: string, d2: string): Promise<HeadToHead> {
  return cached(`h2h-${season}-${d1}-${d2}`, TTL.season, async () => {
    const [standingsRes, rounds] = await Promise.all([
      jolpica.driverStandings(season),
      getSeasonResults(season),
    ]);
    const rows = toStandingRows(
      standingsRes.MRData.StandingsTable?.StandingsLists[0]?.DriverStandings,
    );
    const info = (id: string) =>
      rows.find((r) => r.id === id) ?? { name: id, code: "", team: "", points: 0 };
    let qualiD1 = 0;
    let qualiD2 = 0;
    let raceD1 = 0;
    let raceD2 = 0;
    const perRound = rounds.flatMap((r) => {
      const q1 = r.quali.find((x) => x.driverId === d1);
      const q2 = r.quali.find((x) => x.driverId === d2);
      const r1 = r.race.find((x) => x.driverId === d1);
      const r2 = r.race.find((x) => x.driverId === d2);
      if (q1 && q2) {
        if (q1.position < q2.position) qualiD1 += 1;
        else if (q2.position < q1.position) qualiD2 += 1;
      }
      if (r1?.position != null && r2?.position != null) {
        if (r1.position < r2.position) raceD1 += 1;
        else if (r2.position < r1.position) raceD2 += 1;
      }
      if (!q1 && !q2 && !r1 && !r2) return [];
      return [
        {
          round: r.round,
          name: r.name,
          quali: [q1?.position ?? null, q2?.position ?? null],
          race: [r1?.position ?? null, r2?.position ?? null],
          points: [r1?.points ?? 0, r2?.points ?? 0],
        },
      ];
    });
    return {
      season,
      drivers: [info(d1), info(d2)],
      quali: { d1: qualiD1, d2: qualiD2 },
      race: { d1: raceD1, d2: raceD2 },
      rounds: perRound,
    };
  });
}

export interface DriverStat {
  id: string;
  name: string;
  code?: string;
  team?: string;
  teamId?: string;
  position: number;
  points: number;
  wins: number;
  podiums: number;
  poles: number;
  dnfs: number;
  best: number | null;
}

export async function getDriverStats(season: number): Promise<{ season: number; drivers: DriverStat[] }> {
  return cached(`driver-stats-${season}`, TTL.season, async () => {
    const [standingsRes, rounds] = await Promise.all([
      jolpica.driverStandings(season),
      getSeasonResults(season),
    ]);
    const rows = toStandingRows(
      standingsRes.MRData.StandingsTable?.StandingsLists[0]?.DriverStandings,
    );
    const drivers = rows.map((d) => {
      const id = d.id ?? "";
      let podiums = 0;
      let poles = 0;
      let dnfs = 0;
      let best: number | null = null;
      for (const r of rounds) {
        const race = r.race.find((x) => x.driverId === id);
        const quali = r.quali.find((x) => x.driverId === id);
        if (race?.position != null) {
          if (race.position <= 3) podiums += 1;
          best = best === null ? race.position : Math.min(best, race.position);
        }
        if (race && race.status !== "Finished" && !race.status.startsWith("+")) dnfs += 1;
        if (quali?.position === 1) poles += 1;
      }
      return {
        id,
        name: d.name,
        code: d.code,
        team: d.team,
        teamId: d.teamId,
        position: d.position,
        points: d.points,
        wins: d.wins,
        podiums,
        poles,
        dnfs,
        best,
      };
    });
    return { season, drivers };
  });
}

export interface Progression {
  season: number;
  drivers: { id: string; code: string; color: string }[];
  rounds: { round: number; name: string; points: Record<string, number> }[];
}

// Championship points progression for the current top 5, round by round.
export async function getChampionshipProgression(season: number): Promise<Progression> {
  return cached(`progression-${season}`, TTL.season, async () => {
    const [finalRes, rounds] = await Promise.all([
      jolpica.driverStandings(season),
      getSeasonRounds(season),
    ]);
    const finalRows = toStandingRows(
      finalRes.MRData.StandingsTable?.StandingsLists[0]?.DriverStandings,
    );
    const top = finalRows.slice(0, 5);
    const colorOf = (teamId?: string) =>
      teamId === "mercedes" ? "#27F4D2"
      : teamId === "ferrari" ? "#E80020"
      : teamId === "mclaren" ? "#FF8000"
      : teamId === "red-bull-racing" ? "#3671C6"
      : "#888888";
    const perRound: Progression["rounds"] = [];
    for (let i = 0; i < rounds.length; i += 5) {
      const batch = await Promise.all(
        rounds.slice(i, i + 5).map(async (r) => {
          const res = await jolpica.driverStandingsRound(season, r.round).catch(() => null);
          const rows = toStandingRows(res?.MRData.StandingsTable?.StandingsLists[0]?.DriverStandings);
          const points: Record<string, number> = {};
          for (const t of top) {
            const row = rows.find((x) => x.id === t.id);
            if (row) points[t.code ?? t.name] = row.points;
          }
          return { round: r.round, name: r.name, points };
        }),
      );
      perRound.push(...batch);
    }
    return {
      season,
      drivers: top.map((t) => ({ id: t.id ?? "", code: t.code ?? "", color: colorOf(t.teamId) })),
      rounds: perRound,
    };
  });
}

export interface PitStopData {
  season: number;
  round: number;
  raceName: string | null;
  fastest: (ReturnType<typeof toPitStops>[number] & { driver: string; code: string; team: string; teamId: string }) | null;
  stops: ((ReturnType<typeof toPitStops>[number]) & { driver: string; code: string; team: string; teamId: string })[];
  teams: { teamId: string; team: string; stops: number; avg: number; best: number }[];
}

// Latest round with published pit-stop data. The schedule includes future
// rounds, so defaulting to the last scheduled round lands on empty data.
export async function getLatestRoundWithPitStops(season: number): Promise<number> {
  return cached(`pitstops-latest-${season}`, TTL.season, async () => {
    const rounds = await getSeasonRounds(season);
    const past = rounds.filter((r) => new Date(r.date).getTime() <= Date.now());
    const candidates = [...past.map((r) => r.round)].sort((a, b) => b - a);
    for (const round of candidates) {
      try {
        const res = await jolpica.pitstops(season, round);
        const stops = res.MRData.RaceTable?.Races[0]?.PitStops ?? [];
        if (stops.length > 0) return round;
      } catch {
        // Keep walking back — a single failed round shouldn't block the page.
      }
    }
    return candidates[0] ?? 1;
  });
}

export async function getPitStops(season: number, round: number): Promise<PitStopData> {  return cached(`pitstops-${season}-${round}`, TTL.season, async () => {
    const [pitRes, raceRes] = await Promise.all([
      jolpica.pitstops(season, round),
      jolpica.results(season, round).catch(() => null),
    ]);
    const race = pitRes.MRData.RaceTable?.Races[0];
    const drivers = new Map(
      toRaceResults(raceRes?.MRData.RaceTable?.Races[0]?.Results).map((r) => [
        r.driverId,
        { driver: r.driver, code: r.code, team: r.team, teamId: r.teamId },
      ]),
    );
    const stops = toPitStops(race?.PitStops).map((s) => ({
      ...s,
      ...(drivers.get(s.driverId) ?? { driver: s.driverId, code: "", team: "", teamId: "" }),
    }));
    const byTeam = new Map<string, { team: string; total: number; count: number; best: number }>();
    for (const s of stops) {
      const e = byTeam.get(s.teamId) ?? { team: s.team, total: 0, count: 0, best: Infinity };
      e.total += s.duration;
      e.count += 1;
      e.best = Math.min(e.best, s.duration);
      byTeam.set(s.teamId, e);
    }
    const teams = [...byTeam.entries()]
      .map(([teamId, e]) => ({
        teamId,
        team: e.team,
        stops: e.count,
        avg: Math.round((e.total / e.count) * 1000) / 1000,
        best: e.best,
      }))
      .sort((a, b) => a.avg - b.avg);
    return {
      season,
      round,
      raceName: race?.raceName ?? null,
      fastest: stops.length > 0 ? stops.reduce((a, b) => (a.duration <= b.duration ? a : b)) : null,
      stops,
      teams,
    };
  });
}
