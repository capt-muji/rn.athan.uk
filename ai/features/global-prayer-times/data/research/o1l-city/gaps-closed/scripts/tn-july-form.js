// The Tunisia July class, from the banked season rows only.
// Question: is the July fajr/isha residual a month-fixed angle, a dated window, or a
// constant-minute display override?
// Run: TZ=Africa/Tunis node tn-july-form.js
const fs = require("fs");
const L = require(process.env.HOME + "/athan-gitree/census/o1l-city/tunisia-cities/scripts/lib2");
const W = process.env.HOME + "/athan-gitree/census/o1l-city/tunisia-cities";
const O = process.env.HOME + "/athan-gitree/census/o1l-city/gaps-closed";
const fits = JSON.parse(fs.readFileSync(`${W}/data/tn-fits-sw.json`, "utf8"));
const CLASS_GOUV = new Set([355, 357]);

function load(f) {
  const j = JSON.parse(fs.readFileSync(f, "utf8"));
  return Object.keys(j.rows).sort().map((date) => {
    const r = j.rows[date];
    return { date, lat: Number(r.lat), lng: Number(r.lng), fajr: L.toMin(r.fajr), isha: L.toMin(r.isha) };
  });
}

const rows = [];
for (const fit of fits) {
  if (!CLASS_GOUV.has(fit.gouv)) continue;
  const file = `${W}/data/tn-inm-sw-${fit.gouv}-${fit.deleg}.json`;
  if (!fs.existsSync(file)) continue;
  const days = load(file);
  for (const d of days) {
    const coord = new L.A.Coordinates(d.lat, d.lng);
    const t = L.times(coord, { fajrAngle: 18.1, ishaAngle: 18.1, dip: fit.dipDemDeg, madhab: "shafi" }, d.date);
    rows.push({
      name: fit.name, gouv: fit.gouv, deleg: fit.deleg, date: d.date, month: d.date.slice(5, 7),
      lat: d.lat, lng: d.lng, dip: fit.dipDemDeg,
      rf: d.fajr - t.fajr / 60, ri: d.isha - t.isha / 60, printedF: d.fajr, printedI: d.isha,
    });
  }
}

// Residual by month, at the national 18.1/18.1 recipe: is the class July-only?
const byMonth = {};
for (const r of rows) {
  byMonth[r.month] = byMonth[r.month] || { n: 0, f: [], i: [] };
  byMonth[r.month].n++;
  byMonth[r.month].f.push(r.rf);
  byMonth[r.month].i.push(r.ri);
}
const stat = (a) => ({ n: a.length, mean: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2), min: +Math.min(...a).toFixed(2), max: +Math.max(...a).toFixed(2) });
const monthTable = Object.keys(byMonth).sort().map((m) => ({ month: m, n: byMonth[m].n, fajrResid: stat(byMonth[m].f), ishaResid: stat(byMonth[m].i) }));

// July rows only: the residual in minutes must be near-constant if the publisher subtracts
// minutes, and drift with the twilight rate if the publisher switches angle.
const july = rows.filter((r) => r.month === "07");
const perDeleg = {};
for (const r of july) {
  (perDeleg[r.name] = perDeleg[r.name] || []).push(r);
}
const residSpread = Object.keys(perDeleg).map((name) => {
  const f = perDeleg[name].map((r) => r.rf);
  const i = perDeleg[name].map((r) => r.ri);
  return { name, n: f.length, fajrMin: +Math.min(...f).toFixed(2), fajrMax: +Math.max(...f).toFixed(2), ishaMin: +Math.min(...i).toFixed(2), ishaMax: +Math.max(...i).toFixed(2) };
});

// One angle for the whole class in July: sweep jointly.
function score(fa, ia) {
  let f = 0, i = 0, both = 0;
  for (const r of july) {
    const coord = new L.A.Coordinates(r.lat, r.lng);
    const t = L.times(coord, { fajrAngle: fa, ishaAngle: ia, dip: r.dip, madhab: "shafi" }, r.date);
    const pf = Math.abs(L.roundMin(t.fajr, 0, "round") - r.printedF) <= 1;
    const pi = Math.abs(L.roundMin(t.isha, 0, "round") - r.printedI) <= 1;
    if (pf) f++;
    if (pi) i++;
    if (pf && pi) both++;
  }
  return { f, i, both, n: july.length };
}
let best = { both: -1 };
const hits = [];
for (let fa = 16.6; fa <= 18.2; fa += 0.05) {
  for (let ia = 16.6; ia <= 18.2; ia += 0.05) {
    const s = score(fa, ia);
    hits.push({ fa: +fa.toFixed(2), ia: +ia.toFixed(2), ...s });
    if (s.both > best.both) best = { fa: +fa.toFixed(2), ia: +ia.toFixed(2), ...s };
  }
}
// Ridge: every (fa,ia) that scores the maximum.
const ridge = hits.filter((h) => h.both === best.both);
const ridgeFa = [Math.min(...ridge.map((h) => h.fa)), Math.max(...ridge.map((h) => h.fa))];
const ridgeIa = [Math.min(...ridge.map((h) => h.ia)), Math.max(...ridge.map((h) => h.ia))];
const at181 = score(18.1, 18.1);

// The published 18.1 recipe on the same rows, scored per delegation, for the before/after line.
const out = {
  job: "O1l-25 Tunisia July form",
  bankedRows: { delegations: Object.keys(perDeleg).length, julyRows: july.length, allRows: rows.length },
  monthTable,
  julyResidualSpread: residSpread,
  julyClassAngle: { best, ridgeFa, ridgeIa, ridgeSize: ridge.length, at18_1: at181 },
};
fs.writeFileSync(`${O}/data/tn-july-form.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out.monthTable, null, 1));
console.log(JSON.stringify(out.julyClassAngle, null, 1));
console.log(JSON.stringify(residSpread.slice(0, 4), null, 1));
