import { isDbConfigured, prisma } from "@/lib/db";

export interface TechUpgradeRow {
  id: number;
  season: number;
  roundNo: number;
  teamId: string;
  team: string;
  title: string;
}

export interface ElementRow {
  driverId: string;
  driver: string;
  component: string;
  count: number;
}

export interface IncidentRow {
  id: number;
  season: number;
  roundNo: number;
  driverId: string;
  driver: string;
  cost: number;
  note: string;
}

export async function getTechUpgrades(season: number): Promise<{ available: boolean; rows: TechUpgradeRow[] }> {
  if (!isDbConfigured()) return { available: false, rows: [] };
  try {
    const rows = await prisma.techUpgrade.findMany({
      where: { season },
      include: { team: true },
      orderBy: [{ roundNo: "desc" }, { id: "desc" }],
    });
    return {
      available: true,
      rows: rows.map((r) => ({
        id: r.id,
        season: r.season,
        roundNo: r.roundNo,
        teamId: r.teamId,
        team: r.team.name,
        title: r.title,
      })),
    };
  } catch {
    return { available: false, rows: [] };
  }
}

export async function getPowerUnitElements(season: number): Promise<{ available: boolean; rows: ElementRow[] }> {
  if (!isDbConfigured()) return { available: false, rows: [] };
  try {
    const rows = await prisma.powerUnitElement.findMany({
      where: { season },
      include: { driver: true },
      orderBy: [{ driverId: "asc" }, { component: "asc" }],
    });
    return {
      available: true,
      rows: rows.map((r) => ({
        driverId: r.driverId,
        driver: `${r.driver.firstName} ${r.driver.lastName}`,
        component: r.component,
        count: r.count,
      })),
    };
  } catch {
    return { available: false, rows: [] };
  }
}

export async function getIncidents(season: number): Promise<{ available: boolean; rows: IncidentRow[]; total: number }> {
  if (!isDbConfigured()) return { available: false, rows: [], total: 0 };
  try {
    const rows = await prisma.incident.findMany({
      where: { season },
      include: { driver: true },
      orderBy: { cost: "desc" },
    });
    return {
      available: true,
      rows: rows.map((r) => ({
        id: r.id,
        season: r.season,
        roundNo: r.roundNo,
        driverId: r.driverId,
        driver: `${r.driver.firstName} ${r.driver.lastName}`,
        cost: r.cost,
        note: r.note,
      })),
      total: rows.reduce((sum, r) => sum + r.cost, 0),
    };
  } catch {
    return { available: false, rows: [], total: 0 };
  }
}
