// Fit an athanpro month table at its own coordinates, in the page's own stated UTC offset.
// Engine: adhan 4.4.6, Rounding.None at second resolution, explicit minute rounding per column.
// The offset is a literal in the capture; the clock is never read. A solar gate runs first:
// a table whose dhuhr is not solar noon at the page's coordinates is a defect, not coverage.
const fs = require("fs");
const path = require("path");
const { Coordinates, CalculationMethod, PrayerTimes, Madhab, Rounding, SolarTime } =
  require("$HOME/athan-gitree/census/adhan-build/node_modules/adhan");

const DATA = path.join(__dirname, "..", "data");
const TZ = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "tz.json"), "utf8"));

// The page prints a fixed offset label; the table itself is true local wall clock.
// Take the offset per date from the IANA zone instead of the label.
function tzOffset(date, tz) {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour12: false, year: "numeric",
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const p = Object.fromEntries(f.formatToParts(date).filter((x) => x.type !== "literal")
    .map((x) => [x.type, x.value]));
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return Math.round((asUTC - date.getTime()) / 60000);
}
const COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

function offMinutes(offset) {
  const m = /^([+-])(\d{2}):(\d{2})$/.exec(offset);
  if (!m) return 0;
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}
function localMinutes(date, offMin) {
  return Math.round((date.getTime() / 60000 + offMin + 1440 * 10) % 1440);
}
function hhmm(v) {
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
}
function diff(a, b) {
  let d = Math.abs(a - b) % 1440;
  return Math.min(d, 1440 - d);
}

function score(rows, lat, lon, offMin, fajrAngle, ishaAngle, hanafi) {
  const c = new Coordinates(lat, lon);
  const agg = { exact: 0, within1: 0, worst: 0, n: 0, per: {} };
  for (const col of COLS) agg.per[col] = { exact: 0, within1: 0, worst: 0 };
  for (const [day, row] of Object.entries(rows)) {
    const params = CalculationMethod.MuslimWorldLeague();
    params.fajrAngle = fajrAngle;
    params.ishaAngle = ishaAngle;
    params.rounding = Rounding.None;
    const pt = new PrayerTimes(c, new Date(day + "T00:00:00Z"), params);
    pt.madhab = hanafi ? Madhab.Hanafi : Madhab.Shafi;
    const got = {};
    for (const col of COLS) got[col] = localMinutes(pt[col], offMin);
    for (const col of COLS) {
      const d = diff(got[col], hhmm(row[col]));
      const s = agg.per[col];
      s.worst = Math.max(s.worst, d);
      if (d === 0) s.exact++;
      if (d <= 1) s.within1++;
      if (col !== "sunrise") {
        agg.worst = Math.max(agg.worst, d);
        if (d === 0) agg.exact++;
        if (d <= 1) agg.within1++;
        agg.n++;
      }
    }
  }
  return agg;
}

function solarGate(rows, lat, lon, offMin) {
  let worst = 0;
  for (const [day, row] of Object.entries(rows)) {
    const c = new Coordinates(lat, lon);
    const params = CalculationMethod.MuslimWorldLeague();
    params.rounding = Rounding.None;
    const pt = new PrayerTimes(c, new Date(day + "T00:00:00Z"), params);
    worst = Math.max(worst, diff(localMinutes(pt.dhuhr, offMin), hhmm(row.dhuhr)));
  }
  return worst;
}

const out = {};
const files = fs.readdirSync(DATA).filter((x) => x.startsWith("athanpro-") && x.endsWith(".json"));
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"));
  const [lat, lon] = (d.meta.coord || []).map(Number);
  const tz = TZ[f.split("-")[1]];
  const offMin = tz ? tzOffset(new Date("2026-09-01T12:00:00Z"), tz) : offMinutes(d.meta.offset || "");
  if (!lat || !lon) { out[f] = { err: "no-coords" }; continue; }
  const gate = solarGate(d.rows, lat, lon, offMin);
  if (gate > 20) { out[f] = { err: `solar-gate ${gate}m`, city: d.meta.city, lat, lon, offset: d.meta.offset }; continue; }
  let best = null;
  for (let fa = 14; fa <= 20.0001; fa += 0.5) {
    for (let ia = 14; ia <= 19.0001; ia += 0.5) {
      for (const hanafi of [false, true]) {
        const s = score(d.rows, lat, lon, offMin, fa, ia, hanafi);
        if (!best || s.within1 > best.s.within1 || (s.within1 === best.s.within1 && s.exact > best.s.exact))
          best = { s, fa, ia, hanafi };
      }
    }
  }
  const days = Object.keys(d.rows).sort();
  const fajrSpan = Math.max(...days.map((x) => hhmm(d.rows[x].fajr))) -
    Math.min(...days.map((x) => hhmm(d.rows[x].fajr)));
  out[f] = {
    city: d.meta.city, cc: f.split("-")[1], methodLabel: d.meta.method, lat, lon,
    offsetLabel: d.meta.offset, tz, offsetUsed: offMin, solarGate: gate, rows: days.length,
    span: days[0] + ".." + days[days.length - 1], weekdayAgree: d.meta.weekday_agree,
    recipe: { fajrAngle: best.fa, ishaAngle: best.ia, asrSchool: best.hanafi ? "Hanafi" : "Shafi" },
    joint: { exact: best.s.exact, within1: best.s.within1, of: best.s.n, worst: best.s.worst },
    per: best.s.per, monthFajrSpread: fajrSpan, todayBlock: d.meta.today,
  };
}
fs.writeFileSync(path.join(DATA, "..", "fits-athanpro.json"), JSON.stringify(out, null, 1));
let pass = 0, fail = [];
for (const [k, v] of Object.entries(out)) {
  if (v.err) { fail.push(`${v.city || k}: ${v.err}`); continue; }
  const pc = (100 * v.joint.within1) / v.joint.of;
  if (pc >= 99) pass++;
  console.log(`${v.cc} ${(v.city || "").padEnd(20)} ${v.rows}d ${v.span} tz ${v.tz} (${v.offsetUsed}) gate ${v.solarGate}m | fajr ${v.recipe.fajrAngle} isha ${v.recipe.ishaAngle} ${v.recipe.asrSchool} | joint ${v.joint.exact}/${v.joint.within1} of ${v.joint.of} (${pc.toFixed(1)}pc) worst ${v.joint.worst} | ${v.methodLabel}`);
}
console.log(`\n${files.length} pages, ${pass} reproduce within-1 at 99pc+, ${fail.length} closed by the solar gate`);
for (const f of fail) console.log("  GATE FAIL", f);
