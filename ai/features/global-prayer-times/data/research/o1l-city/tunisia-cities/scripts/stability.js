// Between-year stability on the back-harvest: one dip per year, per city.
// Run: TZ=Africa/Tunis node stability.js back
const fs = require("fs");
const L = require("./lib2");
const W = process.env.HOME + "/athan-gitree/census/o1l-city/tunisia-cities";
const tag = process.argv[2] || "back";
const COLS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const FAJR = 18.1, ISHA = 18.1;

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
  return best;
}

function score(days, dip) {
  const out = {};
  for (const c of COLS) out[c] = { n: 0, w1: 0, mae: 0, signed: 0 };
  let all1 = 0;
  for (const d of days) {
    const t = L.times(d.coord, { fajrAngle: FAJR, ishaAngle: ISHA, dip, madhab: "shafi" }, d.date);
    const m = { fajr: L.roundMin(t.fajr, 0, "round"), dhuhr: L.roundMin(t.dhuhr, 7, "round"), asr: L.roundMin(t.asr, 0, "round"), maghrib: L.roundMin(t.maghrib, 2, "ceil"), isha: L.roundMin(t.isha, 0, "round") };
    let ok = true;
    for (const c of COLS) { const r = Math.abs(m[c] - d.printed[c]); out[c].n++; if (r <= 1) out[c].w1++; else ok = false; out[c].mae += r; out[c].signed += m[c] - d.printed[c]; }
    if (ok) all1++;
  }
  for (const c of COLS) { out[c].mae /= out[c].n; out[c].signed /= out[c].n; }
  out.all1Pct = (100 * all1) / days.length;
  return out;
}

const files = fs.readdirSync(`${W}/data`).filter((f) => f.startsWith(`tn-inm-${tag}-`) && f.endsWith(".json"));
const result = [];
for (const f of files) {
  const days = load(`${W}/data/${f}`);
  const years = [...new Set(days.map((d) => d.year))].sort();
  const perYear = years.map((y) => {
    const sub = days.filter((d) => d.year === y);
    const fit = fitDip(sub);
    const s = score(sub, fit.dip);
    return { year: y, n: sub.length, dip: fit.dip, all1Pct: +s.all1Pct.toFixed(1), asrW1: +((100 * s.asr.w1) / s.asr.n).toFixed(1), fajrSigned: +s.fajr.signed.toFixed(2), maghribSigned: +s.maghrib.signed.toFixed(2) };
  });
  const whole = fitDip(days);
  const wholeScore = score(days, whole.dip);
  result.push({ name: days.length ? f : f, n: days.length, first: days[0].date, last: days[days.length - 1].date, dipAll: whole.dip, all1All: +wholeScore.all1Pct.toFixed(1), perYear });
  console.log(`${f}: n=${days.length} ${days[0].date}..${days[days.length - 1].date} dipAll=${whole.dip} all1=${wholeScore.all1Pct.toFixed(1)}`);
  for (const p of perYear) console.log(`   ${p.year} n=${p.n} dip=${p.dip} all1=${p.all1Pct} asrW1=${p.asrW1} fajrSigned=${p.fajrSigned} maghribSigned=${p.maghribSigned}`);
}
fs.writeFileSync(`${W}/data/tn-stability-${tag}.json`, JSON.stringify(result, null, 1));
