// Niger BUTIN fit: one recipe across the whole 2025-2031 window.
// Run: TZ=Africa/Niamey node scripts/ne-deep.js
const L = require("./lib");
const E = require("./engine");
const fs = require("fs");

const W = process.env.HOME + "/athan-gitree/census/o1k-wide/deep2";
const C = process.env.HOME + "/athan-gitree/census";
const LAT = 13.85, LNG = 2.1833; // the portal's own literal
const ALT = { lat: 13.5116, lng: 2.1254 }; // the brief's city centre, for the cross-check

const dom = require(`${C}/c34-niger/data/niger_dom_2025_2031.json`);
const niamey = dom.regions.niamey;
const rows = {};
for (const y of Object.keys(niamey)) {
  for (const [m, list] of Object.entries(niamey[y].months)) {
    for (const r of list) {
      const date = `${y}-${String(m).padStart(2, "0")}-${String(r.day).padStart(2, "0")}`;
      const toMin = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
      rows[date] = { fajr: toMin(r.fajr), sunrise: toMin(r.sunrise), dhuhr: toMin(r.dhuhr), asr: toMin(r.asr), maghrib: toMin(r.maghrib), isha: toMin(r.isha) };
    }
  }
}
const days = Object.keys(rows).sort();
const years = [...new Set(days.map((d) => d.slice(0, 4)))];
const c = L.coords(LAT, LNG);
const printed = (k) => (d) => rows[d][k];

const coarse = E.grid(14, 22, 0.05);
const TAB_F = E.angleTable(c, days, coarse, "fajr");
const T18 = {};
for (const d of days) T18[d] = L.times(c, { fajrAngle: 18, ishaAngle: 18, madhab: "shafi" }, d);

const out = { meta: { city: "Niamey", lat: LAT, lng: LNG, briefLat: ALT.lat, briefLng: ALT.lng, tz: "Africa/Niamey", rows: days.length, first: days[0], last: days[days.length - 1], years, source: dom.source, captured: dom.captured }, prayers: {} };

const fajr = E.fitAngle(TAB_F, days, printed("fajr"), [-2, -1, 0, 1, 2]);
out.prayers.fajr = { kind: "angle", theta: fajr.theta, pad: fajr.pad, mode: fajr.mode, score: fajr.s };
const sunrise = E.fitFixed((d) => T18[d].sunrise, days, printed("sunrise"), [-2, -1, 0, 1, 2]);
out.prayers.sunrise = { kind: "sunrise+pad", pad: sunrise.pad, mode: sunrise.mode, score: sunrise.s };
const dhuhr = E.fitFixed((d) => T18[d].dhuhr, days, printed("dhuhr"), [-2, -1, 0, 1, 2]);
out.prayers.dhuhr = { kind: "noon+pad", pad: dhuhr.pad, mode: dhuhr.mode, score: dhuhr.s };
for (const md of ["shafi", "hanafi"]) {
  const T = {};
  for (const d of days) T[d] = L.times(c, { fajrAngle: 18, ishaAngle: 18, madhab: md }, d);
  const r = E.fitFixed((d) => T[d].asr, days, printed("asr"), [-2, -1, 0, 1, 2]);
  out.prayers[`asr_${md}`] = { kind: "shadow", pad: r.pad, mode: r.mode, score: r.s };
}
const maghrib = E.fitFixed((d) => T18[d].maghrib, days, printed("maghrib"), [-2, -1, 0, 1, 2]);
out.prayers.maghrib = { kind: "sunset+pad", pad: maghrib.pad, mode: maghrib.mode, score: maghrib.s };

// isha: interval on the printed maghrib (the declared rule) vs angle form
{
  const diffs = days.map((d) => rows[d].isha - rows[d].maghrib);
  const hist = {};
  for (const x of diffs) hist[x] = (hist[x] || 0) + 1;
  let best = { score: -Infinity };
  for (const mode of E.MODES) for (let n = 60; n <= 90; n++) {
    const s = L.score(days.map((d) => [rows[d].isha, L.roundMin(T18[d].maghrib, n, mode)]));
    const r = s.exact * 1e6 + s.w1 * 1e3 - s.mae;
    if (r > best.score) best = { score: r, pad: n, mode, s };
  }
  out.prayers.ishaInterval = { kind: "sunset+interval", pad: best.pad, mode: best.mode, score: best.s, printedMinusPrintedMaghrib: hist };
}

