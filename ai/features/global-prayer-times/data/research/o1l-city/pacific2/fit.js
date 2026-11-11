// adhan 4.4.6 fit harness. Dates from literal capture strings, never the clock.
// Run with TZ pinned to the country zone: TZ=Pacific/Noumea node fit.js ...
const ADHAN = process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan';
const { Coordinates, CalculationMethod, PrayerTimes, Prayer, Madhab, Rounding, HighLatitudeRule } = require(ADHAN);

const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const PRAYER = { fajr: Prayer.Fajr, sunrise: Prayer.Sunrise, dhuhr: Prayer.Dhuhr, asr: Prayer.Asr, maghrib: Prayer.Maghrib, isha: Prayer.Isha };

function params(o) {
  const p = CalculationMethod.Other();
  p.fajrAngle = o.fajr;
  p.ishaAngle = o.ishaInterval ? 0 : o.isha;
  if (o.ishaInterval) p.ishaInterval = o.ishaInterval;
  if (o.maghribAngle) p.maghribAngle = o.maghribAngle;
  p.madhab = o.hanafi ? Madhab.Hanafi : Madhab.Shafi;
  p.highLatitudeRule = o.highLat === undefined ? HighLatitudeRule.MiddleOfTheNight : o.highLat;
  p.methodAdjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, ...(o.adj || {}) };
  p.rounding = Rounding.None;
  return p;
}

function timesFor(lat, lng, dateStr, o) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new PrayerTimes(new Coordinates(lat, lng), new Date(y, m - 1, d, 12), params(o));
}

function hm(date) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: process.env.TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

function fit(capture, lat, lng, o) {
  const res = {};
  for (const c of COLS) res[c] = { n: 0, exact: 0, w1: 0, sumAbs: 0, worst: 0 };
  for (const [date, row] of Object.entries(capture)) {
    const pt = timesFor(lat, lng, date, o);
    for (const c of COLS) {
      if (!row[c]) continue;
      const got = pt.timeForPrayer(PRAYER[c]);
      if (!got) continue;
      const [ch, cm] = row[c].split(':').map(Number);
      const [hh, mm] = hm(got).split(':').map(Number);
      let d = (ch * 60 + cm) - (hh * 60 + mm);
      if (d > 720) d -= 1440;
      if (d < -720) d += 1440;
      const r = res[c];
      r.n++; if (d === 0) r.exact++; if (Math.abs(d) <= 1) r.w1++;
      r.sumAbs += Math.abs(d);
      if (Math.abs(d) > Math.abs(r.worst)) r.worst = d;
    }
  }
  for (const c of COLS) {
    const r = res[c];
    r.mae = r.n ? +(r.sumAbs / r.n).toFixed(2) : null;
    r.exactPct = r.n ? +(100 * r.exact / r.n).toFixed(1) : null;
    r.w1Pct = r.n ? +(100 * r.w1 / r.n).toFixed(1) : null;
    delete r.sumAbs;
  }
  return res;
}

module.exports = { fit, timesFor, hm, COLS };
