"use server";

import { revalidatePath } from "next/cache";
import { isDbConfigured, prisma } from "@/lib/db";

function checkSecret(formData: FormData) {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) throw new Error("ADMIN_SECRET is not configured — admin is disabled.");
  if (formData.get("secret") !== expected) throw new Error("Wrong admin secret.");
  if (!isDbConfigured()) throw new Error("DATABASE_URL is not configured.");
}

function num(value: FormDataEntryValue | null, name: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`Invalid ${name}.`);
  return n;
}

function str(value: FormDataEntryValue | null, name: string) {
  const s = String(value ?? "").trim();
  if (!s) throw new Error(`Missing ${name}.`);
  return s;
}

export async function addTechUpgrade(formData: FormData) {
  checkSecret(formData);
  await prisma.techUpgrade.create({
    data: {
      season: num(formData.get("season"), "season"),
      roundNo: num(formData.get("roundNo"), "round"),
      teamId: str(formData.get("teamId"), "team id"),
      title: str(formData.get("title"), "title"),
    },
  });
  revalidatePath("/tech-updates");
}

export async function setPowerUnitElement(formData: FormData) {
  checkSecret(formData);
  const season = num(formData.get("season"), "season");
  const driverId = str(formData.get("driverId"), "driver id");
  const component = str(formData.get("component"), "component");
  await prisma.powerUnitElement.upsert({
    where: { season_driverId_component: { season, driverId, component } },
    update: { count: num(formData.get("count"), "count") },
    create: { season, driverId, component, count: num(formData.get("count"), "count") },
  });
  revalidatePath("/used-elements");
}

export async function addIncident(formData: FormData) {
  checkSecret(formData);
  await prisma.incident.create({
    data: {
      season: num(formData.get("season"), "season"),
      roundNo: num(formData.get("roundNo"), "round"),
      driverId: str(formData.get("driverId"), "driver id"),
      cost: num(formData.get("cost"), "cost"),
      note: String(formData.get("note") ?? ""),
    },
  });
  revalidatePath("/destructors-championship");
}
