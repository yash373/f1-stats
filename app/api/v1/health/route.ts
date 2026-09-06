import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "f1-stats",
    time: new Date().toISOString(),
    upstreams: {
      jolpica: process.env.JOLPICA_BASE_URL ?? "https://api.jolpi.ca/ergast/f1",
      openf1: process.env.OPENF1_BASE_URL ?? "https://api.openf1.org/v1",
    },
    db: Boolean(process.env.DATABASE_URL),
  });
}
