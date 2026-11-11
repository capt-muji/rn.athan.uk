// Tajikistan window-class fit across the 24-month Jan/Jul spread (2015-2026).
// Run: TZ=Asia/Dushanbe node scripts/tj-deep.js
const L = require("./lib");
const E = require("./engine");
const fs = require("fs");

const W = process.env.HOME + "/athan-gitree/census/o1k-wide/deep2";
const LAT = 38.5598, LNG = 68.787, TZNAME = "Asia/Dushanbe";
const R = require(`${W}/data/tj-window-bounds-24mo.json`);
const INV = require(`${W}/data/tj-inversion.json`);

const days = Object.keys(R).sort().filter((d) => R[d].sunsetEnd && R[d].fajr && R[d].asr && R[d].isha);
const years = [...new Set(days.map((d) => d.slice(0, 4)))];
const c = L.coords(LAT, LNG);
const printed = (k) => (d) => R[d][k];

const coarse = E.grid(14, 22, 0.05);
const TAB_F = E.angleTable(c, days, coarse, "fajr");
const TAB_I = E.angleTable(c, days, coarse, "isha");
const T18 = {};
const T18S = {};
for (const d of days) {
  T18[d] = L.times(c, { fajrAngle: 18, ishaAngle: 18, madhab: "hanafi" }, d);
  T18S[d] = L.times(c, { fajrAngle: 18, ishaAngle: 18, madhab: "shafi" }, d);
}

const out = {
  meta: { city: "Dushanbe", lat: LAT, lng: LNG, tz: TZNAME, rows: days.length, first: days[0], last: days[days.length - 1], years, months: "every January and July, 2015-2026" },
  bounds: {},
};

// 1. fajr left bound, angle form
const fajr = E.fitAngle(TAB_F, days, printed("fajr"), [-4, -3, -2, -1, 0, 1, 2, 3, 4]);
out.bounds.fajrAngle = { rule: "angle", theta: fajr.theta, pad: fajr.pad, mode: fajr.mode, score: fajr.s };

// 2. fajr left bound, interval form (sunrise - N)
{
  let best = { score: -Infinity };
  for (let n = 60; n <= 150; n++) {
    const s = L.score(days.map((d) => [R[d].fajr, R[d].sunrise - n]));
    const r = s.exact * 1e6 + s.w1 * 1e3 - s.mae;
    if (r > best.score) best = { score: r, n, s };
  }
  out.bounds.fajrInterval = { rule: "sunrise-N", n: best.n, score: best.s };
}

// 3. sunrise (fajr right bound + 1)
const sunrise = E.fitFixed((d) => T18[d].sunrise, days, printed("sunrise"), [-6, -5, -4, -3, -2, -1, 0, 1, 2]);
out.bounds.sunrise = { rule: "sunrise+pad", pad: sunrise.pad, mode: sunrise.mode, score: sunrise.s };

// 4. dhuhr left bound: wall-clock constant per era
{
  const byMonth = {};
  for (const d of days) (byMonth[d.slice(0, 7)] = byMonth[d.slice(0, 7)] || new Set()).add(R[d].dhuhr);
  const vals = Object.fromEntries(Object.entries(byMonth).map(([k, v]) => [k, [...v].sort((a, b) => a - b)]));
  const last780 = days.filter((d) => R[d].dhuhr === 780).slice(-1)[0];
  const first760 = days.filter((d) => R[d].dhuhr === 760)[0];
  out.bounds.dhuhr = {
    rule: "wall-clock constant",
    perMonthUnique: vals,
    last780,
    first760,
    score: L.score(days.filter((d) => R[d].dhuhr > 0).map((d) => [R[d].dhuhr, eraValue(d)]).filter((x) => x[1] !== null)),
  };
  function eraValue(d) { return d <= "2019-06-30" ? 780 : 760; }
}

// 5. asr left bound
for (const [name, tab] of [["hanafi", T18], ["shafi", T18S]]) {
  const r = E.fitFixed((d) => tab[d].asr, days, printed("asr"), [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6]);
  out.bounds[`asr_${name}`] = { rule: "shadow factor", pad: r.pad, mode: r.mode, score: r.s };
}

