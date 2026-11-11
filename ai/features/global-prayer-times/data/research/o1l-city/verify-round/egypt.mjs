import { adhan, rawTimes, score, parseHM, readJSON, pct, ROUND } from "./lib.mjs";

const W = `${process.env.HOME}/athan-gitree/census/o1l-city`;
const TZ = "Africa/Cairo";
const COLS = ["fajr", "sunrise", "dhuhr", "asr", "magrib", "isha"];
const RAWKEY = { fajr: "fajr", sunrise: "sunrise", dhuhr: "dhuhr", asr: "asr", magrib: "maghrib", isha: "isha" };
const SAMPLE = [0, 8, 16, 24, 32, 40, 48, 56, 64, 77];

const coords = readJSON(`${W}/egypt-82/data/coords.json`);
const manifest = readJSON(`${W}/egypt-82/data/manifest.json`);
const idx = (i) => String(i).padStart(2, "0");

const params = new adhan.CalculationParameters("Other", 19.5, 17.5);
params.rounding = adhan.Rounding.None;
params.madhab = adhan.Madhab.Shafi;
params.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;

const year = (i) => readJSON(`${W}/egypt-82/data/eg-esa-${idx(i)}-2026.json`);

function modelAt(lat, lon, iso) {
  const raw = rawTimes({ lat, lon, iso, tz: TZ, params });
  const m = {};
  for (const c of COLS) m[c] = ROUND.nearest(raw[RAWKEY[c]] / 60);
  return m;
}

function errAt(lat, lon, days, data) {
  let sum = 0, n = 0;
  for (const iso of days) {
    const m = modelAt(lat, lon, iso);
    for (const c of ["sunrise", "dhuhr", "asr"]) {
      const pr = parseHM(data[iso][c]);
      if (pr == null) continue;
      sum += Math.abs(m[c] - pr);
      n++;
    }
  }
  return sum / n;
}

console.log("city\tkey\tgazLat\timpLat\timpLon\tkmOff\tn\texact%\twithin1%\tMAE\tworst\tfajrW1\tsunW1\tdhuhrW1\tasrW1\tmagW1\tishaW1");
const pooled = { n: 0, exact: 0, w1: 0, worst: 0 };
const badCells = [];

for (const i of SAMPLE) {
  const data = year(i);
  const isos = Object.keys(data).sort();
  const days = isos.filter((_, k) => k % 30 === 0).slice(0, 13);
  const g = coords[i];
  // coarse grid around the gazetteer point, then refine
  let best = { lat: g.lat, lon: g.lng, e: errAt(g.lat, g.lng, days, data) };
  for (let lat = g.lat - 0.6; lat <= g.lat + 0.6; lat += 0.05) {
    for (let lon = g.lng - 0.6; lon <= g.lng + 0.6; lon += 0.05) {
      const e = errAt(lat, lon, days, data);
      if (e < best.e) best = { lat, lon, e };
    }
  }
  const c0 = { ...best };
  for (let lat = c0.lat - 0.05; lat <= c0.lat + 0.05; lat += 0.005) {
    for (let lon = c0.lon - 0.05; lon <= c0.lon + 0.05; lon += 0.005) {
      const e = errAt(lat, lon, days, data);
      if (e < best.e) best = { lat, lon, e };
    }
  }

  const all = [];
  const per = Object.fromEntries(COLS.map((c) => [c, []]));
  for (const iso of isos) {
    const m = modelAt(best.lat, best.lon, iso);
    for (const c of COLS) {
      const pr = parseHM(data[iso][c]);
      if (pr == null) continue;
      all.push({ model: m[c], printed: pr });
      per[c].push({ model: m[c], printed: pr });
      if (Math.abs(m[c] - pr) > 1) badCells.push(`${manifest[i].key} ${iso} ${c} model=${m[c]} printed=${pr}`);
    }
  }
  const s = score(all);
  pooled.n += s.n; pooled.exact += s.exact; pooled.w1 += s.w1; pooled.worst = Math.max(pooled.worst, s.worst);
  const km = Math.hypot((best.lat - g.lat) * 111, (best.lon - g.lng) * 111 * Math.cos((g.lat * Math.PI) / 180));
  console.log(
    [i, manifest[i].key, g.lat.toFixed(2), best.lat.toFixed(3), best.lon.toFixed(3), km.toFixed(0), s.n,
     pct(s.exact, s.n).toFixed(1), pct(s.w1, s.n).toFixed(2), s.mae.toFixed(3), s.worst,
     ...COLS.map((c) => pct(score(per[c]).w1, per[c].length).toFixed(2))].join("\t")
  );
}
console.log(`\nPOOLED n=${pooled.n} exact=${pct(pooled.exact, pooled.n).toFixed(2)}% within1=${pct(pooled.w1, pooled.n).toFixed(2)}% worst=${pooled.worst}`);
console.log(`cells >1 min: ${badCells.length}`);
for (const b of badCells.slice(0, 20)) console.log("  " + b);
