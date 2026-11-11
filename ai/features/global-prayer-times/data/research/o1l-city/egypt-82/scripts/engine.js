// Fit engine shared by the deep jobs: angle tables computed once, then read as lookups.
const L = require("./lib");

const MODES = ["floor", "ceil", "round"];
const rank = (s) => s.exact * 1e6 + s.w1 * 1e3 - s.mae;

function angleTable(c, days, grid, key) {
  const tab = {};
  for (const th of grid) {
    tab[th] = {};
    for (const d of days) tab[th][d] = L.times(c, { fajrAngle: th, ishaAngle: th, madhab: "hanafi" }, d)[key];
  }
  return tab;
}

// printed: day -> minutes. ref: (day, theta) -> seconds
function fitAngle(tab, days, printed, pads, modes) {
  let best = { score: -Infinity };
  for (const th of Object.keys(tab).map(Number)) {
    for (const mode of modes || MODES) {
      for (const pad of pads) {
        const s = L.score(days.map((d) => [printed(d), L.roundMin(tab[th][d], pad, mode)]));
        const r = rank(s);
        if (r > best.score) best = { score: r, theta: th, pad, mode, s };
      }
    }
  }
  return best;
}

function fitFixed(ref, days, printed, pads, modes) {
  let best = { score: -Infinity };
  for (const mode of modes || MODES) {
    for (const pad of pads) {
      const s = L.score(days.map((d) => [printed(d), L.roundMin(ref(d), pad, mode)]));
      const r = rank(s);
      if (r > best.score) best = { score: r, pad, mode, s };
    }
  }
  return best;
}

function perYear(ref, days, printed, pad, mode) {
  const by = {};
  for (const d of days) (by[d.slice(0, 4)] = by[d.slice(0, 4)] || []).push([printed(d), L.roundMin(ref(d), pad, mode)]);
  return Object.fromEntries(Object.keys(by).sort().map((y) => [y, L.score(by[y])]));
}

function amplitude(ref, days, printed, pad, mode) {
  const by = {};
  for (const d of days) (by[d.slice(0, 7)] = by[d.slice(0, 7)] || []).push(printed(d) - L.roundMin(ref(d), pad, mode));
  const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const months = Object.fromEntries(Object.keys(by).sort().map((k) => [k, med(by[k])]));
  const arr = Object.values(months);
  return { peakToPeak: Math.max(...arr) - Math.min(...arr), months };
}

function grid(from, to, step) {
  const g = [];
  for (let v = from; v <= to + 1e-9; v += step) g.push(+v.toFixed(3));
  return g;
}

const fmt = (s) => `exact ${s.exact}/${s.n} (${(100 * s.exact / s.n).toFixed(1)}%) w1 ${(100 * s.w1 / s.n).toFixed(1)}% mae ${s.mae.toFixed(2)} max ${s.maxAbs} bias ${s.meanSigned.toFixed(2)}`;

module.exports = { MODES, rank, angleTable, fitAngle, fitFixed, perYear, amplitude, grid, fmt };
