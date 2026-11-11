// Fit athanpro's September-2026 month tables at the coordinates the table itself was built on.
// Engine: adhan 4.4.6, Rounding.None at second resolution, explicit minute rounding per column.
// Offset per date comes from the IANA zone the page names, never from its printed label.
// A solar gate runs first: a table whose dhuhr is not solar noon at its own point is a defect.
// Usage: node fit.js <shard> <shards>
const fs = require("fs");
const path = require("path");
const {
  Coordinates, CalculationMethod, PrayerTimes, Madhab, Rounding,
} = require("$HOME/athan-gitree/census/adhan-build/node_modules/adhan");
const SolarTime = require("$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/SolarTime.js").default;

const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "data");
const COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
const SCORE_COLS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const custom = (fa, ia) => () => { const p = CalculationMethod.Other(); p.fajrAngle = fa; p.ishaAngle = ia; return p; };

// Named recipes the platform states, matched by substring (page labels carry broken accents).
const NAMED = [
  [/muslim world league/i, () => CalculationMethod.MuslimWorldLeague()],
  [/diyanet|turkey/i, () => CalculationMethod.Turkey()],
  [/jakim/i, custom(20, 18)],
  [/moroccan|habous/i, custom(19, 17)],
  [/uae|general authority/i, custom(18.2, 18.2)],
  [/libya/i, custom(18.5, 18.5)],
  [/brunei/i, custom(20, 18)],
  [/umam/i, custom(14, 14)],
  [/singapore|muis/i, () => CalculationMethod.Singapore()],
  [/umm al-qura/i, () => CalculationMethod.UmmAlQura()],
  [/karachi/i, () => CalculationMethod.Karachi()],
  [/egypt/i, () => CalculationMethod.Egyptian()],
  [/kuwait/i, () => CalculationMethod.Kuwait()],
  [/qatar/i, () => CalculationMethod.Qatar()],
  [/tehran/i, () => CalculationMethod.Tehran()],
  [/dubai/i, () => CalculationMethod.Dubai()],
  [/north america|isna/i, () => CalculationMethod.NorthAmerica()],
  [/moonsighting/i, () => CalculationMethod.MoonsightingCommittee()],
];

// The ladder every page is tested against, so a stated label never decides the recipe alone.
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

