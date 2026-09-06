import { NextResponse } from "next/server";
import { getHeadToHead } from "@/lib/analytics";

export const revalidate = 3600;

// GET /api/v1/head-to-head?season=2026&d1=antonelli&d2=russell
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const season = Number(searchParams.get("season") ?? 2026);
  const d1 = searchParams.get("d1") ?? "";
  const d2 = searchParams.get("d2") ?? "";
  if (!d1 || !d2) {
    return NextResponse.json({ error: "d1 and d2 driver ids required" }, { status: 400 });
  }
  try {
    return NextResponse.json(await getHeadToHead(season, d1, d2));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
