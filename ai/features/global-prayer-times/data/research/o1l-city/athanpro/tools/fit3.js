// Third stage: the high-latitude rule. Where the fitted twilight adjustment exceeds half an hour,
// the platform is not using the same night rule as adhan's default, and a constant offset is a
// wrong explanation. Try each published rule and keep the best.
// Usage: node fit3.js <shard> <shards>
const fs = require("fs");
const path = require("path");
const {
  Coordinates, CalculationMethod, PrayerTimes, Madhab, Rounding, HighLatitudeRule,
} = require("$HOME/athan-gitree/census/adhan-build/node_modules/adhan");

const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "data");
const COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
const SCORE_COLS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const MAX_ADJ = 120;
const custom = (fa, ia) => () => { const p = CalculationMethod.Other(); p.fajrAngle = fa; p.ishaAngle = ia; return p; };
const LADDER = [
  ["MWL 18/17", custom(18, 17)],
  ["Turkey 18/17", () => CalculationMethod.Turkey()],
  ["JAKIM 20/18", custom(20, 18)],
  ["Habous 19/17", custom(19, 17)],
  ["UAE 18.2/18.2", custom(18.2, 18.2)],
  ["Karachi 18/18", () => CalculationMethod.Karachi()],
  ["Egypt 19.5/17.5", () => CalculationMethod.Egyptian()],
  ["ISNA 15/15", () => CalculationMethod.NorthAmerica()],
  ["Kuwait 18/17.5", () => CalculationMethod.Kuwait()],
  ["Qatar 18/17", () => CalculationMethod.Qatar()],
  ["Singapore 20/18", () => CalculationMethod.Singapore()],
  ["Libya 18.5/18.5", custom(18.5, 18.5)],
  ["UMAM 14/14", custom(14, 14)],
  ["UmmAlQura", () => CalculationMethod.UmmAlQura()],
];
const RULES = [
  ["MidNight", HighLatitudeRule.MiddleOfTheNight],
  ["Seventh", HighLatitudeRule.SeventhOfTheNight],
  ["Angle", HighLatitudeRule.TwilightAngle],
];

function tzOffset(date, tz) {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour12: false, year: "numeric",
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const p = Object.fromEntries(f.formatToParts(date).filter((x) => x.type !== "literal")
    .map((x) => [x.type, x.value]));
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return Math.round((asUTC - date.getTime()) / 60000);
}
const localMinutes = (date, offMin) => Math.round((date.getTime() / 60000 + offMin + 1440 * 10) % 1440);
const hhmm = (v) => { const [h, m] = v.split(":").map(Number); return h * 60 + m; };
function diff(a, b) { const d = Math.abs(a - b) % 1440; return Math.min(d, 1440 - d); }
function signed(a, b) { const d = ((a - b) % 1440 + 1440) % 1440; return d > 720 ? d - 1440 : d; }
const median = (xs) => { const s = [...xs].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

function residual(rows, dates, lat, lon, tz, make) {
  const c = new Coordinates(lat, lon);
  const acc = {}; for (const col of COLS) acc[col] = [];
  for (const day of dates) {
    const date = new Date(day + "T00:00:00Z");
    const off = tzOffset(date, tz);
    const p = make(); p.rounding = Rounding.None;
    const pt = new PrayerTimes(c, date, p);
    for (const col of COLS) acc[col].push(signed(hhmm(rows[day][col]), localMinutes(pt[col], off)));
  }
  const out = {};
  for (const col of COLS) out[col] = Math.max(-MAX_ADJ, Math.min(MAX_ADJ, median(acc[col])));
  return out;
}

function score(rows, dates, lat, lon, tz, make, adj) {
  const c = new Coordinates(lat, lon);
  const agg = { exact: 0, within1: 0, worst: 0, n: 0, per: {} };
  for (const col of COLS) agg.per[col] = { exact: 0, within1: 0, worst: 0 };
  for (const day of dates) {
    const date = new Date(day + "T00:00:00Z");
    const off = tzOffset(date, tz);
    const p = make(); p.rounding = Rounding.None;
    if (adj) { p.adjustments.fajr = adj.fajr; p.adjustments.sunrise = adj.sunrise; p.adjustments.dhuhr = adj.dhuhr;
      p.adjustments.asr = adj.asr; p.adjustments.maghrib = adj.maghrib; p.adjustments.isha = adj.isha; }
    const pt = new PrayerTimes(c, date, p);
    for (const col of COLS) {
      const d = diff(localMinutes(pt[col], off), hhmm(rows[day][col]));
      const s = agg.per[col];
      s.worst = Math.max(s.worst, d);
      if (d === 0) s.exact++;
      if (d <= 1) s.within1++;
      if (SCORE_COLS.includes(col)) {
        agg.worst = Math.max(agg.worst, d);
        if (d === 0) agg.exact++;
        if (d <= 1) agg.within1++;
        agg.n++;
      }
    }
  }
  return agg;
}

const SHARD = Number(process.argv[2] || 0);
const SHARDS = Number(process.argv[3] || 0) || 1;
const fits = JSON.parse(fs.readFileSync(path.join(DATA, "fits.json"), "utf8"));
const out = [];
let done = 0;

fits.forEach((r, i) => {
  if (i % SHARDS !== SHARD) return;
  const a = r.adjust;
  const big = a && (Math.abs(a.fajr) > 30 || Math.abs(a.isha) > 30);
  // Morocco's uniform shift is a clock, not a night rule; it stays with stage two.
  if (!big || r.cc === "morocco" || r.cc === "western-sahara") { out.push(r); return; }
  done++;
  const rows = JSON.parse(fs.readFileSync(path.join(DATA, `${r.cc}-${r.city}.json`), "utf8"));
  const dates = Object.keys(rows).sort();
  const { lat, lon, tz } = r;
  let best = null;
  const consider = (make, tag) => {
    const adj = residual(rows, dates, lat, lon, tz, make);
    const sc = score(rows, dates, lat, lon, tz, make, adj);
    if (!best || sc.within1 > best.a.within1 || (sc.within1 === best.a.within1 && sc.exact > best.a.exact)) {
      best = { a: sc, tag, adj };
    }
  };
  for (const [rname, rule] of RULES) {
    for (const [tag, mk] of LADDER) {
      for (const han of [false, true]) {
        consider(() => { const p = mk(); p.madhab = han ? Madhab.Hanafi : Madhab.Shafi;
          p.highLatitudeRule = rule; return p; }, `${tag} ${han ? "Hanafi" : "Shafi"} ${rname}`);
      }
    }
  }
  if (best.a.within1 / best.a.n >= r.pct / 100) {
    r.recipe = best.tag;
    r.exact = best.a.exact; r.within1 = best.a.within1; r.n = best.a.n;
    r.pct = +(100 * best.a.within1 / best.a.n).toFixed(1);
    r.worst = best.a.worst;
    r.per = best.a.per;
    r.adjust = best.adj;
    r.rule = best.tag.split(" ").pop();
  }
  out.push(r);
});

fs.writeFileSync(path.join(DATA, `fits3-${SHARD}.json`), JSON.stringify(out));
console.log(`shard ${SHARD}: ${out.length} records, ${done} re-fitted`);
