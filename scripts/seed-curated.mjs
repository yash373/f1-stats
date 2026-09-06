// Seeds curated tables (TechUpgrade, PowerUnitElement, Incident) from data/curated.json.
// Usage: DATABASE_URL=... node scripts/seed-curated.mjs
// Curated content has no open API — entries are authored via /admin and can be
// exported back to data/curated.json for reproducible deploys.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataset = JSON.parse(readFileSync(join(root, "data", "curated.json"), "utf8"));

const prisma = new PrismaClient();

async function ensureDriver(driverId) {
  await prisma.driver.upsert({
    where: { id: driverId },
    update: {},
    // Placeholder name — replaced by real data on the next sync-history run.
    create: { id: driverId, code: "", firstName: driverId, lastName: "", nationality: "" },
  });
}

async function main() {
  for (const u of dataset.techUpgrades ?? []) {
    await prisma.team.upsert({
      where: { id: u.teamId },
      update: {},
      create: { id: u.teamId, name: u.teamId },
    });
    await prisma.techUpgrade.create({
      data: { season: u.season, roundNo: u.roundNo, teamId: u.teamId, title: u.title },
    });
  }
  for (const e of dataset.powerUnitElements ?? []) {
    await ensureDriver(e.driverId);
    await prisma.powerUnitElement.upsert({
      where: { season_driverId_component: { season: e.season, driverId: e.driverId, component: e.component } },
      update: { count: e.count },
      create: { season: e.season, driverId: e.driverId, component: e.component, count: e.count },
    });
  }
  for (const i of dataset.incidents ?? []) {
    await ensureDriver(i.driverId);
    await prisma.incident.create({
      data: { season: i.season, roundNo: i.roundNo, driverId: i.driverId, cost: i.cost, note: i.note ?? "" },
    });
  }
  console.log(
    `Seeded ${(dataset.techUpgrades ?? []).length} upgrades, ` +
      `${(dataset.powerUnitElements ?? []).length} elements, ` +
      `${(dataset.incidents ?? []).length} incidents.`,
  );
}

await main().finally(() => prisma.$disconnect());
