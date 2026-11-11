// Live-page gate: the page's own "Today" block against the page's fitted recipe on the date the
// capture carries (2026-11-11, from the Hijri/Gregorian pair printed beside it). A page whose
// live block disagrees with its own month table is not evidence.
const fs = require("fs");
const path = require("path");
const { Coordinates, CalculationMethod, PrayerTimes, Madhab, Rounding } = require(
  "$HOME/athan-gitree/census/adhan-build/node_modules/adhan");

const ROOT = path.dirname(__dirname);
const DAY = "2026-11-11";
function tzOffset(date, tz) {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour12: false, year: "numeric",
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const p = Object.fromEntries(f.formatToParts(date).filter((x) => x.type !== "literal")
    .map((x) => [x.type, x.value]));
  return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second)
    - date.getTime()) / 60000);
}
const hhmm = (v) => { const [h, m] = v.split(":").map(Number); return h * 60 + m; };
const diff = (a, b) => { const d = Math.abs(a - b) % 1440; return Math.min(d, 1440 - d); };
const COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

const fits = JSON.parse(fs.readFileSync(path.join(ROOT, "fits-athpro.json"), "utf8"));
const out = [];
for (const f of fits) {
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, "data", `athanpro-${f.slug}.json`), "utf8"));
  if (!d.meta.today) continue;
  const c = new Coordinates(...d.meta.coord.map(Number));
  const off = tzOffset(new Date(DAY + "T12:00:00Z"), f.tz);
  const p = CalculationMethod.MuslimWorldLeague();
  p.fajrAngle = f.recipe.fajrAngle; p.ishaAngle = f.recipe.ishaAngle; p.rounding = Rounding.None;
  const pt = new PrayerTimes(c, new Date(DAY + "T00:00:00Z"), p);
  pt.madhab = f.recipe.asr === "Hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  const worst = Math.max(...COLS.map((col, i) => {
    const got = Math.round((pt[col].getTime() / 60000 + off + 1440 * 10) % 1440);
    return diff(got, hhmm(d.meta.today[i]));
  }));
  out.push({ slug: f.slug, worst });
}
const pass = out.filter((r) => r.worst <= 2);
console.log(`${pass.length}/${out.length} live blocks agree with the page's own recipe within 2 min`);
for (const r of out.filter((x) => x.worst > 2)) console.log("  FAIL", r.slug, r.worst);