// 6. sunset bracket: centre vs adhan sunset, and the width
{
  const center = (d) => (R[d].sunset + R[d].sunsetEnd) / 2;
  const widths = days.map((d) => R[d].sunsetEnd - R[d].sunset);
  const w = {};
  for (const d of days) (w[d.slice(0, 4)] = w[d.slice(0, 4)] || []).push(R[d].sunsetEnd - R[d].sunset);
  const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
  let best = { score: -Infinity };
  for (const mode of E.MODES) for (const pad of [-4, -3, -2, -1, 0, 1, 2, 3, 4]) {
    const s = L.score(days.map((d) => [center(d), L.roundMin(T18[d].maghrib, pad, mode)]));
    const r = s.exact * 1e6 + s.w1 * 1e3 - s.mae;
    if (r > best.score) best = { score: r, pad, mode, s };
  }
  out.bounds.sunsetBracket = {
    rule: "true sunset +/- w",
    centerPad: best.pad, centerMode: best.mode, centerScore: best.s,
    widthMin: Math.min(...widths), widthMax: Math.max(...widths),
    widthByYear: Object.fromEntries(Object.keys(w).sort().map((y) => [y, med(w[y])])),
    centreVsSunsetByMonth: E.amplitude((d) => T18[d].maghrib, days, center, best.pad, best.mode),
  };
}

