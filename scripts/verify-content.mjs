// Content verification: asserts pages/APIs render REAL data, not just HTTP 200.
// Usage: node scripts/verify-content.mjs [baseUrl]
// Exit 0 = all pass, 1 = any failure. Designed for CI and pre-deploy checks.

const base = process.argv[2] ?? "http://localhost:3000";

let failures = 0;

async function get(path) {
  const res = await fetch(base + path);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* HTML page */
  }
  return { status: res.status, text, json };
}

function check(name, cond, detail = "") {
  if (cond) {
    console.log(`PASS ${name}`);
  } else {
    failures += 1;
    console.log(`FAIL ${name} ${detail}`);
  }
}

async function page(path, name, markers) {
  const r = await get(path);
  check(`${name} status`, r.status === 200, `got ${r.status}`);
  for (const m of markers) {
    check(`${name} contains "${m}"`, r.text.includes(m));
  }
  if (r.text.includes("Upstream unavailable") || r.text.includes("Upstream error")) {
    check(`${name} no upstream error shown`, false, "error banner present");
  }
}

async function api(path, name, validate) {
  const r = await get(path);
  check(`${name} status`, r.status === 200, `got ${r.status}`);
  if (r.status === 200 && r.json) {
    try {
      validate(r.json);
    } catch (e) {
      check(`${name} payload`, false, e.message);
    }
  } else if (r.status === 200) {
    check(`${name} payload`, false, "not JSON");
  }
}

const nonEmpty = (arr, what) => {
  if (!Array.isArray(arr) || arr.length === 0) throw new Error(`${what} is empty`);
};

// ---- Pages ----
await page("/", "home", ["Antonelli", "242", "Season completed", "Mercedes"]);
await page("/schedule", "schedule", ["Australian Grand Prix", "Monza"]);
await page("/results", "results index", ["Australian Grand Prix"]);
await page("/results/5", "round page", ["Canadian Grand Prix", "RUS"]);
await page("/driver-standings", "driver standings", ["Antonelli", "242"]);
await page("/constructor-standings", "constructor standings", ["Mercedes", "425"]);
await page("/drivers", "drivers", ["ANT", "RUS"]);
await page("/drivers/antonelli", "driver profile", ["Podiums", "Australian Grand Prix"]);
await page("/teams", "teams", ["Mercedes", "425"]);
await page("/teams/mercedes", "team profile", ["Russell", "Antonelli"]);
await page("/driver-stats", "driver stats", ["Pod", "Antonelli"]);
await page("/head-to-head?d1=antonelli&d2=russell", "head-to-head", ["Qualifying", "Antonelli", "Russell"]);
await page("/consistency", "consistency", ["Australian Grand Prix", "ANT"]);
await page("/race-pace", "race pace", ["Median"]);
await page("/pit-stops", "pit stops", ["Team averages"]);
await page("/track-dna", "track DNA", ["Winner"]);
await page("/telemetry-lab", "telemetry lab", ["Telemetry Lab", "Session"]);
await page("/live-timing", "live timing", ["Live Timing", "Gap"]);
await page("/tech-updates", "tech updates (pending db)", ["Pending database"]);
await page("/used-elements", "used elements (pending db)", ["Pending database"]);
await page("/destructors-championship", "destructors (pending db)", ["Pending database"]);
await page("/admin", "admin (pending db)", ["pending database"]);

// ---- APIs ----
await api("/api/v1/health", "health", (j) => {
  if (!j.checks?.every((c) => c.ok)) throw new Error("upstream check failed");
});
await api("/api/v1/schedule?season=2026", "schedule api", (j) => nonEmpty(j.races, "races"));
await api("/api/v1/standings?season=2026", "standings api", (j) => nonEmpty(j.standings, "standings"));
await api("/api/v1/results?season=2026&round=5", "results api", (j) => {
  nonEmpty(j.results, "results");
  if (!j.results[0].driver) throw new Error("missing driver");
});
await api("/api/v1/results?season=2026&round=5&session=quali", "quali api", (j) =>
  nonEmpty(j.results, "quali"),
);
await api("/api/v1/driver-stats?season=2026", "driver-stats api", (j) =>
  nonEmpty(j.drivers, "drivers"),
);
await api("/api/v1/head-to-head?season=2026&d1=antonelli&d2=russell", "h2h api", (j) => {
  if (!j.rounds?.length) throw new Error("rounds empty");
});
await api("/api/v1/pit-stops?season=2026&round=12", "pit-stops api", (j) => {
  nonEmpty(j.stops, "stops");
  if (!Number.isFinite(j.fastest?.duration)) throw new Error("fastest duration invalid");
});
await api("/api/v1/live?year=2026", "live sessions api", (j) => nonEmpty(j.sessions, "sessions"));
await api("/api/v1/live?resource=positions&session_key=latest", "live positions api", (j) =>
  nonEmpty(j.positions, "positions"),
);
await api("/api/v1/telemetry?session_key=11357&driver_number=16", "telemetry api", (j) =>
  nonEmpty(j.points, "points"),
);
await api("/api/v1/lapchart?session_key=11357", "lapchart api", (j) =>
  nonEmpty(j.points, "points"),
);
await api("/api/v1/track?session_key=11357", "track api", (j) => nonEmpty(j.drivers, "drivers"));

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
