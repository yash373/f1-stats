import Link from "next/link";
import { cached, TTL } from "@/lib/cache";
import { openf1 } from "@/lib/sources/openf1";
import { listRaceSessions } from "@/lib/openf1-mapping";
import { TelemetryTraces } from "@/components/telemetry-traces";
import { TrackMap } from "@/components/track-map";
import { LapChart } from "@/components/lap-chart";

export const revalidate = 3600;
export const metadata = { title: "Telemetry Lab" };

export default async function TelemetryLabPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string; a?: string; b?: string }>;
}) {
  const params = await searchParams;
  let sessions: { session_key: number; location: string; date_start: string }[] = [];
  try {
    sessions = await listRaceSessions(2026);
  } catch {
    sessions = [];
  }
  const sessionKey = Number(params.session ?? sessions[sessions.length - 1]?.session_key ?? "latest");

  let drivers: { driver_number: number; acronym: string; color: string }[] = [];
  if (Number.isFinite(sessionKey)) {
    try {
      const list = await cached(`openf1-drivers-${sessionKey}`, TTL.weekend, () =>
        openf1.drivers(sessionKey),
      );
      drivers = list.map((d) => ({
        driver_number: d.driver_number,
        acronym: d.name_acronym,
        color: d.team_colour ? `#${d.team_colour}` : "#888888",
      }));
    } catch {
      drivers = [];
    }
  }
  const a = Number(params.a ?? drivers[0]?.driver_number ?? 0);
  const b = Number(params.b ?? drivers[1]?.driver_number ?? 0);
  const pick = [a, b].filter((n) => n > 0);
  const pair = drivers.filter((d) => pick.includes(d.driver_number));
  const link = (key: "session" | "a" | "b", value: string | number) => {
    const q = new URLSearchParams({
      session: String(Number.isFinite(sessionKey) ? sessionKey : ""),
      a: String(a),
      b: String(b),
      [key]: String(value),
    });
    return `/telemetry-lab?${q.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Telemetry Lab</h1>
        <p className="text-sm text-zinc-500">
          Speed traces, position history and track replay from OpenF1 car data (2026 races).
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-zinc-500">Session</p>
        <div className="flex flex-wrap gap-1">
          {sessions.map((s) => (
            <Link
              key={s.session_key}
              href={link("session", s.session_key)}
              className={`rounded px-2 py-1 text-xs ${s.session_key === sessionKey ? "bg-red-600 text-white" : "bg-zinc-200 dark:bg-zinc-800"}`}
            >
              {s.location}
            </Link>
          ))}
        </div>
      </div>

      {!Number.isFinite(sessionKey) || drivers.length === 0 ? (
        <p className="text-sm text-zinc-500">No session data available.</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {(["a", "b"] as const).map((key, i) => (
              <div key={key} className="space-y-2">
                <p className="text-sm text-zinc-500">Driver {i + 1}</p>
                <div className="flex flex-wrap gap-1">
                  {drivers.map((d) => (
                    <Link
                      key={d.driver_number}
                      href={link(key, d.driver_number)}
                      className={`rounded px-2 py-1 font-mono text-xs ${d.driver_number === (key === "a" ? a : b) ? "bg-red-600 text-white" : "bg-zinc-200 dark:bg-zinc-800"}`}
                    >
                      {d.acronym}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {pair.length > 0 && (
            <>
              <section className="space-y-2">
                <h2 className="text-lg font-semibold">
                  Speed traces — {pair.map((d) => d.acronym).join(" vs ")}
                </h2>
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <TelemetryTraces sessionKey={sessionKey} drivers={pair} />
                </div>
              </section>
              <section className="space-y-2">
                <h2 className="text-lg font-semibold">Position history</h2>
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <LapChart sessionKey={sessionKey} drivers={drivers} />
                </div>
              </section>
              <section className="space-y-2">
                <h2 className="text-lg font-semibold">Track replay</h2>
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <TrackMap sessionKey={sessionKey} drivers={drivers} />
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