function scoreCity(rows, dates, lat, lon, tz, makeParams) {
  const c = new Coordinates(lat, lon);
  const agg = { exact: 0, within1: 0, worst: 0, n: 0, per: {} };
  for (const col of COLS) agg.per[col] = { exact: 0, within1: 0, worst: 0 };
  for (const day of dates) {
    const date = new Date(day + "T00:00:00Z");
    const offMin = tzOffset(date, tz);
    const params = makeParams();
    params.rounding = Rounding.None;
    const pt = new PrayerTimes(c, date, params);
    const row = rows[day];
    for (const col of COLS) {
      const got = localMinutes(pt[col], offMin);
      const d = diff(got, hhmm(row[col]));
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

function solarGate(rows, dates, lat, lon, tz) {
  const c = new Coordinates(lat, lon);
  let worst = 0;
  for (const day of dates) {
    const date = new Date(day + "T00:00:00Z");
    const offMin = tzOffset(date, tz);
    const noon = Math.round((new SolarTime(date, c).transit * 60 + offMin + 1440 * 10) % 1440);
    worst = Math.max(worst, diff(noon, hhmm(rows[day].dhuhr)));
  }
  return worst;
}

const SHARD = Number(process.argv[2] || 0);
const SHARDS = Number(process.argv[3] || 1);
const index = JSON.parse(fs.readFileSync(path.join(DATA, "index.json"), "utf8"));
const out = [];
let done = 0;

index.forEach((rec, i) => {
  if (i % SHARDS !== SHARD) return;
  const rows = JSON.parse(fs.readFileSync(path.join(DATA, `${rec.country_slug}-${rec.city_slug}.json`), "utf8"));
  const dates = Object.keys(rows).sort();
  const lat = Number(rec.table_lat ?? rec.lat);
  const lon = Number(rec.table_lon ?? rec.lon);
  const tz = rec.tz;
  const res = { cc: rec.country_slug, city: rec.city_slug, name: rec.city, country: rec.country,
    lat, lon, tz, tz_label: rec.country_tz_label, rows: dates.length,
    span: [dates[0], dates[dates.length - 1]],
    method: rec.method, source: rec.source, month: rec.month, year: rec.year,
    weekday_align: rec.weekday_align, json_paint_agree: rec.json_paint_agree,
    paint_rows: rec.paint_rows, adjustments: rec.adjustments };
  done++;
  if (done % 25 === 0) console.log(`shard ${SHARD}: ${done}`);

  if (!tz || !Number.isFinite(lat) || !Number.isFinite(lon)) { res.err = "no-geo"; out.push(res); return; }
  try { res.solar = solarGate(rows, dates, lat, lon, tz); }
  catch (e) { res.err = "solar:" + e.message; out.push(res); return; }

  let best = null;
  const tryRecipe = (make, tag) => {
    const a = scoreCity(rows, dates, lat, lon, tz, make);
    if (!best || a.within1 > best.a.within1 || (a.within1 === best.a.within1 && a.exact > best.a.exact)) {
      best = { a, tag, make };
    }
    return a;
  };

  const named = NAMED.find(([re]) => re.test(rec.method || ""));
  if (named) {
    tryRecipe(named[1], `stated: ${rec.method}`);
    tryRecipe(() => { const p = named[1](); p.madhab = Madhab.Hanafi; return p; }, `stated Hanafi: ${rec.method}`);
  }
  for (const [tag, mk] of LADDER) {
    tryRecipe(mk, tag);
    tryRecipe(() => { const p = mk(); p.madhab = Madhab.Hanafi; return p; }, tag + " Hanafi");
  }
  if (!best || best.a.within1 / best.a.n < 0.99) {
    for (let fa = 14; fa <= 20.001; fa += 0.25) {
      for (let ia = 14; ia <= 19.001; ia += 0.25) {
        for (const han of [false, true]) {
          tryRecipe(() => {
            const p = CalculationMethod.Other();
            p.fajrAngle = fa; p.ishaAngle = ia;
            p.madhab = han ? Madhab.Hanafi : Madhab.Shafi;
            return p;
          }, `sweep ${fa}/${ia} ${han ? "Hanafi" : "Shafi"}`);
        }
      }
    }
  }

  const a = best.a;
  res.recipe = best.tag;
  res.exact = a.exact; res.within1 = a.within1; res.n = a.n;
  res.pct = +(100 * a.within1 / a.n).toFixed(1);
  res.worst = a.worst;
  res.per = a.per;
  // Seasonal amplitude from the fitted recipe, model-derived: one month is held, not a year.
  try {
    const mk = best.make;
    const c = new Coordinates(lat, lon);
    const at = (d) => {
      const date = new Date(d + "T00:00:00Z");
      const off = tzOffset(date, tz);
      const q = mk(); q.rounding = Rounding.None;
      const pt = new PrayerTimes(c, date, q);
      return { fajr: localMinutes(pt.fajr, off), isha: localMinutes(pt.isha, off) };
    };
    const jan = at(`${res.year}-01-15`), jul = at(`${res.year}-07-15`);
    res.amp = { fajrJanJul: Math.abs(jul.fajr - jan.fajr), ishaJanJul: Math.abs(jul.isha - jan.isha) };
  } catch (e) { res.amp = null; }
  out.push(res);
});

fs.writeFileSync(path.join(DATA, `fits-${SHARD}.json`), JSON.stringify(out));
console.log(`shard ${SHARD}: ${out.length} cities`);
