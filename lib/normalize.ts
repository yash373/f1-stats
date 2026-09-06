// Normalize upstream shapes (Jolpica Ergast + OpenF1) into one frontend shape.
// Frontend components only import types from here, never raw upstream types.

export interface Driver {
  id: string; // e.g. "antonelli" (Jolpica) or "12" (OpenF1 number fallback)
  code: string; // e.g. "ANT"
  number: number | null;
  name: string;
  team: string;
  teamId: string;
  nationality: string;
  points?: number;
  position?: number;
}

export interface Team {
  id: string;
  name: string;
  points?: number;
  position?: number;
  wins?: number;
}

export interface StandingRow {
  position: number;
  points: number;
  wins: number;
  name: string;
  team?: string;
  code?: string;
  id?: string;
  teamId?: string;
}

export interface RaceResultRow {
  position: number | null;
  points: number;
  driverId: string;
  driver: string;
  code: string;
  teamId: string;
  team: string;
  grid: number;
  laps: number;
  status: string;
  delta: number | null; // grid - finish (positive = gained)
}

export interface QualiResultRow {
  position: number;
  driverId: string;
  driver: string;
  code: string;
  teamId: string;
  team: string;
  q1?: string;
  q2?: string;
  q3?: string;
}

export function toStandingRows(
  list:
    | { position: string; points: string; wins: string; Driver: { driverId: string; code?: string; givenName: string; familyName: string }; Constructors: { constructorId: string; name: string }[] }[]
    | undefined,
): StandingRow[] {
  return (list ?? []).map((s) => ({
    position: Number(s.position),
    points: Number(s.points),
    wins: Number(s.wins),
    name: `${s.Driver.givenName} ${s.Driver.familyName}`,
    code: s.Driver.code ?? "",
    team: s.Constructors[0]?.name ?? "",
    id: s.Driver.driverId,
    teamId: s.Constructors[0]?.constructorId ?? "",
  }));
}

export function toConstructorRows(
  list:
    | { position: string; points: string; wins: string; Constructor: { constructorId: string; name: string } }[]
    | undefined,
): StandingRow[] {
  return (list ?? []).map((s) => ({
    position: Number(s.position),
    points: Number(s.points),
    wins: Number(s.wins),
    name: s.Constructor.name,
    id: s.Constructor.constructorId,
  }));
}

type RawResult = {
  position?: string;
  points: string;
  Driver: { driverId: string; code?: string; givenName: string; familyName: string };
  Constructor: { constructorId: string; name: string };
  grid: string;
  laps: string;
  status: string;
};

export function toRaceResults(list: RawResult[] | undefined): RaceResultRow[] {
  return (list ?? []).map((r) => {
    const pos = r.position !== undefined ? Number(r.position) : null;
    const grid = Number(r.grid);
    return {
      position: pos,
      points: Number(r.points),
      driverId: r.Driver.driverId,
      driver: `${r.Driver.givenName} ${r.Driver.familyName}`,
      code: r.Driver.code ?? "",
      teamId: r.Constructor.constructorId,
      team: r.Constructor.name,
      grid,
      laps: Number(r.laps),
      status: r.status,
      delta: pos !== null && grid > 0 ? grid - pos : null,
    };
  });
}

type RawQuali = {
  position: string;
  Driver: { driverId: string; code?: string; givenName: string; familyName: string };
  Constructor: { constructorId: string; name: string };
  Q1?: string;
  Q2?: string;
  Q3?: string;
};

export function toQualiResults(list: RawQuali[] | undefined): QualiResultRow[] {
  return (list ?? []).map((r) => ({
    position: Number(r.position),
    driverId: r.Driver.driverId,
    driver: `${r.Driver.givenName} ${r.Driver.familyName}`,
    code: r.Driver.code ?? "",
    teamId: r.Constructor.constructorId,
    team: r.Constructor.name,
    q1: r.Q1,
    q2: r.Q2,
    q3: r.Q3,
  }));
}

export interface PitStopRow {
  driverId: string;
  lap: number;
  stop: number;
  time: string;
  duration: number;
}

export function toPitStops(
  list: { driverId: string; lap: string; stop: string; time: string; duration: string }[] | undefined,
): PitStopRow[] {
  return (list ?? []).map((p) => ({
    driverId: p.driverId,
    lap: Number(p.lap),
    stop: Number(p.stop),
    time: p.time,
    duration: Number(p.duration),
  }));
}
