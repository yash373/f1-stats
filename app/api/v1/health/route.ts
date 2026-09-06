import { NextResponse } from "next/server";
import { fetchJson } from "@/lib/http";

export const maxDuration = 60;

async function check(name: string, url: string, headers?: Record<string, string>) {
  const start = Date.now();
  try {
    await fetchJson<unknown>(url, { headers, timeoutMs: 15000 });
    return { name, ok: true, latencyMs: Date.now() - start };
  } catch (e) {
    return { name, ok: false, latencyMs: Date.now() - start, error: (e as Error).message };
  }
}

export async function GET() {
  const jolpicaBase = process.env.JOLPICA_BASE_URL ?? "https://api.jolpi.ca/ergast/f1";
  const openf1Base = process.env.OPENF1_BASE_URL ?? "https://api.openf1.org/v1";
  const [jolpica, openf1] = await Promise.all([
    check("jolpica", `${jolpicaBase}/2026/driverstandings/?limit=1`, {
      "User-Agent": "f1-stats/0.1.0 (health)",
      Accept: "application/json",
    }),
    check("openf1", `${openf1Base}/sessions?year=2026`, { Accept: "application/json" }),
  ]);
  return NextResponse.json({
    ok: jolpica.ok && openf1.ok,
    service: "f1-stats",
    time: new Date().toISOString(),
    upstreams: { jolpica: jolpicaBase, openf1: openf1Base },
    db: Boolean(process.env.DATABASE_URL),
    redis: Boolean(process.env.UPSTASH_REDIS_REST_URL),
    checks: [jolpica, openf1],
  });
}
