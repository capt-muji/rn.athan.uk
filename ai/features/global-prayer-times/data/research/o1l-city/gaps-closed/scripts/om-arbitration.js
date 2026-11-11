// Flag 2 — Oman: the two parameterizations on the full 2021-2031 span.
// A = O1l-8: 18/18, nearest, +5 on dhuhr/asr/maghrib, sunrise 0.
// B = deep2: 17.8/18.15, ceil with -1 on fajr/isha, +5 ceil on dhuhr/asr/maghrib, sunrise 0 ceil.
// Run: TZ=Asia/Muscat node om-arbitration.js
const fs = require("fs");
const S = require("./solar");
const O = process.env.HOME + "/athan-gitree/census/o1l-city/gaps-closed";
const M = process.env.HOME + "/athan-gitree/census/o1l-city/mideast-cities";

const CITIES = {
  salalah: [17.0151, 54.0924], sohar: [24.3419, 56.7298], nizwa: [22.9333, 57.5333],
  sur: [22.5667, 59.5289], ibri: [23.2254, 56.5155], buraimi: [24.25, 55.7833],
  muscat: [23.588, 58.3829],
};
const TZ = "Asia/Muscat";
const COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

function norm(r) {
  // The banked waves write maghrib as "magrib".
  if (r.maghrib === undefined && r.magrib !== undefined) r = { ...r, maghrib: r.magrib };
  // dhuhr prints 11:59 in October; a parser that added twelve hours leaves 23:59.
  const dhuhr = r.dhuhr >= 1380 ? r.dhuhr - 720 : r.dhuhr;
  const fix = (v) => (v === undefined || v === null ? null : (v < 720 ? v + 720 : v));
  return {
    fajr: r.fajr, sunrise: r.sunrise, dhuhr,
    asr: fix(r.asr), maghrib: fix(r.maghrib), isha: fix(r.isha),
  };
}
function parseHm(s) {
  const t = String(s).trim();
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Load every dated row held for a city, from this workspace and the banked sources.
function load(city) {
  const rows = {};
  const add = (date, r) => {
    const v = {};
    for (const c of COLS) {
      const raw = r[c] !== undefined ? r[c] : (c === "maghrib" ? r.magrib : undefined);
      v[c] = typeof raw === "string" ? parseHm(raw) : raw;
    }
    if (COLS.some((c) => v[c] === null || Number.isNaN(v[c]))) return;
    rows[date] = norm(v);
  };
  // 1. This workspace: harvested years, 24h already.
  for (const f of fs.readdirSync(`${O}/data`)) {
    const m = f.match(/^om-([a-z]+)-(\d{4})\.json$/);
    if (!m || m[1] !== city) continue;
    const j = JSON.parse(fs.readFileSync(`${O}/data/${f}`, "utf8"));
    for (const d of Object.keys(j)) add(d, j[d]);
  }
  // 2. O1l-8 banked 2026 + 2031 (already 24h).
  const banked = `${M}/data/om-${city}.json`;
  if (fs.existsSync(banked)) {
    const j = JSON.parse(fs.readFileSync(banked, "utf8"));
    for (const d of Object.keys(j)) add(d, j[d]);
  }
  // 3. Muscat's banked years from the earlier waves, printed 12h on asr/maghrib/isha.
  if (city === "muscat") {
    const src = [
      ["/census/ab-harvest/oman-muscat-2021.json", "list"],
      [`${process.env.HOME}/athan-gitree/census/o1k-wide/deep2/data/om-muscat-2022.json`, "obj"],
      ["/census/ab-harvest/oman-muscat-2023.json", "list"],
      [`${process.env.HOME}/athan-gitree/census/o1k-wide/deep2/data/om-muscat-2024.json`, "obj"],
      ["/census/ab-harvest/oman-muscat-2025.json", "list"],
      ["/census/ab-harvest/oman-muscat-2026.json", "list"],
      [`${process.env.HOME}/athan-gitree/census/o1k-wide/mideast/data/om-mara-muscat-2027.json`, "obj"],
      [`${process.env.HOME}/athan-gitree/census/o1k-wide/gulf2/data/om-muscat-2028.json`, "obj"],
    ];
    for (const [p, kind] of src) {
      const path = p.startsWith("/census") ? process.env.HOME + "/athan-gitree" + p : p;
      if (!fs.existsSync(path)) continue;
      const j = JSON.parse(fs.readFileSync(path, "utf8"));
      if (kind === "list") {
        for (const a of j) {
          const [dmy, ...v] = a;
          const [d, mo, y] = dmy.split("/");
          add(`${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
            { fajr: v[0], sunrise: v[1], dhuhr: v[2], asr: v[3], maghrib: v[4], isha: v[5] });
        }
      } else {
        for (const d of Object.keys(j)) add(d, j[d]);
      }
    }
  }
  return rows;
}

const A = { fajr: { a: 18, pad: 0, mode: "round" }, isha: { a: 18, pad: 0, mode: "round" }, sunrise: { pad: 0, mode: "round" }, dhuhr: { pad: 5, mode: "round" }, asr: { pad: 5, mode: "round" }, maghrib: { pad: 5, mode: "round" } };
const B = { fajr: { a: 17.8, pad: -1, mode: "ceil" }, isha: { a: 18.15, pad: -1, mode: "ceil" }, sunrise: { pad: 0, mode: "ceil" }, dhuhr: { pad: 5, mode: "ceil" }, asr: { pad: 5, mode: "ceil" }, maghrib: { pad: 5, mode: "ceil" } };

function scoreCity(city, rows, P) {
  const pairs = {};
  for (const c of COLS) pairs[c] = [];
  const byYear = {};
  for (const date of Object.keys(rows).sort()) {
    const r = rows[date];
    const t = S.times(new S.A.Coordinates(...CITIES[city]), { fajrAngle: P.fajr.a, ishaAngle: P.isha.a, madhab: "shafi", tz: TZ }, date);
    const y = date.slice(0, 4);
    byYear[y] = byYear[y] || {};
    for (const c of COLS) {
      if (t[c] === null) continue;
      const model = S.roundMin(t[c], P[c].pad, P[c].mode);
      pairs[c].push([model, r[c]]);
      (byYear[y][c] = byYear[y][c] || []).push([model, r[c]]);
    }
  }
  const per = {};
  for (const c of COLS) per[c] = S.score(pairs[c]);
  const perYear = {};
  for (const y of Object.keys(byYear).sort()) {
    perYear[y] = {};
    for (const c of COLS) if (byYear[y][c]) perYear[y][c] = S.score(byYear[y][c]);
  }
  return { per, perYear };
}

const out = { job: "O1l-25 Oman arbitration", paramA: "18/18 nearest +5", paramB: "17.8/18.15 ceil -1/+5", cities: {} };
for (const city of Object.keys(CITIES)) {
  const rows = load(city);
  const years = [...new Set(Object.keys(rows).map((d) => d.slice(0, 4)))].sort();
  out.cities[city] = {
    rows: Object.keys(rows).length, first: Object.keys(rows).sort()[0], last: Object.keys(rows).sort().slice(-1)[0], years,
    A: scoreCity(city, rows, A), B: scoreCity(city, rows, B),
  };
}
fs.writeFileSync(`${O}/data/om-arbitration.json`, JSON.stringify(out, null, 1));

for (const city of Object.keys(out.cities)) {
  const c = out.cities[city];
  console.log(`\n== ${city} rows ${c.rows} years ${c.years[0]}-${c.years[c.years.length - 1]} (${c.years.length})`);
  for (const c2 of COLS) {
    const a = c.A.per[c2], b = c.B.per[c2];
    console.log(`  ${c2.padEnd(8)} A exact ${String(a.exactPct).padStart(5)} w1 ${String(a.w1Pct).padStart(5)} max ${String(a.max).padStart(2)} | B exact ${String(b.exactPct).padStart(5)} w1 ${String(b.w1Pct).padStart(5)} max ${String(b.max).padStart(2)}`);
  }
}
