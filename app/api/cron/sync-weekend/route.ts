import { NextResponse } from "next/server";
import { openf1 } from "@/lib/sources/openf1";

// Lightweight weekend sync probe: verifies OpenF1 session availability.
// Full lap/stint persistence lands in Phase 3; this keeps cron wiring shippable now.
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year") ?? new Date().getUTCFullYear());
  try {
    const sessions = await openf1.sessions(year);
    return NextResponse.json({ ok: true, year, sessions: sessions.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
