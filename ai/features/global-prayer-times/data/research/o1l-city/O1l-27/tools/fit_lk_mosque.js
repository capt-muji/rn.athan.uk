const adhan = require(process.env.HOME + "/athan-gitree/census/adhan-build/node_modules/adhan");
const fs = require("fs");
const path = require("path");

const OFF = 5.5 * 3600 * 1000; // Asia/Colombo, no DST
const ANCHOR = 2028; // mawaqit emits a leap-anchored 366-day template

const SITES = {
  kollupitiya: { name: "KOLLUPITIYA JUMMAH MASJID, Colombo 03", lat: 6.9130350395841, lon: 79.850725103278 },
  alhassan: { name: "Al-Hassan Masjid, Colombo 03", lat: 6.900706435598, lon: 79.851407557726 },
  aruppola: { name: "Masjidus Saif Aruppola Jummah Masjid, Kandy", lat: 7.3112059, lon: 80.6431906 },
};

const COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

function build(lat, lon, y, mo, d, fajrAngle, ishaAngle, adjustments) {
  const date = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0) - OFF);
  const p = new adhan.CalculationParameters();
  p.method = null;
  p.fajrAngle = fajrAngle;
  p.ishaAngle = ishaAngle;
  p.madhab = adhan.Madhab.Shafi;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  p.rounding = adhan.Rounding.None;
  p.adjustments = adjustments;
  const t = new adhan.PrayerTimes(new adhan.Coordinates(lat, lon), date, p);
  const mid = Date.UTC(y, mo - 1, d, 0, 0, 0) - OFF;
  const f = (x) => (x.getTime() - mid) / 60000;
  return { fajr: f(t.fajr), sunrise: f(t.sunrise), dhuhr: f(t.dhuhr), asr: f(t.asr), maghrib: f(t.maghrib), isha: f(t.isha) };
}

const toMin = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };

function rows(site) {
  const cal = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", `lk-mawaqit-${site}-calendar.json`), "utf8"));
  const out = [];
  for (let mi = 0; mi < 12; mi++) {
    for (const [day, vals] of Object.entries(cal[mi])) {
      out.push({ y: ANCHOR, mo: mi + 1, d: Number(day), vals });
    }
  }
  return out;
}

function resid(site, cfg) {
  const s = SITES[site];
  const acc = {};
  for (const c of COLS) acc[c] = [];
  for (const r of rows(site)) {
    const cmp = build(s.lat, s.lon, r.y, r.mo, r.d, cfg.fajrAngle, cfg.ishaAngle, cfg.adjustments);
    for (const c of COLS) acc[c].push(toMin(r.vals[COLS.indexOf(c)]) - cmp[c]);
  }
  return acc;
}

function stat(a) {
  const n = a.length;
  const mean = a.reduce((x, y) => x + y, 0) / n;
  const sd = Math.sqrt(a.reduce((x, y) => x + (y - mean) ** 2, 0) / n);
  return { mean: +mean.toFixed(2), sd: +sd.toFixed(2), min: +Math.min(...a).toFixed(2), max: +Math.max(...a).toFixed(2) };
}

const zero = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
const report = {};

for (const site of Object.keys(SITES)) {
  const out = { site: SITES[site].name, rows: rows(site).length, anchor: ANCHOR };
  // named-pair test: MWL 18/17 Shafi, zero margins
  const mwl = resid(site, { fajrAngle: 18, ishaAngle: 17, adjustments: zero });
  out.mwl_18_17 = Object.fromEntries(COLS.map((c) => [c, stat(mwl[c])]));
  // angle refit on the twilights, no margin
  for (const [col, key] of [["fajr", "fajrAngle"], ["isha", "ishaAngle"]]) {
    let best = null;
    for (let a = 14; a <= 22; a += 0.01) {
      const cfg = { fajrAngle: col === "fajr" ? a : 18, ishaAngle: col === "isha" ? a : 17, adjustments: zero };
      const rr = resid(site, cfg)[col];
      const m = rr.reduce((x, y) => x + y, 0) / rr.length;
      const sd = Math.sqrt(rr.reduce((x, y) => x + (y - m) ** 2, 0) / rr.length);
      if (!best || sd < best.sd) best = { angle: +a.toFixed(2), mean: +m.toFixed(2), sd: +sd.toFixed(2) };
    }
    out[col + "_refit"] = best;
  }
  report[site] = out;
}

fs.writeFileSync(path.join(__dirname, "..", "data", "lk-mawaqit-fit.json"), JSON.stringify(report, null, 1));
for (const [s, r] of Object.entries(report)) {
  console.log(`\n== ${s}: ${r.site}  ${r.rows} rows (anchor ${r.anchor})`);
  for (const c of COLS) {
    const x = r.mwl_18_17[c];
    console.log(`   ${c.padEnd(8)} mean ${String(x.mean).padStart(7)} sd ${String(x.sd).padStart(5)} range ${x.min}..${x.max}`);
  }
  console.log("   refit fajr", JSON.stringify(r.fajr_refit), " isha", JSON.stringify(r.isha_refit));
}
