// Tajikistan window-class fit: each printed bound modelled as an angle or interval rule.
// Run: TZ=Asia/Dushanbe node scripts/tj-fit.js
const L = require("./lib");
const fs = require("fs");

const W = process.env.HOME + "/athan-gitree/census/o1k-wide/deep2";
const R = require(`${W}/data/tj-window-bounds-24mo.json`);
const LAT = 38.5598, LNG = 68.787, TZNAME = "Asia/Dushanbe";
const c = L.coords(LAT, LNG);

const days = Object.keys(R).sort().filter((d) => {
  const p = R[d];
  return p.fajr && p.sunrise && p.dhuhr && p.asr && p.sunset && p.maghrib && p.isha;
});

// Second-resolution adhan table for the whole span, per angle on the grid.
const GRID = [];
for (let th = 12; th <= 22.0001; th += 0.02) GRID.push(+th.toFixed(2));
const ADH = {};
for (const th of GRID) {
  ADH[th] = {};
  for (const d of days) ADH[th][d] = L.times(c, { fajrAngle: th, ishaAngle: th, madhab: "shafi" }, d);
}
const ADH_HANAFI = {};
for (const d of days) ADH_HANAFI[d] = L.times(c, { fajrAngle: 18, ishaAngle: 18, madhab: "hanafi" }, d);
const ADH_SHAFI = ADH_HANAFI;

const MODES = ["floor", "ceil", "round"];

function fitAngle(targetKey) {
  let best = { score: -1 };
  for (const th of GRID) {
    for (const mode of MODES) {
      for (let pad = -6; pad <= 6; pad++) {
        const pairs = days.map((d) => [R[d][targetKey], L.roundMin(ADH[th][d][targetKey === "fajr" ? "fajr" : "isha"], pad, mode)]);
        const s = L.score(pairs);
        // rank by exact then within-1 then mae
        const rank = s.exact * 1e6 + s.w1 * 1e3 - s.mae;
        if (rank > best.score) best = { score: rank, theta: th, pad, mode, s };
      }
    }
  }
  return best;
}

function fitPadOn(refKey, targetKey, extra) {
  let best = { score: -1 };
  for (const mode of MODES) {
    for (let pad = -8; pad <= 20; pad++) {
      const pairs = days.map((d) => {
        const ref = refKey === "nextFajr" ? nextFajrSec(d) : ADH[18][d][refKey];
        return [R[d][targetKey], L.roundMin(ref, pad + (extra || 0), mode)];
      });
      const s = L.score(pairs);
      const rank = s.exact * 1e6 + s.w1 * 1e3 - s.mae;
      if (rank > best.score) best = { score: rank, pad, mode, s };
    }
  }
  return best;
}

const idx = Object.fromEntries(days.map((d, i) => [d, i]));
function nextDay(d) {
  const [y, m, dd] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, dd + 1)).toISOString().slice(0, 10);
}
function nextFajrSec(d) {
  const n = nextDay(d);
  const p = R[n];
  return p ? p.fajr * 60 : null;
}

const out = { meta: { lat: LAT, lng: LNG, tz: TZNAME, days: days.length, first: days[0], last: days[days.length - 1] }, bounds: {} };

// --- bound: fajr left (angle form)
out.bounds.fajrAngle = fitAngle("fajr");

// --- bound: fajr left (interval form: sunrise - N)
{
  let best = { score: -1 };
  for (let n = 60; n <= 150; n++) {
    const pairs = days.map((d) => [R[d].fajr, R[d].sunrise - n]);
    const s = L.score(pairs);
    const rank = s.exact * 1e6 + s.w1 * 1e3 - s.mae;
    if (rank > best.score) best = { score: rank, interval: n, s };
  }
  out.bounds.fajrInterval = best;
}

// --- bound: sunrise (fajr right)
out.bounds.sunrise = fitPadOn("sunrise", "sunrise");

// --- bound: dhuhr left (wall-clock constant per era)
{
  const vals = {};
  for (const d of days) {
    const k = d.slice(0, 7);
    vals[k] = vals[k] || new Set();
    vals[k].add(R[d].dhuhr);
  }
  out.bounds.dhuhrConstant = Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, [...v]]));
  const boundary = days.filter((d) => R[d].dhuhr === 780).slice(-1)[0];
  const first760 = days.filter((d) => R[d].dhuhr === 760)[0];
  out.bounds.dhuhrEra = { last780: boundary, first760 };
}

// --- bound: asr left (shadow factor)
for (const madhab of ["shafi", "hanafi"]) {
  let best = { score: -1 };
  const tab = {};
  for (const d of days) tab[d] = L.times(c, { fajrAngle: 18, ishaAngle: 18, madhab }, d);
  for (const mode of MODES) {
    for (let pad = -12; pad <= 12; pad++) {
      const pairs = days.map((d) => [R[d].asr, L.roundMin(tab[d].asr, pad, mode)]);
      const s = L.score(pairs);
      const rank = s.exact * 1e6 + s.w1 * 1e3 - s.mae;
      if (rank > best.score) best = { score: rank, pad, mode, s };
    }
  }
  out.bounds[`asr_${madhab}`] = best;
}