for (const [name, ref, key] of [
  ["fajr", (d) => TAB_F[fajr.theta][d], "fajr"],
  ["sunrise", (d) => T18[d].sunrise, "sunrise"],
  ["dhuhr", (d) => T18[d].dhuhr, "dhuhr"],
  ["maghrib", (d) => T18[d].maghrib, "maghrib"],
]) {
  const p = out.prayers[name];
  p.perYear = E.perYear(ref, days, printed(key), p.pad, p.mode);
  p.amplitude = E.amplitude(ref, days, printed(key), p.pad, p.mode);
}

// frozen? the same calendar date across the seven served years
{
  const byMD = {};
  for (const d of days) (byMD[d.slice(5)] = byMD[d.slice(5)] || []).push(d);
  let maxSpread = 0, spreadHist = {}, worst = null;
  for (const [md, list] of Object.entries(byMD)) {
    if (list.length < 2) continue;
    for (const k of ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]) {
      const vals = list.map((d) => rows[d][k]);
      const sp = Math.max(...vals) - Math.min(...vals);
      spreadHist[sp] = (spreadHist[sp] || 0) + 1;
      if (sp > maxSpread) { maxSpread = sp; worst = { md, k, vals, list }; }
    }
  }
  out.frozen = { maxSpreadMin: maxSpread, spreadHistogram: spreadHist, worst };
}

// edge years scored on their own
{
  const stab = {};
  for (const y of years) {
    const yd = days.filter((d) => d.startsWith(y));
    const f = E.fitAngle(TAB_F, yd, printed("fajr"), [-2, -1, 0, 1, 2]);
    const mg = E.fitFixed((d) => T18[d].maghrib, yd, printed("maghrib"), [-2, -1, 0, 1, 2]);
    const dh = E.fitFixed((d) => T18[d].dhuhr, yd, printed("dhuhr"), [-2, -1, 0, 1, 2]);
    stab[y] = { fajrTheta: f.theta, fajrPad: f.pad, fajrMode: f.mode, dhuhrPad: dh.pad, dhuhrMode: dh.mode, maghribPad: mg.pad, maghribMode: mg.mode };
  }
  out.stability = stab;
}

// cross-check at the brief's coordinates
{
  const c2 = L.coords(ALT.lat, ALT.lng);
  const t2 = (d) => L.times(c2, { fajrAngle: 18, ishaAngle: 18, madhab: "shafi" }, d);
  let best = { score: -Infinity };
  for (const mode of E.MODES) for (const pad of [-2, -1, 0, 1, 2]) {
    const s = L.score(days.map((d) => [rows[d].fajr, L.roundMin(t2(d).fajr, pad, mode)]));
    const r = s.exact * 1e6 + s.w1 * 1e3 - s.mae;
    if (r > best.score) best = { score: r, pad, mode, s };
  }
  out.briefCoordsFajr = { lat: ALT.lat, lng: ALT.lng, theta: 18, pad: best.pad, mode: best.mode, score: best.s };
}

fs.writeFileSync(`${W}/ne-deep.json`, JSON.stringify(out, null, 1));
console.log("rows", days.length, days[0], days[days.length - 1], "years", years.join(","));
for (const [k, v] of Object.entries(out.prayers)) console.log(k.padEnd(12), `theta ${v.theta ?? "-"} pad ${v.pad} ${v.mode}`.padEnd(34), E.fmt(v.score));
console.log("frozen", JSON.stringify(out.frozen.spreadHistogram), "max spread", out.frozen.maxSpreadMin, JSON.stringify(out.frozen.worst));
console.log("brief coords fajr", E.fmt(out.briefCoordsFajr.score), "pad", out.briefCoordsFajr.pad, out.briefCoordsFajr.mode);
console.log("stability", JSON.stringify(out.stability));
