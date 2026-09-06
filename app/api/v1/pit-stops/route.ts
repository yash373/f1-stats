import { NextResponse } from "next/server";
import { getPitStops } from "@/lib/analytics";

export const revalidate = 3600;

// GET /api/v1/pit-stops?season=2026&round=11
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const season = Number(searchParams.get("season") ?? 2026);
  const round = Number(searchParams.get("round") ?? 1);
  try {
    return NextResponse.json(await getPitStops(season, round));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
