// The Oman angle ridge: which fajr/isha angles survive 100% within-1 on the full span,
// per city, under each rounding convention. If the band is wide, the ridge is degenerate.
// Run: TZ=Asia/Muscat node om-ridge.js
const fs = require("fs");
const S = require("./solar");
const O = process.env.HOME + "/athan-gitree/census/o1l-city/gaps-closed";
const M = process.env.HOME + "/athan-gitree/census/o1l-city/mideast-cities";
const H = process.env.HOME + "/athan-gitree";

const CITIES = {
  salalah: [17.0151, 54.0924], sohar: [24.3419, 56.7298], nizwa: [22.9333, 57.5333],
  sur: [22.5667, 59.5289], ibri: [23.2254, 56.5155], buraimi: [24.25, 55.7833], muscat: [23.588, 58.3829],
};
const TZ = "Asia/Muscat";

function parseHm(s) { const [h, m] = String(s).trim().split(":").map(Number); return h * 60 + m; }
function norm(r) {
  const dhuhr = r.dhuhr >= 1380 ? r.dhuhr - 720 : r.dhuhr;
  const fix = (v) => (v === undefined || v === null ? null : (v < 720 ? v + 720 : v));
  return { fajr: r.fajr, sunrise: r.sunrise, dhuhr, asr: fix(r.asr), maghrib: fix(r.maghrib), isha: fix(r.isha) };
}
function load(city) {
  const rows = {};
  const add = (date, r) => {
    const v = {};
    for (const c of ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]) {
      const raw = r[c] !== undefined ? r[c] : (c === "maghrib" ? r.magrib : undefined);
      v[c] = typeof raw === "string" ? parseHm(raw) : raw;
    }
    if (Object.values(v).some((x) => x === null || x === undefined || Number.isNaN(x))) return;
    rows[date] = norm(v);
  };
  for (const f of fs.readdirSync(`${O}/data`)) {
    const m = f.match(/^om-([a-z]+)-(\d{4})\.json$/);
    if (!m || m[1] !== city) continue;
    const j = JSON.parse(fs.readFileSync(`${O}/data/${f}`, "utf8"));
    for (const d of Object.keys(j)) add(d, j[d]);
  }
  const banked = `${M}/data/om-${city}.json`;
  if (fs.existsSync(banked)) {
    const j = JSON.parse(fs.readFileSync(banked, "utf8"));
    for (const d of Object.keys(j)) add(d, j[d]);
  }
  if (city === "muscat") {
    const src = [
      [`${H}/census/ab-harvest/oman-muscat-2021.json`, "list"], [`${H}/census/o1k-wide/deep2/data/om-muscat-2022.json`, "obj"],
      [`${H}/census/ab-harvest/oman-muscat-2023.json`, "list"], [`${H}/census/o1k-wide/deep2/data/om-muscat-2024.json`, "obj"],
      [`${H}/census/ab-harvest/oman-muscat-2025.json`, "list"], [`${H}/census/ab-harvest/oman-muscat-2026.json`, "list"],
      [`${H}/census/o1k-wide/mideast/data/om-mara-muscat-2027.json`, "obj"], [`${H}/census/o1k-wide/gulf2/data/om-muscat-2028.json`, "obj"],
    ];
    for (const [p, kind] of src) {
      if (!fs.existsSync(p)) continue;
      const j = JSON.parse(fs.readFileSync(p, "utf8"));
      if (kind === "list") for (const a of j) { const [dmy, ...v] = a; const [d, mo, y] = dmy.split("/"); add(`${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`, { fajr: v[0], sunrise: v[1], dhuhr: v[2], asr: v[3], maghrib: v[4], isha: v[5] }); }
      else for (const d of Object.keys(j)) add(d, j[d]);
    }
  }
  return rows;
}

const out = { job: "O1l-25 Oman ridge", cities: {} };
for (const city of Object.keys(CITIES)) {
  const rows = load(city);
  const dates = Object.keys(rows).sort();
  const coord = new S.A.Coordinates(...CITIES[city]);
  const cache = {};
  for (const d of dates) {
    const [y, m, dd] = d.split("-").map(Number);
    cache[d] = { fajr: [], isha: [] };
    for (let a = 17.2; a <= 18.8; a += 0.05) {
      const t = S.times(coord, { fajrAngle: a, ishaAngle: a, madhab: "shafi", tz: TZ }, d);
      cache[d].fajr.push([+a.toFixed(2), t.fajr]);
      cache[d].isha.push([+a.toFixed(2), t.isha]);
    }
  }
  const res = {};
  for (const mode of ["round", "ceil"]) {
    for (const col of ["fajr", "isha"]) {
      const bands = [];
      for (const [a] of cache[dates[0]][col]) {
        let ok = 0;
        for (const d of dates) {
          const sec = cache[d][col].find((x) => x[0] === a)[1];
          const pad = mode === "ceil" ? -1 : 0;
          if (Math.abs(S.roundMin(sec, pad, mode) - rows[d][col]) <= 1) ok++;
        }
        if (ok === dates.length) bands.push(a);
      }
      res[`${col}-${mode}`] = bands.length ? [bands[0], bands[bands.length - 1], bands.length] : null;
    }
  }
  out.cities[city] = { rows: dates.length, first: dates[0], last: dates[dates.length - 1], ridge: res };
  console.log(city, dates.length, JSON.stringify(res));
}
fs.writeFileSync(`${O}/data/om-ridge.json`, JSON.stringify(out, null, 1));
