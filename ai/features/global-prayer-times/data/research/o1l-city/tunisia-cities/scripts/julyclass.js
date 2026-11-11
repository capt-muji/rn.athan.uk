// July-only fajr/isha angle per delegation, at the delegation's DEM dip.
// The July 2026 rows of the Sidi Bouzid and Kairouan groups reproduce at a lower angle
// than the other three seasons; this measures how wide that class is.
// Run: TZ=Africa/Tunis node julyclass.js
const fs = require("fs");
const L = require("./lib2");
const W = process.env.HOME + "/athan-gitree/census/o1l-city/tunisia-cities";
const fits = JSON.parse(fs.readFileSync(`${W}/data/tn-fits-sw.json`, "utf8"));
const out = [];

function load(f) {
  const j = JSON.parse(fs.readFileSync(f, "utf8"));
  return Object.keys(j.rows).sort().map((date) => {
    const r = j.rows[date];
    const coord = new L.A.Coordinates(Number(r.lat), Number(r.lng));
    return { date, coord, ...L.mkDay(coord, date), printed: { fajr: L.toMin(r.fajr), isha: L.toMin(r.isha) } };
  });
}

function hit(days, dip, fa, ia) {
  let n = 0;
  for (const d of days) {
    const t = L.times(d.coord, { fajrAngle: fa, ishaAngle: ia, dip, madhab: "shafi" }, d.date);
    if (Math.abs(L.roundMin(t.fajr, 0, "round") - d.printed.fajr) <= 1 &&
        Math.abs(L.roundMin(t.isha, 0, "round") - d.printed.isha) <= 1) n++;
  }
  return n;
}

for (const fit of fits) {
  const file = `${W}/data/tn-inm-sw-${fit.gouv}-${fit.deleg}.json`;
  const days = load(file).filter((d) => d.date.startsWith("2026-07"));
  if (!days.length) continue;
  const dip = fit.dipDemDeg;
  let best = { hits: -1, fa: null, ia: null };
  for (let fa = 16; fa <= 19.2; fa += 0.1) {
    for (let ia = 16; ia <= 19.2; ia += 0.1) {
      const hits = hit(days, dip, fa, ia);
      if (hits > best.hits) best = { hits, fa: +fa.toFixed(1), ia: +ia.toFixed(1) };
    }
  }
  out.push({ name: fit.name, gouv: fit.gouv, deleg: fit.deleg, julyDays: days.length, hits: best.hits, fa: best.fa, ia: best.ia, at18: hit(days, dip, 18.1, 18.1) });
}

const lower = out.filter((o) => o.fa !== null && o.fa < 17.8 && o.hits === o.julyDays);
const at18 = out.filter((o) => o.at18 === o.julyDays);
const mixed = out.filter((o) => o.hits < o.julyDays);
const summary = {
  delegations: out.length,
  julyReproducesAt18_1: at18.length,
  julyNeedsLowerAngle: lower.length,
  julyUnreproduced: mixed.length,
  lowerAngles: lower.map((o) => `${o.name} ${o.fa}/${o.ia}`),
  lowerGouv: [...new Set(lower.map((o) => o.gouv))],
};
fs.writeFileSync(`${W}/data/tn-july-class.json`, JSON.stringify({ summary, rows: out }, null, 1));
console.log(JSON.stringify(summary, null, 1));
