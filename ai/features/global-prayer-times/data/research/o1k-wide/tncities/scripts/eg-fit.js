// Egypt frozen recipe 19.5/17.5, zero margins, at each new city. Run: TZ=Africa/Cairo node eg-fit.js
const L = require("./lib");
const E = require("./engine");
const fs = require("fs");

const W = process.env.HOME + "/athan-gitree/census/o1k-wide/tncities";
const CITIES = {
  portsaid: { lat: 31.2653, lng: 32.3019, label: "Port Said", file: "eg-esa-portsaid-2026.json" },
  luxor: { lat: 25.6872, lng: 32.6396, label: "Luxor", file: "eg-esa-luxor-2026.json" },
  assiut: { lat: 27.1809, lng: 31.1837, label: "Assiut", file: "eg-esa-assiut-2026.json" },
  cairo: { lat: 30.0444, lng: 31.2357, label: "Cairo (control, November)", file: "eg-esa-cairo-2026-11.json" },
};

const COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
const toMin = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
const out = {};

for (const [key, cfg] of Object.entries(CITIES)) {
  const src = require(`${W}/data/${cfg.file}`);
  const days = Object.keys(src).sort();
  const rows = Object.fromEntries(days.map((d) => [d, {
    fajr: toMin(src[d].fajr), sunrise: toMin(src[d].sunrise), dhuhr: toMin(src[d].dhuhr),
    asr: toMin(src[d].asr), maghrib: toMin(src[d].magrib), isha: toMin(src[d].isha),
  }]));
  const c = L.coords(cfg.lat, cfg.lng);
  const frozen = { fajrAngle: 19.5, ishaAngle: 17.5, madhab: "shafi" };
  const hanafi = { fajrAngle: 19.5, ishaAngle: 17.5, madhab: "hanafi" };
  const model = {}, modelH = {};
  for (const d of days) {
    const t = L.times(c, frozen, d);
    const h = L.times(c, hanafi, d);
    model[d] = Object.fromEntries(COLS.map((k) => [k, L.roundMin(t[k], 0, "round")]));
    modelH[d] = L.roundMin(h.asr, 0, "round");
  }

  const score = (k, ref) => L.score(days.map((d) => [rows[d][k], ref(d)]));
  const columns = {
    fajr: score("fajr", (d) => model[d].fajr),
    sunrise: score("sunrise", (d) => model[d].sunrise),
    dhuhr: score("dhuhr", (d) => model[d].dhuhr),
    asr_shafi: score("asr", (d) => model[d].asr),
    asr_hanafi: score("asr", (d) => modelH[d]),
    maghrib: score("maghrib", (d) => model[d].maghrib),
    isha: score("isha", (d) => model[d].isha),
  };
  const within = (ks) => days.filter((d) => ks.every((k) => Math.abs(model[d][k] - rows[d][k]) <= 1)).length;
  const exact = (ks) => days.filter((d) => ks.every((k) => model[d][k] === rows[d][k])).length;
  const SIX = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

  const perMonth = {};
  for (const d of days) {
    const m = (perMonth[d.slice(0, 7)] = perMonth[d.slice(0, 7)] || { n: 0, allW1: 0, worst: 0 });
    m.n++;
    const dev = Math.max(...SIX.map((k) => Math.abs(model[d][k] - rows[d][k])));
    if (dev <= 1) m.allW1++;
    if (dev > m.worst) m.worst = dev;
  }

  const bestPad = {};
  for (const k of SIX) bestPad[k] = E.fitFixed((d) => L.times(c, frozen, d)[k], days, (d) => rows[d][k], [-2, -1, 0, 1, 2], ["round"]);
  bestPad.asr_implied_theta_check = undefined;
  delete bestPad.asr_implied_theta_check;

  out[key] = {
    meta: { ...cfg, tz: "Africa/Cairo", rows: days.length, first: days[0], last: days[days.length - 1] },
    columns,
    allSixWithin1: within(SIX), allFiveNoAsrWithin1: within(["fajr", "sunrise", "dhuhr", "maghrib", "isha"]),
    allSixExact: exact(SIX), n: days.length,
    perMonth,
    bestPad: Object.fromEntries(Object.entries(bestPad).map(([k, v]) => [k, { pad: v.pad, exact: v.s.exact, w1: v.s.w1, mae: +v.s.mae.toFixed(2) }])),
  };

  console.log(`${cfg.label}: n ${days.length} ${days[0]}..${days[days.length - 1]}`);
  for (const [k, s] of Object.entries(columns)) console.log("  ", k.padEnd(11), E.fmt(s));
  console.log(`   all six within1 ${within(SIX)}/${days.length}, exact ${exact(SIX)}/${days.length}; all five (no asr) within1 ${within(["fajr", "sunrise", "dhuhr", "maghrib", "isha"])}/${days.length}`);
  console.log(`   best pads ${Object.entries(out[key].bestPad).map(([k, v]) => `${k}${v.pad}`).join(" ")}`);
  console.log(`   months ${Object.entries(perMonth).map(([m, v]) => `${m.slice(5)}:${v.allW1}/${v.n}`).join(" ")}`);
}

fs.writeFileSync(`${W}/eg-deep.json`, JSON.stringify(out, null, 1));