// 7. maghrib left bound = sunset + pad
const maghrib = E.fitFixed((d) => T18[d].maghrib, days, printed("maghrib"), [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
out.bounds.maghrib = { rule: "sunset+pad", pad: maghrib.pad, mode: maghrib.mode, score: maghrib.s };

// 8. isha left bound: interval on the printed maghrib, and angle form
{
  const diffs = {};
  for (const d of days) diffs[R[d].isha - R[d].maghrib] = (diffs[R[d].isha - R[d].maghrib] || 0) + 1;
  let best = { score: -Infinity };
  for (const mode of E.MODES) for (let n = 60; n <= 120; n++) {
    const s = L.score(days.map((d) => [R[d].isha, R[d].maghrib + n]));
    const r = s.exact * 1e6 + s.w1 * 1e3 - s.mae;
    if (r > best.score) best = { score: r, n, s };
  }
  out.bounds.ishaInterval = { rule: "printed maghrib + N", n: best.n, score: best.n === 90 ? L.score(days.map((d) => [R[d].isha, R[d].maghrib + 90])) : best.s, printedMinusPrintedMaghrib: diffs };
  const ang = E.fitAngle(TAB_I, days, printed("isha"), [-4, -2, -1, 0, 1, 2, 4]);
  out.bounds.ishaAngle = { rule: "angle", theta: ang.theta, pad: ang.pad, mode: ang.mode, score: ang.s };
}

// 9. window grammar integrity
{
  const bad = { dhuhrEndVsAsr: 0, asrEndVsSunset: 0, sunsetEndVsMaghrib: 0, ishaEndVsNextFajr: 0 };
  const examples = {};
  const magDur = {};
  const nextDay = (d) => { const [y, m, dd] = d.split("-").map(Number); return new Date(Date.UTC(y, m - 1, dd + 1)).toISOString().slice(0, 10); };
  for (const d of days) {
    const p = R[d];
    if (p.dhuhrEnd + 1 !== p.asr) { bad.dhuhrEndVsAsr++; examples.dhuhrEndVsAsr = examples.dhuhrEndVsAsr || [d, p.dhuhrEnd, p.asr]; }
    if (p.asrEnd + 1 !== p.sunset) { bad.asrEndVsSunset++; examples.asrEndVsSunset = examples.asrEndVsSunset || [d, p.asrEnd, p.sunset]; }
    if (p.sunsetEnd + 1 !== p.maghrib) { bad.sunsetEndVsMaghrib++; examples.sunsetEndVsMaghrib = examples.sunsetEndVsMaghrib || [d, p.sunsetEnd, p.maghrib]; }
    magDur[p.maghribEnd - p.maghrib] = (magDur[p.maghribEnd - p.maghrib] || 0) + 1;
    const nx = R[nextDay(d)];
    if (nx) {
      const endAdj = p.ishaEnd < p.isha ? p.ishaEnd + 1440 : p.ishaEnd;
      if ((endAdj + 1) % 1440 !== nx.fajr) { bad.ishaEndVsNextFajr++; examples.ishaEndVsNextFajr = examples.ishaEndVsNextFajr || [d, (endAdj + 1) % 1440, nx.fajr]; }
    }
  }
  out.bounds.chain = {
    violations: bad, examples, maghribWindowDurationMinutes: magDur,
    ishaCrossesMidnight: days.filter((d) => R[d].ishaEnd < R[d].isha).length,
    fajrWindowEndVsSunrise: days.filter((d) => d && R[d].sunrise === R[d].sunrise).length,
  };
}

// per-year + amplitude for the two bounds that carry a fitted rule
for (const [name, ref, key] of [
  ["fajrAngle", (d) => TAB_F[fajr.theta][d], "fajr"],
  ["sunrise", (d) => T18[d].sunrise, "sunrise"],
  ["maghrib", (d) => T18[d].maghrib, "maghrib"],
  ["ishaAngle", (d) => TAB_I[out.bounds.ishaAngle.theta][d], "isha"],
]) {
  const p = out.bounds[name];
  p.perYear = E.perYear(ref, days, printed(key), p.pad, p.mode);
  p.amplitude = E.amplitude(ref, days, printed(key), p.pad, p.mode);
}
out.bounds.fajrInterval.perYear = E.perYear((d) => (R[d].sunrise - out.bounds.fajrInterval.n) * 60, days, printed("fajr"), 0, "round");
out.bounds.ishaInterval.perYear = E.perYear((d) => (R[d].maghrib + out.bounds.ishaInterval.n) * 60, days, printed("isha"), 0, "round");
out.bounds.asr_hanafi.perYear = E.perYear((d) => T18[d].asr, days, printed("asr"), out.bounds.asr_hanafi.pad, out.bounds.asr_hanafi.mode);

// between-year stability of the fajr rule, per calendar month
{
  const stab = {};
  for (const y of years) {
    for (const mo of ["01", "07"]) {
      const yd = days.filter((d) => d.startsWith(`${y}-${mo}`));
      if (!yd.length) continue;
      const f = E.fitAngle(TAB_F, yd, printed("fajr"), [-2, -1, 0, 1, 2]);
      const iv = (() => { let b = { score: -Infinity }; for (let n = 70; n <= 140; n++) { const s = L.score(yd.map((d) => [R[d].fajr, R[d].sunrise - n])); const r = s.exact * 1e6 + s.w1 * 1e3 - s.mae; if (r > b.score) b = { score: r, n }; } return b.n; })();
      stab[`${y}-${mo}`] = { theta: f.theta, pad: f.pad, mode: f.mode, interval: iv, exact: f.s.exact, n: f.s.n };
    }
  }
  out.bounds.fajrStability = stab;
}

out.inversion = INV;
fs.writeFileSync(`${W}/tj-deep.json`, JSON.stringify(out, null, 1));

console.log("rows", days.length, days[0], days[days.length - 1]);
const show = (name) => { const p = out.bounds[name]; console.log(name.padEnd(14), JSON.stringify({ theta: p.theta, n: p.n, pad: p.pad, mode: p.mode }), E.fmt(p.score)); };
for (const n of ["fajrAngle", "fajrInterval", "sunrise", "asr_hanafi", "asr_shafi", "maghrib", "ishaInterval", "ishaAngle"]) show(n);
console.log("dhuhr", JSON.stringify(out.bounds.dhuhr.last780), JSON.stringify(out.bounds.dhuhr.first760), E.fmt(out.bounds.dhuhr.score));
console.log("sunset bracket", JSON.stringify({ pad: out.bounds.sunsetBracket.centerPad, mode: out.bounds.sunsetBracket.centerMode, w: [out.bounds.sunsetBracket.widthMin, out.bounds.sunsetBracket.widthMax] }), E.fmt(out.bounds.sunsetBracket.centerScore));
console.log("chain", JSON.stringify(out.bounds.chain.violations), "crossesMidnight", out.bounds.chain.ishaCrossesMidnight);
console.log("fajr stability", JSON.stringify(out.bounds.fajrStability));
