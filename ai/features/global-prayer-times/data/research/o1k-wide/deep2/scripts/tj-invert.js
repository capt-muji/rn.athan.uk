// Inversion diagnostic: what depression angle / shadow factor does each printed bound imply?
// Standard solar geometry; dates are supplied, never read from the clock.
const fs = require("fs");
const W = process.env.HOME + "/athan-gitree/census/o1k-wide/deep2";
const R = require(`${W}/data/tj-window-bounds-24mo.json`);

const RAD = Math.PI / 180;
const LAT = 38.5598;

function declination(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const N = Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000) + 1;
  return -Math.asin(0.39779 * Math.cos(RAD * (0.98565 * (N + 10) + 1.914 * Math.sin(RAD * 0.98565 * (N - 2))))) / RAD;
}

// altitude for a minute-of-day, given solar noon in minutes and the declination
function altitude(min, noon, decl) {
  const H = (min - noon) * RAD * (360 / 1440);
  const s = Math.sin(LAT * RAD) * Math.sin(decl * RAD) + Math.cos(LAT * RAD) * Math.cos(decl * RAD) * Math.cos(H);
  return Math.asin(Math.max(-1, Math.min(1, s))) / RAD;
}

const rows = Object.keys(R).sort().filter((d) => R[d].fajr && R[d].sunrise && R[d].dhuhr && R[d].asr && R[d].sunset && R[d].maghrib && R[d].isha);
const byMonth = {};
for (const d of rows) {
  const p = R[d];
  const noon = (p.sunrise + 1 + (p.sunset + p.sunsetEnd) / 2) / 2;
  const decl = declination(d);
  const altFajr = altitude(p.fajr, noon, decl);
  const altSunrise = altitude(p.sunrise + 1, noon, decl);
  const altAsr = altitude(p.asr, noon, decl);
  const altMaghrib = altitude(p.maghrib, noon, decl);
  const altIsha = altitude(p.isha, noon, decl);
  const altNoon = altitude(noon, noon, decl);
  const shadow = 1 / Math.tan(altAsr * RAD) - 1 / Math.tan(altNoon * RAD);
  const k = d.slice(0, 7);
  (byMonth[k] = byMonth[k] || []).push({ f: altFajr, s: altSunrise, a: altAsr, sh: shadow, m: altMaghrib, i: altIsha, noon });
}
const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
const out = {};
for (const k of Object.keys(byMonth).sort()) {
  const b = byMonth[k];
  out[k] = {
    fajrDep: +med(b.map((x) => x.f)).toFixed(2),
    sunriseDep: +med(b.map((x) => x.s)).toFixed(2),
    asrShadow: +med(b.map((x) => x.sh)).toFixed(2),
    maghribDep: +med(b.map((x) => x.m)).toFixed(2),
    ishaDep: +med(b.map((x) => x.i)).toFixed(2),
    noonMin: Math.round(med(b.map((x) => x.noon))),
  };
}
fs.writeFileSync(`${W}/data/tj-inversion.json`, JSON.stringify(out, null, 1));
for (const k of Object.keys(out)) {
  const o = out[k];
  console.log(k, `fajrDep ${o.fajrDep}  sunriseDep ${o.sunriseDep}  asrShadow ${o.asrShadow}  maghribDep ${o.maghribDep}  ishaDep ${o.ishaDep}  noon ${o.noonMin}`);
}
