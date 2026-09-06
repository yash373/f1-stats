import { NextResponse } from "next/server";
import { getDriverStats } from "@/lib/analytics";

export const revalidate = 3600;

// GET /api/v1/driver-stats?season=2026
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const season = Number(searchParams.get("season") ?? 2026);
  try {
    return NextResponse.json(await getDriverStats(season));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
