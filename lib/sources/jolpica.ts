// Typed client for the Jolpica-F1 Ergast-compatible API (historical data).
// Docs: https://github.com/jolpica/jolpica-f1
// Base: https://api.jolpi.ca/ergast/f1

const BASE = process.env.JOLPICA_BASE_URL ?? "https://api.jolpi.ca/ergast/f1";
const USER_AGENT = "f1-stats/0.1.0 (Next.js full-stack)";

async function get<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    // Historical data changes rarely; route-level `cached()` sets the TTL.
    // `no-store` here so Next doesn't implicitly cache upstream fetches.
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Jolpica ${res.status} for ${url.pathname}`);
  return (await res.json()) as T;
}

// ---- Minimal Ergast response shapes (only fields we use) ----

export interface ErgastDriver {
  driverId: string;
  permanentNumber?: string;
  code?: string;
  givenName: string;
  familyName: string;
  nationality: string;
}

export interface ErgastConstructor {
  constructorId: string;
  name: string;
  nationality: string;
}

export interface ErgastRace {
  season: string;
  round: string;
  raceName: string;
  date: string;
  Circuit: { circuitId: string; circuitName: string; Location: { country: string } };
}

export interface ErgastResult {
  number: string;
  position?: string;
  points: string;
  Driver: ErgastDriver;
  Constructor: ErgastConstructor;
  grid: string;
  laps: string;
  status: string;
}

export interface ErgastQualifyingResult {
  number: string;
  position: string;
  Driver: ErgastDriver;
  Constructor: ErgastConstructor;
  Q1?: string;
  Q2?: string;
  Q3?: string;
}

export interface ErgastSprintResult {
  number: string;
  position?: string;
  points: string;
  Driver: ErgastDriver;
  Constructor: ErgastConstructor;
  grid: string;
  laps: string;
  status: string;
}

interface MRData {
  MRData: {
    RaceTable?: {
      Races: (ErgastRace & {
        Results?: ErgastResult[];
        QualifyingResults?: ErgastQualifyingResult[];
        SprintResults?: ErgastSprintResult[];
      })[];
    };
    DriverTable?: { Drivers: ErgastDriver[] };
    ConstructorTable?: { Constructors: ErgastConstructor[] };
    StandingsTable?: {
      StandingsLists: {
        DriverStandings?: {
          position: string;
          points: string;
          wins: string;
          Driver: ErgastDriver;
          Constructors: ErgastConstructor[];
        }[];
        ConstructorStandings?: {
          position: string;
          points: string;
          wins: string;
          Constructor: ErgastConstructor;
        }[];
      }[];
    };
  };
}

export const jolpica = {
  drivers: (season?: string | number) =>
    get<MRData>(`/${season ?? ""}${season ? "/drivers" : "/drivers"}/`, { limit: 100 }),
  constructors: (season?: string | number) =>
    get<MRData>(`/${season ?? ""}${season ? "/constructors" : "/constructors"}/`, {
      limit: 100,
    }),
  schedule: (season: string | number) =>
    get<MRData>(`/${season}/`, { limit: 100 }),
  results: (season: string | number, round: string | number) =>
    get<MRData>(`/${season}/${round}/results/`, { limit: 100 }),
  qualifying: (season: string | number, round: string | number) =>
    get<MRData>(`/${season}/${round}/qualifying/`, { limit: 100 }),
  sprint: (season: string | number, round: string | number) =>
    get<MRData>(`/${season}/${round}/sprint/`, { limit: 100 }),
  driverStandings: (season: string | number) =>
    get<MRData>(`/${season}/driverstandings/`, { limit: 100 }),
  constructorStandings: (season: string | number) =>
    get<MRData>(`/${season}/constructorstandings/`, { limit: 100 }),
};
