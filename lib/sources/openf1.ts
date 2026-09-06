// Typed client for the OpenF1 API (live + 2023+ telemetry).
// Docs: https://openf1.org — no key needed, generous free tier (3 req/s).

const BASE = process.env.OPENF1_BASE_URL ?? "https://api.openf1.org/v1";

async function get<T>(endpoint: string, params: Record<string, string | number | boolean> = {}): Promise<T> {
  const url = new URL(`${BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`OpenF1 ${res.status} for ${endpoint}`);
  return (await res.json()) as T;
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

export const openf1 = {
  sessions: (year: number) => get<OpenF1Session[]>("sessions", { year }),
  session: (sessionKey: number | "latest") =>
    get<OpenF1Session[]>("sessions", { session_key: sessionKey }),
  drivers: (sessionKey: number | "latest") =>
    get<OpenF1Driver[]>("drivers", { session_key: sessionKey }),
  positions: (sessionKey: number | "latest") =>
    get<OpenF1Position[]>("position", { session_key: sessionKey }),
};
