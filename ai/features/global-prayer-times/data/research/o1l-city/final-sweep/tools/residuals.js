// Signed residuals (printed - model) per column, pooled over every fitted page at its own
// recipe, so a platform-wide convention (a temkin, a rounding rule) is named rather than
// absorbed by a margin.
const fs = require("fs");
const path = require("path");
const { Coordinates, CalculationMethod, PrayerTimes, Madhab, Rounding } = require(
  "$HOME/athan-gitree/census/adhan-build/node_modules/adhan");

const ROOT = path.dirname(__dirname);
function tzOffset(date, tz) {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour12: false, year: "numeric",
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const p = Object.fromEntries(f.formatToParts(date).filter((x) => x.type !== "literal")
    .map((x) => [x.type, x.value]));
  return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second)
    - date.getTime()) / 60000);
}
const hhmm = (v) => { const [h, m] = v.split(":").map(Number); return h * 60 + m; };
const wrap = (x) => ((x % 1440) + 1440 + 720) % 1440 - 720;
const COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

const fits = JSON.parse(fs.readFileSync(path.join(ROOT, "fits-athpro.json"), "utf8"));
const pool = {}; COLS.forEach((c) => (pool[c] = []));
const perCity = {};
for (const f of fits) {
  const base = f.renderTz === f.tz ? `data/athanpro-${f.slug}.json`
    : `data/corrected/athanpro-${f.slug}-${f.renderTz.replace(/\//g, "-")}-corrected.json`;
  const file = path.join(ROOT, base);
  const d = JSON.parse(fs.readFileSync(file, "utf8"));
  const c = new Coordinates(...(f.coord || d.meta.coord).map(Number));
  const mine = {};
  for (const [day, r] of Object.entries(d.rows)) {
    const off = tzOffset(new Date(day + "T12:00:00Z"), f.tz);
    const p = CalculationMethod.MuslimWorldLeague();
    p.fajrAngle = f.recipe.fajrAngle; p.ishaAngle = f.recipe.ishaAngle; p.rounding = Rounding.None;
    const pt = new PrayerTimes(c, new Date(day + "T00:00:00Z"), p);
    pt.madhab = f.recipe.asr === "Hanafi" ? Madhab.Hanafi : Madhab.Shafi;
    for (const col of COLS) {
      const got = Math.round((pt[col].getTime() / 60000 + off + 1440 * 10) % 1440);
      const r2 = wrap(hhmm(r[col]) - got);
      pool[col].push(r2);
      (mine[col] = mine[col] || []).push(r2);
    }
  }
  perCity[f.slug] = Object.fromEntries(COLS.map((col) => [col, median(mine[col])]));
}
const summary = Object.fromEntries(COLS.map((col) => {
  const a = pool[col];
  return [col, { n: a.length, median: median(a), min: Math.min(...a), max: Math.max(...a),
    zero: a.filter((x) => x === 0).length }];
}));
console.log(JSON.stringify(summary, null, 1));
fs.writeFileSync(path.join(ROOT, "residuals.json"), JSON.stringify({ summary, perCity }, null, 1));
