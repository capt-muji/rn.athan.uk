// Year-pair stability: the same January days in 2024 and 2026, per delegation.
// One dip fitted per year, then the 2024 dip scored on 2026 and the 2026 dip on 2024.
// Run: TZ=Africa/Tunis node yearpair.js
const fs = require("fs");
const L = require("./lib2");
const W = process.env.HOME + "/athan-gitree/census/o1l-city/tunisia-cities";
const COLS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const FAJR = 18.1, ISHA = 18.1;
const FROZEN = {
  pad: { fajr: 0, dhuhr: 7, asr: 0, maghrib: 2, isha: 0 },
  mode: { fajr: "round", dhuhr: "round", asr: "round", maghrib: "ceil", isha: "round" },
};

function load(file) {
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  return Object.keys(j.rows).sort().map((date) => {
    const r = j.rows[date];
    const coord = new L.A.Coordinates(Number(r.lat), Number(r.lng));
    return { date, year: date.slice(0, 4), coord, ...L.mkDay(coord, date), printed: { fajr: L.toMin(r.fajr), dhuhr: L.toMin(r.dhuhr), asr: L.toMin(r.asr), maghrib: L.toMin(r.maghrib), isha: L.toMin(r.isha) } };
  });
}

function cost(days, dip) {
  let c = 0;
  for (const d of days) {
    const t = L.times(d.coord, { fajrAngle: FAJR, ishaAngle: ISHA, dip, madhab: "shafi" }, d.date);
    c += Math.abs(L.roundMin(t.fajr, 0, "round") - d.printed.fajr);
    c += Math.abs(L.roundMin(t.maghrib, 2, "ceil") - d.printed.maghrib);
    c += Math.abs(L.roundMin(t.isha, 0, "round") - d.printed.isha);
  }
  return c / days.length;
}

function fitDip(days) {
  let best = { dip: 0, c: Infinity };
  for (let i = 0; i <= 200; i++) { const dip = i * 0.01, c = cost(days, dip); if (c < best.c - 1e-9) best = { dip, c }; }
  return best.dip;
}

function all1(days, dip) {
  let ok = 0;
  for (const d of days) {
    const t = L.times(d.coord, { fajrAngle: FAJR, ishaAngle: ISHA, dip, madhab: "shafi" }, d.date);
    const m = {
      fajr: L.roundMin(t.fajr, FROZEN.pad.fajr, FROZEN.mode.fajr),
      dhuhr: L.roundMin(t.dhuhr, FROZEN.pad.dhuhr, FROZEN.mode.dhuhr),
      asr: L.roundMin(t.asr, FROZEN.pad.asr, FROZEN.mode.asr),
      maghrib: L.roundMin(t.maghrib, FROZEN.pad.maghrib, FROZEN.mode.maghrib),
      isha: L.roundMin(t.isha, FROZEN.pad.isha, FROZEN.mode.isha),
    };
    if (COLS.every((c) => Math.abs(m[c] - d.printed[c]) <= 1)) ok++;
  }
  return (100 * ok) / days.length;
}

const files = fs.readdirSync(`${W}/data`).filter((f) => f.startsWith("tn-inm-yp-") && f.endsWith(".json"));
const out = [];
for (const f of files) {
  const days = load(`${W}/data/${f}`);
  const d24 = days.filter((d) => d.year === "2024");
  const d26 = days.filter((d) => d.year === "2026");
  if (!d24.length || !d26.length) continue;
  const dip24 = fitDip(d24), dip26 = fitDip(d26), dipAll = fitDip(days);
  out.push({
    file: f, name: days[0].coord ? f.replace("tn-inm-yp-", "").replace(".json", "") : f,
    n: days.length, dip24, dip26, dipAll, delta: +(dip26 - dip24).toFixed(3),
    all1_24_at24: all1(d24, dip24), all1_26_at24: all1(d26, dip24),
    all1_26_at26: all1(d26, dip26), all1_24_at26: all1(d24, dip26),
    all1_24_atAll: all1(d24, dipAll), all1_26_atAll: all1(d26, dipAll),
  });
}
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const abs = out.map((o) => Math.abs(o.delta)).sort((a, b) => a - b);
const summary = {
  delegations: out.length,
  meanDip24: +mean(out.map((o) => o.dip24)).toFixed(3),
  meanDip26: +mean(out.map((o) => o.dip26)).toFixed(3),
  meanAbsDelta: +mean(abs).toFixed(3),
  medianAbsDelta: abs[Math.floor(abs.length / 2)],
  maxAbsDelta: abs[abs.length - 1],
  within005: abs.filter((d) => d <= 0.05).length,
  within010: abs.filter((d) => d <= 0.1).length,
  crossYear: {
    mean26at24: +mean(out.map((o) => o.all1_26_at24)).toFixed(1),
    mean26at26: +mean(out.map((o) => o.all1_26_at26)).toFixed(1),
    mean24at26: +mean(out.map((o) => o.all1_24_at26)).toFixed(1),
    mean24at24: +mean(out.map((o) => o.all1_24_at24)).toFixed(1),
    mean24atAll: +mean(out.map((o) => o.all1_24_atAll)).toFixed(1),
    mean26atAll: +mean(out.map((o) => o.all1_26_atAll)).toFixed(1),
  },
};
fs.writeFileSync(`${W}/data/tn-yearpair.json`, JSON.stringify({ summary, rows: out }, null, 1));
console.log(JSON.stringify(summary, null, 1));
