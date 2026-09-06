// Typed client for the Jolpica-F1 Ergast-compatible API (historical data).
// Docs: https://github.com/jolpica/jolpica-f1
// Base: https://api.jolpi.ca/ergast/f1

import { fetchJson, UpstreamError } from "@/lib/http";

const BASE = process.env.JOLPICA_BASE_URL ?? "https://api.jolpi.ca/ergast/f1";
const USER_AGENT = "f1-stats/0.1.0 (Next.js full-stack)";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function get<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  // Jolpica rate-limits bursts (analytics pages fan out per round) — retry 429s with backoff.
  // Waits are capped for serverless budgets: 4 attempts, max 4s each.
  let lastError: Error = new UpstreamError(`Jolpica failed for ${url.pathname}`);
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await fetchJson<T>(url.toString(), {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        // Historical data changes rarely; route-level `cached()` sets the TTL.
        // `no-store` here so Next doesn't implicitly cache upstream fetches.
        cache: "no-store",
      });
    } catch (e) {
      if (e instanceof UpstreamError && e.status === 429) {
        lastError = new UpstreamError(`Jolpica 429 for ${url.pathname}`, 429);
        await sleep(Math.min(e.retryAfterMs ?? 1000 * 2 ** attempt, 4000));
        continue;
      }
      throw e;
    }
  }
  throw lastError;
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

export interface ErgastPitStop {
  driverId: string;
  lap: string;
  stop: string;
  time: string;
  duration: string;
}

interface MRData {
  MRData: {
    RaceTable?: {
      Races: (ErgastRace & {
        Results?: ErgastResult[];
        QualifyingResults?: ErgastQualifyingResult[];
        SprintResults?: ErgastSprintResult[];
        PitStops?: ErgastPitStop[];
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
  pitstops: (season: string | number, round: string | number) =>
    get<MRData>(`/${season}/${round}/pitstops/`, { limit: 100 }),
  driverStandings: (season: string | number) =>
    get<MRData>(`/${season}/driverstandings/`, { limit: 100 }),
  driverStandingsRound: (season: string | number, round: string | number) =>
    get<MRData>(`/${season}/${round}/driverstandings/`, { limit: 100 }),
  constructorStandings: (season: string | number) =>
    get<MRData>(`/${season}/constructorstandings/`, { limit: 100 }),
  constructorStandingsRound: (season: string | number, round: string | number) =>
    get<MRData>(`/${season}/${round}/constructorstandings/`, { limit: 100 }),
};
