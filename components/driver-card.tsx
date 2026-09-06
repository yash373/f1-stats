import Link from "next/link";
import { teamColor } from "@/lib/team-colors";

export function DriverCard({
  id,
  code,
  name,
  team,
  teamId,
  points,
  position,
}: {
  id: string;
  code: string;
  name: string;
  team: string;
  teamId: string;
  points?: number;
  position?: number;
}) {
  return (
    <Link
      href={`/drivers/${id}`}
      className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-red-600/50"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-bold">{code}</span>
        {position !== undefined && (
          <span className="text-xs text-zinc-500">P{position}</span>
        )}
      </div>
      <p className="mt-1 font-semibold">{name}</p>
      <p className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: teamColor(teamId) }}
        />
        {team}
      </p>
      {points !== undefined && (
        <p className="mt-2 text-lg font-bold">{points} pts</p>
      )}
    </Link>
  );
}

export function TeamBadge({ id, name }: { id: string; name: string }) {
  return (
    <Link href={`/teams/${id}`} className="inline-flex items-center gap-2 hover:underline">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: teamColor(id) }}
      />
      {name}
    </Link>
  );
}
