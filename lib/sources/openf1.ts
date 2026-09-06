// Typed client for the OpenF1 API (live + 2023+ telemetry).
// Docs: https://openf1.org — no key needed, generous free tier (3 req/s).

import { fetchJson } from "@/lib/http";

const BASE = process.env.OPENF1_BASE_URL ?? "https://api.openf1.org/v1";

async function get<T>(endpoint: string, params: Record<string, string | number | boolean> = {}): Promise<T> {
  const url = new URL(`${BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  return fetchJson<T>(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
}

export interface OpenF1Session {
  session_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
  location: string;
  country_name: string;
  circuit_short_name: string;
  year: number;
}

export interface OpenF1Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  headshot_url: string | null;
  country_code: string | null;
}

export interface OpenF1Position {
  driver_number: number;
  position: number;
  date: string;
  session_key: number;
}

export interface OpenF1Lap {
  session_key: number;
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  is_pit_out_lap: boolean;
}

export interface OpenF1Stint {
  session_key: number;
  driver_number: number;
  stint_number: number;
  lap_start: number;
  lap_end: number;
  compound: string;
  tyre_age_at_start: number;
}

export interface OpenF1Interval {
  session_key: number;
  driver_number: number;
  gap_to_leader: number | null;
  interval: number | null;
  date: string;
}

export interface OpenF1Weather {
  session_key: number;
  date: string;
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  rainfall: number;
  wind_speed: number;
}

export interface OpenF1CarDatum {
  session_key: number;
  driver_number: number;
  date: string;
  speed: number;
  throttle: number;
  brake: number;
  n_gear: number;
  rpm: number;
  drs: number | null;
}

export interface OpenF1TrackPoint {
  session_key: number;
  driver_number: number;
  date: string;
  x: number;
  y: number;
}

export const openf1 = {
  sessions: (year: number) => get<OpenF1Session[]>("sessions", { year }),
  session: (sessionKey: number | "latest") =>
    get<OpenF1Session[]>("sessions", { session_key: sessionKey }),
  drivers: (sessionKey: number | "latest") =>
    get<OpenF1Driver[]>("drivers", { session_key: sessionKey }),
  positions: (sessionKey: number | "latest") =>
    get<OpenF1Position[]>("position", { session_key: sessionKey }),
  laps: (sessionKey: number | "latest") =>
    get<OpenF1Lap[]>("laps", { session_key: sessionKey }),
  stints: (sessionKey: number | "latest") =>
    get<OpenF1Stint[]>("stints", { session_key: sessionKey }),
  // Intervals only return rows with an explicit date filter; pass dateAfter like "2026-09-06T12:00:00".
  intervals: (sessionKey: number | "latest", dateAfter?: string) =>
    get<OpenF1Interval[]>("intervals", {
      session_key: sessionKey,
      ...(dateAfter ? { date: `>${dateAfter}` } : {}),
    }),
  weather: (sessionKey: number | "latest") =>
    get<OpenF1Weather[]>("weather", { session_key: sessionKey }),
  carData: (sessionKey: number, driverNumber?: number) =>
    get<OpenF1CarDatum[]>("car_data", {
      session_key: sessionKey,
      ...(driverNumber !== undefined ? { driver_number: driverNumber } : {}),
    }),
  location: (sessionKey: number, driverNumber?: number) =>
    get<OpenF1TrackPoint[]>("location", {
      session_key: sessionKey,
      ...(driverNumber !== undefined ? { driver_number: driverNumber } : {}),
    }),
};
