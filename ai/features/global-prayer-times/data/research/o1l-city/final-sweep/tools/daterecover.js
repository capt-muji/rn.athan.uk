// Date-recover an athanpro "Today" block: scan every day of 2026 for the day whose model, at the
// page's own coordinates and recipe, reproduces the block within 1 minute on all five prayers.
// The block carries a Hijri/Gregorian label; if the label and the times disagree, the times are
// build-time data and the label is dynamic.
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
const diff = (a, b) => { const d = Math.abs(a - b) % 1440; return Math.min(d, 1440 - d); };
const COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

const slug = process.argv[2];
const f = JSON.parse(fs.readFileSync(path.join(ROOT, "fits-athpro.json"), "utf8")).find((x) => x.slug === slug);
const d = JSON.parse(fs.readFileSync(path.join(ROOT, "data", `athanpro-${slug}.json`), "utf8"));
const c = new Coordinates(...d.meta.coord.map(Number));
const hits = [];
for (let i = 0; i < 365; i++) {
  const day = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
  const off = tzOffset(new Date(day + "T12:00:00Z"), f.tz);
  const p = CalculationMethod.MuslimWorldLeague();
  p.fajrAngle = f.recipe.fajrAngle; p.ishaAngle = f.recipe.ishaAngle; p.rounding = Rounding.None;
  const pt = new PrayerTimes(c, new Date(day + "T00:00:00Z"), p);
  pt.madhab = f.recipe.asr === "Hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  const worst = Math.max(...COLS.map((col, i2) => {
    const got = Math.round((pt[col].getTime() / 60000 + off + 1440 * 10) % 1440);
    return diff(got, hhmm(d.meta.today[i2]));
  }));
  if (worst <= 1) hits.push(day);
}
console.log(slug, "printed today:", d.meta.today.join(" "), "| days matching within 1 min:", hits.slice(0, 12).join(",") || "none");
