// Egypt 82-city fit: recover ESA's implied point per city from (sunrise,dhuhr,asr),
// then score the frozen recipe 19.5/17.5 zero-margin on all six columns at both
// the gazetteer point and the implied point. Run: TZ=Africa/Cairo node fit82.js
const fs = require("fs");
const L = require("./lib");
const W = process.env.HOME + "/athan-gitree/census/o1l-city/egypt-82";
const COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
const RECIPE = { fajrAngle: 19.5, ishaAngle: 17.5, madhab: "shafi" };
const toMin = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
const coords = JSON.parse(fs.readFileSync(W + "/data/coords.json", "utf8"));

function loadCity(i) {
  const p = `${W}/data/eg-esa-${String(i).padStart(2, "0")}-2026.json`;
  if (!fs.existsSync(p)) return null;
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  const days = Object.keys(raw).sort();
  const rows = {};
  for (const d of days) rows[d] = Object.fromEntries(COLS.map((k) => [k, toMin(raw[d][k === "maghrib" ? "magrib" : k])]));
  return { days, rows };
}

// objective in minutes: sunrise + dhuhr + asr, equal weight
function obj(c, days, rows) {
  let s = 0;
  for (const d of days) {
    const t = L.times(c, RECIPE, d);
    for (const k of ["sunrise", "dhuhr", "asr"]) {
      if (t[k] === null) return 1e9;
      s += Math.abs(t[k] / 60 - rows[d][k]);
    }
  }
  return s / days.length;
}

function recover(days, rows) {
  const sample = days.filter((_, j) => j % 15 === 0);
  let best = { v: Infinity, lat: 30, lng: 31 };
  const scan = (lat0, lat1, lng0, lng1, step) => {
    for (let lat = lat0; lat <= lat1 + 1e-9; lat += step) {
      for (let lng = lng0; lng <= lng1 + 1e-9; lng += step) {
        const v = obj(L.coords(lat, lng), sample, rows);
        if (v < best.v) best = { v, lat, lng };
      }
    }
  };
  scan(21.5, 32.0, 24.5, 37.0, 0.4);
  scan(best.lat - 0.5, best.lat + 0.5, best.lng - 0.5, best.lng + 0.5, 0.05);
  scan(best.lat - 0.06, best.lat + 0.06, best.lng - 0.06, best.lng + 0.06, 0.01);
  return { lat: +best.lat.toFixed(3), lng: +best.lng.toFixed(3), obj: +best.v.toFixed(2) };
}

function scoreCity(days, rows, lat, lng) {
  const c = L.coords(lat, lng);
  const model = {};
  for (const d of days) {
    const t = L.times(c, RECIPE, d);
    model[d] = Object.fromEntries(COLS.map((k) => [k, L.roundMin(t[k], 0, "round")]));
  }
  const per = {};
  for (const k of COLS) {
    const s = L.score(days.map((d) => [rows[d][k], model[d][k]]));
    per[k] = { exact: s.exact, w1: s.w1, n: s.n, mae: +s.mae.toFixed(2), max: s.maxAbs,
               signed: +s.meanSigned.toFixed(2) };
  }
  const allSixW1 = days.filter((d) => COLS.every((k) => Math.abs(model[d][k] - rows[d][k]) <= 1)).length;
  const allSixExact = days.filter((d) => COLS.every((k) => model[d][k] === rows[d][k])).length;
  // worst day
  let worst = { dev: -1 };
  for (const d of days) {
    const dev = Math.max(...COLS.map((k) => Math.abs(model[d][k] - rows[d][k])));
    if (dev > worst.dev) worst = { dev, day: d, delta: Object.fromEntries(COLS.map((k) => [k, model[d][k] - rows[d][k]])) };
  }
  return { n: days.length, per, allSixW1, allSixExact, worst, model, rows };
}

const out = {};
for (const city of coords) {
  const data = loadCity(city.i);
  if (!data) { console.log(city.i, city.key, "NO DATA"); continue; }
  const imp = recover(data.days, data.rows);
  const atImp = scoreCity(data.days, data.rows, imp.lat, imp.lng);
  const atGaz = city.lat != null ? scoreCity(data.days, data.rows, city.lat, city.lng) : null;
  out[city.i] = {
    i: city.i, key: city.key, lat0: city.lat, lng0: city.lng, source: city.source,
    implied: imp,
    spanKm: city.lat != null ? +(Math.hypot((imp.lat - city.lat) * 111, (imp.lng - city.lng) * 111 * Math.cos(imp.lat * Math.PI / 180))).toFixed(1) : null,
    atImplied: { n: atImp.n, allSixW1: atImp.allSixW1, allSixExact: atImp.allSixExact, per: atImp.per, worst: atImp.worst },
    atGazetteer: atGaz ? { n: atGaz.n, allSixW1: atGaz.allSixW1, allSixExact: atGaz.allSixExact, per: atGaz.per, worst: atGaz.worst } : null,
  };
  const a = out[city.i].atImplied;
  console.log(`${String(city.i).padStart(2)} ${city.key.padEnd(22)} imp ${imp.lat},${imp.lng} (${imp.obj}m) gaz ${city.lat},${city.lng} d=${out[city.i].spanKm}km  IMPL all6<=1 ${a.allSixW1}/${a.n} worst ${a.worst.dev}  GAZ all6<=1 ${atGaz ? atGaz.allSixW1 : "-"}/${atGaz ? atGaz.n : "-"}`);
}
fs.writeFileSync(W + "/data/fit82.json", JSON.stringify(out, null, 1));
