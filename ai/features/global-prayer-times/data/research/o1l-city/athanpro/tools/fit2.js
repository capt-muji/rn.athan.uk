// Second stage: fit the platform's per-prayer minute adjustments on top of the recipe.
// The published tables of the authority-method class carry fixed column offsets (Habous dhuhr,
// JAKIM's minute conventions, a mosque's jamaat schedule). Fitting the offsets recovers the
// platform's own parameters instead of recording the page as a failure.
// Usage: node fit2.js <shard> <shards>
const fs = require("fs");
const path = require("path");
const {
  Coordinates, CalculationMethod, PrayerTimes, Madhab, Rounding,
} = require("$HOME/athan-gitree/census/adhan-build/node_modules/adhan");

const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "data");
const COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
const SCORE_COLS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const MAX_ADJ = 120;

const custom = (fa, ia) => () => { const p = CalculationMethod.Other(); p.fajrAngle = fa; p.ishaAngle = ia; return p; };
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
];
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

// Residuals in signed minutes, shortest way round the clock, so an adjustment can be read off.
function signed(a, b) { let d = ((a - b) % 1440 + 1440) % 1440; return d > 720 ? d - 1440 : d; }
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
      const got = localMinutes(pt[col], off);
      const d = diff(got, hhmm(rows[day][col]));
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
const SHARDS = Number(process.argv[3] || 1);
const fits = JSON.parse(fs.readFileSync(path.join(DATA, "fits.json"), "utf8"));
const out = [];
let done = 0;

fits.forEach((r, i) => {
  if (i % SHARDS !== SHARD) return;
  if ((r.pct || 0) >= 99.0) { out.push(r); return; }
  done++;
  if (done % 20 === 0) console.log(`shard ${SHARD}: ${done}`);
  const rows = JSON.parse(fs.readFileSync(path.join(DATA, `${r.cc}-${r.city}.json`), "utf8"));
  const dates = Object.keys(rows).sort();
  const { lat, lon, tz } = r;
  let best = null;
  const consider = (make, tag) => {
    const adj = residual(rows, dates, lat, lon, tz, make);
    const a = score(rows, dates, lat, lon, tz, make, adj);
    if (!best || a.within1 > best.a.within1 || (a.within1 === best.a.within1 && a.exact > best.a.exact)) {
      best = { a, tag, make, adj };
    }
  };
  const named = NAMED.find(([re]) => re.test(r.method || ""));
  if (named) { consider(named[1], `stated: ${r.method}`);
    consider(() => { const p = named[1](); p.madhab = Madhab.Hanafi; return p; }, `stated Hanafi: ${r.method}`); }
  for (const [tag, mk] of LADDER) {
    consider(mk, tag);
    consider(() => { const p = mk(); p.madhab = Madhab.Hanafi; return p; }, tag + " Hanafi");
  }
  if (best.a.within1 / best.a.n < 0.90 && r.source !== "mosque") {
    for (let fa = 14; fa <= 20.001; fa += 0.5) {
      for (let ia = 14; ia <= 19.001; ia += 0.5) {
        for (const han of [false, true]) {
          const mk = () => { const p = CalculationMethod.Other(); p.fajrAngle = fa; p.ishaAngle = ia;
            p.madhab = han ? Madhab.Hanafi : Madhab.Shafi; return p; };
          consider(mk, `sweep ${fa}/${ia} ${han ? "Hanafi" : "Shafi"}`);
        }
      }
    }
  }
  const a = best.a;
  r.recipe = best.tag;
  r.exact = a.exact; r.within1 = a.within1; r.n = a.n;
  r.pct = +(100 * a.within1 / a.n).toFixed(1);
  r.worst = a.worst;
  r.per = a.per;
  r.adjust = best.adj;
  out.push(r);
});

fs.writeFileSync(path.join(DATA, `fits2-${SHARD}.json`), JSON.stringify(out));
console.log(`shard ${SHARD}: ${out.length} records`);
