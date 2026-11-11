// Flag 5 — Brunei: the community 20/18 statement (Brunei Astronomical Society, citing
// Odeh 2024) scored against MORA's own 2026 dated table (OData list, captured 2026-11-11).
// MORA prints Zohor in 24 hours and Asar/Maghrib/Isyak in 12 hours with no meridiem.
// Cells more than 15 minutes off the model are publisher typos, listed and excluded.
// Run: TZ=Asia/Brunei node bn-20-18.js
const fs = require("fs");
const S = require("./solar");
const O = process.env.HOME + "/athan-gitree/census/o1l-city/gaps-closed";
const COORD = new S.A.Coordinates(4.9031, 114.9398);
const TZ = "Asia/Brunei";

const raw = JSON.parse(fs.readFileSync(`${O}/captures/bn-mora-2026-raw.json`, "utf8")).value;

function toMin(t, pm) {
  const parts = String(t).trim().replace(".", ":").split(":").filter((x) => x !== "");
  if (parts.length < 2) return null;
  const h = Number(parts[0]), m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m) || m > 59) return null;
  return (pm && h < 12 ? h + 12 : h) * 60 + m;
}

const byDate = new Map();
for (const r of raw) {
  const local = new Date(new Date(r.Date).getTime() + 8 * 3600 * 1000);
  const date = local.toISOString().slice(0, 10);
  if (!date.startsWith("2026")) continue;
  byDate.set(date, {
    date, imsak: toMin(r.Imsak), fajr: toMin(r.Suboh), sunrise: toMin(r.Syuruk),
    dhuhr: toMin(r.Zohor), asr: toMin(r.Asar, true), maghrib: toMin(r.Maghrib, true), isha: toMin(r.Isyak, true),
  });
}
const rows = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

const COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

function run(fa, ia, margins, mode) {
  const pairs = {}, defects = [];
  for (const c of COLS) pairs[c] = [];
  for (const r of rows) {
    const t = S.times(COORD, { fajrAngle: fa, ishaAngle: ia, madhab: "shafi", tz: TZ }, r.date);
    for (const c of COLS) {
      const model = S.roundMin(t[c], margins[c] || 0, mode);
      if (r[c] === null) { defects.push({ date: r.date, col: c, printed: null }); continue; }
      if (Math.abs(model - r[c]) > 15) { defects.push({ date: r.date, col: c, printed: r[c], model }); continue; }
      pairs[c].push([model, r[c]]);
    }
  }
  const o = {};
  for (const c of COLS) o[c] = S.score(pairs[c]);
  o.defects = defects;
  o.n = rows.length;
  return o;
}

const out = {
  job: "O1l-25 Brunei 20/18 vs MORA 2026",
  coord: [4.9031, 114.9398], tz: TZ,
  days: rows.length, first: rows[0].date, last: rows[rows.length - 1].date,
  plain: run(20, 18, {}, "round"),
  floor: run(20, 18, {}, "floor"),
};

const free = {};
for (const c of COLS) {
  let best = null;
  for (const mode of ["round", "floor", "ceil"]) {
    for (let pad = -8; pad <= 8; pad += 0.5) {
      const pairs = rows.filter((r) => r[c] !== null).map((r) => {
        const t = S.times(COORD, { fajrAngle: 20, ishaAngle: 18, madhab: "shafi", tz: TZ }, r.date);
        return [S.roundMin(t[c], pad, mode), r[c]];
      });
      const s = S.score(pairs);
      if (!best || s.w1 > best.w1 || (s.w1 === best.w1 && s.mae < best.mae)) best = { pad, mode, ...s };
    }
  }
  free[c] = best;
}
out.freeMarginsAt20_18 = free;

// Implied depression on a sample of days, to show the pair the table actually computes.
function implied(col) {
  const out = [];
  for (const r of rows.filter((x) => x.date.endsWith("-01") || x.date.endsWith("-15"))) {
    let lo = null, hi = null;
    for (let a = 14; a <= 22; a += 0.02) {
      const t = S.times(COORD, { fajrAngle: a, ishaAngle: a, madhab: "shafi", tz: TZ }, r.date);
      if (S.roundMin(t[col], 0, "round") === r[col]) { if (lo === null) lo = a; hi = a; }
    }
    if (lo !== null) out.push({ date: r.date, band: [+lo.toFixed(2), +hi.toFixed(2)] });
  }
  return out;
}
out.implied = { fajr: implied("fajr"), isha: implied("isha") };

fs.writeFileSync(`${O}/data/bn-mora-2026-20-18.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify({ n: out.days, first: out.first, last: out.last, plain: out.plain, floor: out.floor, free }, null, 1));
const f = out.implied.fajr, i = out.implied.isha;
console.log("implied fajr", f.map((x) => `${x.date.slice(5)}:${x.band[0]}-${x.band[1]}`).join(" "));
console.log("implied isha", i.map((x) => `${x.date.slice(5)}:${x.band[0]}-${x.band[1]}`).join(" "));
