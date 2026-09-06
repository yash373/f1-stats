import { isDbConfigured } from "@/lib/db";
import { addIncident, addTechUpgrade, setPowerUnitElement } from "./actions";

export const revalidate = 0;

const input =
  "rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm";

export default function AdminPage() {
  const dbReady = isDbConfigured();
  const adminEnabled = Boolean(process.env.ADMIN_SECRET);

  if (!adminEnabled || !dbReady) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-sm text-amber-600">
          Admin is pending database setup
          {!adminEnabled && " (ADMIN_SECRET not set)"}
          {!dbReady && " (DATABASE_URL not set)"}. Set both env vars and redeploy to enable curated entry.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin — curated entry</h1>
        <p className="text-sm text-zinc-500">
          Tech upgrades, PU elements and incidents have no open API — entries here power the
          curated pages. Every form needs the admin secret.
        </p>
      </div>

      <form action={addTechUpgrade} className="space-y-2 rounded-xl border border-zinc-200 p-4">
        <h2 className="font-semibold">Tech upgrade</h2>
        <div className="grid grid-cols-2 gap-2">
          <input name="secret" type="password" placeholder="Admin secret" className={input} required />
          <input name="season" placeholder="Season (2026)" className={input} required />
          <input name="roundNo" placeholder="Round" className={input} required />
          <input name="teamId" placeholder="Team id (mercedes)" className={input} required />
          <input name="title" placeholder="Title" className={`${input} col-span-2`} required />
        </div>
        <button className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white">Add upgrade</button>
      </form>

      <form action={setPowerUnitElement} className="space-y-2 rounded-xl border border-zinc-200 p-4">
        <h2 className="font-semibold">Power-unit element (upsert)</h2>
        <div className="grid grid-cols-2 gap-2">
          <input name="secret" type="password" placeholder="Admin secret" className={input} required />
          <input name="season" placeholder="Season (2026)" className={input} required />
          <input name="driverId" placeholder="Driver id (antonelli)" className={input} required />
          <input name="component" placeholder="Component (ICE/TC/MGU-K/ES/CE/EX)" className={input} required />
          <input name="count" placeholder="Count" className={`${input} col-span-2`} required />
        </div>
        <button className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white">Set element</button>
      </form>

      <form action={addIncident} className="space-y-2 rounded-xl border border-zinc-200 p-4">
        <h2 className="font-semibold">Incident (destructors)</h2>
        <div className="grid grid-cols-2 gap-2">
          <input name="secret" type="password" placeholder="Admin secret" className={input} required />
          <input name="season" placeholder="Season (2026)" className={input} required />
          <input name="roundNo" placeholder="Round" className={input} required />
          <input name="driverId" placeholder="Driver id (antonelli)" className={input} required />
          <input name="cost" placeholder="Cost USD" className={input} required />
          <input name="note" placeholder="Note" className={`${input} col-span-2`} />
        </div>
        <button className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white">Add incident</button>
      </form>
    </div>
  );
}
