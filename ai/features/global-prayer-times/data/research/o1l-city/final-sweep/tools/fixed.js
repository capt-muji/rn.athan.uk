// Score one athanpro month at a FIXED recipe, so a scan's choice can be checked and a
// near-equator degeneracy can be reported as such instead of hidden.
// argv: datafile tz fajr isha [hanafi]
const fs = require("fs");
const { Coordinates, CalculationMethod, PrayerTimes, Madhab, Rounding } = require(
  "$HOME/athan-gitree/census/adhan-build/node_modules/adhan");

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

const [file, tz, fa, ia, hanafi] = process.argv.slice(2);
const d = JSON.parse(fs.readFileSync(file, "utf8"));
const c = new Coordinates(...(d.meta.coord || []).map(Number));
const per = {}; COLS.forEach((x) => (per[x] = { exact: 0, within1: 0, within2: 0, worst: 0 }));
let e = 0, w = 0, n = 0, worst = 0;
for (const [day, r] of Object.entries(d.rows)) {
  const off = tzOffset(new Date(day + "T12:00:00Z"), tz);
  const p = CalculationMethod.MuslimWorldLeague();
  p.fajrAngle = +fa; p.ishaAngle = +ia; p.rounding = Rounding.None;
  const pt = new PrayerTimes(c, new Date(day + "T00:00:00Z"), p);
  pt.madhab = hanafi ? Madhab.Hanafi : Madhab.Shafi;
  for (const col of COLS) {
    const got = Math.round((pt[col].getTime() / 60000 + off + 1440 * 10) % 1440);
    const dd = diff(got, hhmm(r[col]));
    per[col].worst = Math.max(per[col].worst, dd);
    if (dd === 0) per[col].exact++;
    if (dd <= 1) per[col].within1++;
    if (dd <= 2) per[col].within2++;
    if (col !== "sunrise") { worst = Math.max(worst, dd); if (dd === 0) e++; if (dd <= 1) w++; n++; }
  }
}
console.log(JSON.stringify({ file: file.split("/").pop(), tz, recipe: `${fa}/${ia}${hanafi ? "H" : "S"}`,
  joint: `${e}/${w} of ${n}`, pct: +(100 * w / n).toFixed(1), worst, per }, null, 1));
