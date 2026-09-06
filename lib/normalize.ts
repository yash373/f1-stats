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
}

export function toStandingRows(
  list:
    | { position: string; points: string; wins: string; Driver: { code?: string; givenName: string; familyName: string }; Constructors: { name: string }[] }[]
    | undefined,
): StandingRow[] {
  return (list ?? []).map((s) => ({
    position: Number(s.position),
    points: Number(s.points),
    wins: Number(s.wins),
    name: `${s.Driver.givenName} ${s.Driver.familyName}`,
    code: s.Driver.code ?? "",
    team: s.Constructors[0]?.name ?? "",
  }));
}

export function toConstructorRows(
  list:
    | { position: string; points: string; wins: string; Constructor: { name: string } }[]
    | undefined,
): StandingRow[] {
  return (list ?? []).map((s) => ({
    position: Number(s.position),
    points: Number(s.points),
    wins: Number(s.wins),
    name: s.Constructor.name,
  }));
}