// --- bound: sunset bracket (asr right .. maghrib left - 1)
{
  const widths = {};
  for (const d of days) {
    const k = d.slice(0, 7);
    widths[k] = widths[k] || [];
    widths[k].push(R[d].asrEnd - R[d].sunset);
  }
  const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
  out.bounds.sunsetBracket = {
    perMonthMedianWidth: Object.fromEntries(Object.keys(widths).sort().map((k) => [k, med(widths[k])])),
  };
  // center vs adhan sunset
  let best = { score: -1 };
  for (const mode of MODES) {
    for (let pad = -6; pad <= 6; pad++) {
      const pairs = days.map((d) => [(R[d].sunset + R[d].asrEnd) / 2, L.roundMin(ADH[18][d].maghrib, pad, mode)]);
      const s = L.score(pairs);
      const rank = s.exact * 1e6 + s.w1 * 1e3 - s.mae;
      if (rank > best.score) best = { score: rank, pad, mode, s };
    }
  }
  out.bounds.sunsetCenter = best;
}

// --- bound: maghrib left (sunset + N)
out.bounds.maghrib = fitPadOn("maghrib", "maghrib");

// --- bound: isha left, interval form (maghrib + N)
out.bounds.ishaInterval = fitPadOn("isha", "isha");
// --- bound: isha left, angle form
out.bounds.ishaAngle = fitAngle("isha");

// --- bound: isha right vs next-day fajr left
{
  const pairs = days.filter((d) => R[nextDay(d)]).map((d) => [R[d].ishaEnd, R[nextDay(d)].fajr]);
  out.bounds.ishaEndVsNextFajr = L.score(pairs);
}

// --- per-year scores for the chosen global rule of each bound
const perYear = {};
for (const d of days) {
  const y = d.slice(0, 4);
  perYear[y] = perYear[y] || [];
  perYear[y].push(d);
}
function yearTable(name, modelFn) {
  const t = {};
  for (const y of Object.keys(perYear).sort()) {
    const pairs = perYear[y].map((d) => modelFn(d));
    t[y] = L.score(pairs);
  }
  out.bounds[name].perYear = t;
}
yearTable("fajrAngle", (d) => [R[d].fajr, L.roundMin(ADH[out.bounds.fajrAngle.theta][d].fajr, out.bounds.fajrAngle.pad, out.bounds.fajrAngle.mode)]);
yearTable("fajrInterval", (d) => [R[d].fajr, R[d].sunrise - out.bounds.fajrInterval.interval]);
yearTable("sunrise", (d) => [R[d].sunrise, L.roundMin(ADH[18][d].sunrise, out.bounds.sunrise.pad, out.bounds.sunrise.mode)]);
yearTable("asr_hanafi", (d) => [R[d].asr, L.roundMin(L.times(c, { fajrAngle: 18, ishaAngle: 18, madhab: "hanafi" }, d).asr, out.bounds.asr_hanafi.pad, out.bounds.asr_hanafi.mode)]);
yearTable("maghrib", (d) => [R[d].maghrib, L.roundMin(ADH[18][d].maghrib, out.bounds.maghrib.pad, out.bounds.maghrib.mode)]);
yearTable("ishaInterval", (d) => [R[d].isha, R[d].maghrib + out.bounds.ishaInterval.pad]);

// --- between-year stability: implied angle / interval per year
{
  const stab = {};
  for (const y of Object.keys(perYear).sort()) {
    let best = { score: -1 };
    for (const th of GRID) {
      for (const mode of MODES) {
        for (let pad = -6; pad <= 6; pad++) {
          const pairs = perYear[y].map((d) => [R[d].fajr, L.roundMin(ADH[th][d].fajr, pad, mode)]);
          const s = L.score(pairs);
          const rank = s.exact * 1e6 + s.w1 * 1e3 - s.mae;
          if (rank > best.score) best = { score: rank, theta: th, pad, mode };
        }
      }
    }
    const iv = (() => {
      let b = { score: -1 };
      for (let n = 60; n <= 150; n++) {
        const s = L.score(perYear[y].map((d) => [R[d].fajr, R[d].sunrise - n]));
        const rank = s.exact * 1e6 + s.w1 * 1e3 - s.mae;
        if (rank > b.score) b = { score: rank, n };
      }
      return b.n;
    })();
    stab[y] = { theta: best.theta, pad: best.pad, mode: best.mode, interval: iv };
  }
  out.bounds.fajrStability = stab;
}

fs.writeFileSync(`${W}/data/tj-fit.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 4000));
