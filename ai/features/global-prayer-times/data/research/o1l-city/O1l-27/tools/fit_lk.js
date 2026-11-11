const adhan = require(process.env.HOME + "/athan-gitree/census/adhan-build/node_modules/adhan");
const fs = require("fs");
const path = require("path");

const DATA = path.join(__dirname, "..", "data", "lk-zones-2026.json");
const zones = JSON.parse(fs.readFileSync(DATA, "utf8"));

// district-capital reference points, the ACJU zone names' own anchors
const REF = {
  "09": { name: "Trincomalee", lat: 8.5874, lon: 81.2152 },
  "12": { name: "Galle/Matara", lat: 6.0535, lon: 80.2210 },
};

function toMin(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function raw(lat, lon, dateStr) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  // local civil date -> UTC instant for the calculation day, TZ pinned Asia/Colombo (+05:30)
  const utcMs = Date.UTC(y, mo - 1, d, 12, 0, 0) - 5.5 * 3600 * 1000;
  const date = new Date(utcMs);
  const c = new adhan.Coordinates(lat, lon);
  const p = new adhan.CalculationParameters();
  p.method = null;
  p.fajrAngle = 19.75;
  p.ishaAngle = 18.2;
  p.madhab = adhan.Madhab.Shafi;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  p.rounding = adhan.Rounding.None;
  p.adjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  const t = new adhan.PrayerTimes(c, date, p);
  const midnight = Date.UTC(y, mo - 1, d, 0, 0, 0) - 5.5 * 3600 * 1000;
  const f = (x) => (x.getTime() - midnight) / 60000; // minutes after local midnight
  return {
    fajr: f(t.fajr), sunrise: f(t.sunrise), dhuhr: f(t.dhuhr),
    asr: f(t.asr), maghrib: f(t.maghrib), isha: f(t.isha),
  };
}

function residualSet(lat, lon, rows, col, key) {
  const out = [];
  for (const [dateStr, v] of Object.entries(rows)) {
    const r = raw(lat, lon, dateStr);
    out.push(toMin(v[key]) - r[col]);
  }
  return out;
}

function stats(a) {
  const n = a.length;
  const mean = a.reduce((s, x) => s + x, 0) / n;
  const sd = Math.sqrt(a.reduce((s, x) => s + (x - mean) ** 2, 0) / n);
  return { mean, sd, rms: Math.sqrt(a.reduce((s, x) => s + x * x, 0) / n), min: Math.min(...a), max: Math.max(...a) };
}

const report = {};
for (const z of Object.keys(zones)) {
  const rows = zones[z];
  const ref = REF[z];
  const res = {};
  res.zone = z;
  res.ref = ref;
  res.rows = Object.keys(rows).length;
  for (const [col, key] of [["fajr", "fajr"], ["sunrise", "sunrise"], ["dhuhr", "dhuhr"], ["asr", "asr_shafie"], ["asr", "asr_hanafi"], ["maghrib", "maghrib"], ["isha", "isha"]]) {
    const label = col === "asr" ? key : col;
    res[label] = stats(residualSet(ref.lat, ref.lon, rows, col, key));
  }
  // angle refit for the twilights at the reference point
  for (const [col, key] of [["fajr", "fajr"], ["isha", "isha"]]) {
    let best = null;
    for (let a = 15.0; a <= 22.0; a += 0.01) {
      const arr = [];
      for (const [dateStr, v] of Object.entries(rows)) {
        const r = rawAtAngle(ref.lat, ref.lon, dateStr, col, a);
        arr.push(toMin(v[key]) - r);
      }
      const m = arr.reduce((s, x) => s + x, 0) / arr.length;
      const rms = Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length);
      if (!best || rms < best.rms) best = { angle: +a.toFixed(2), mean: +m.toFixed(2), rms: +rms.toFixed(2) };
    }
    res[col + "_refit"] = best;
  }
  report[z] = res;
}

function rawAtAngle(lat, lon, dateStr, which, angle) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0) - 5.5 * 3600 * 1000);
  const p = new adhan.CalculationParameters();
  p.method = null;
  p.fajrAngle = which === "fajr" ? angle : 19.75;
  p.ishaAngle = which === "isha" ? angle : 18.2;
  p.madhab = adhan.Madhab.Shafi;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  p.rounding = adhan.Rounding.None;
  p.adjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  const t = new adhan.PrayerTimes(new adhan.Coordinates(lat, lon), date, p);
  const midnight = Date.UTC(y, mo - 1, d, 0, 0, 0) - 5.5 * 3600 * 1000;
  return (t[which].getTime() - midnight) / 60000;
}

fs.writeFileSync(path.join(__dirname, "..", "data", "lk-zones-fit.json"), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
