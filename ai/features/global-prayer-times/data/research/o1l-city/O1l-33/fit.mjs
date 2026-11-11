import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const { Coordinates, PrayerTimes, CalculationMethod, Madhab, Rounding, HighLatitudeRule } = adhan;

const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

function fmt(date, tz) {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit' }).formatToParts(date);
  const h = p.find((x) => x.type === 'hour').value;
  const m = p.find((x) => x.type === 'minute').value;
  return Number(h) * 60 + Number(m);
}

function base(rows, lat, lon, tz) {
  const coords = new Coordinates(lat, lon);
  return rows.map((r) => {
    const [y, mo, d] = r.date.split('-').map(Number);
    const date = new Date(Date.UTC(y, mo - 1, d, 12));
    const params = CalculationMethod.Other();
    params.fajrAngle = 18; params.ishaAngle = 17;
    params.madhab = Madhab.Shafi;
    params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
    params.rounding = Rounding.None;
    const pt = new PrayerTimes(coords, date, params);
    return {
      date: r.date,
      pub: { fajr: toMin(r.fajr), sunrise: toMin(r.sunrise), dhuhr: toMin(r.dhuhr), asr: toMin(r.asr), maghrib: toMin(r.maghrib), isha: toMin(r.isha) },
      sun: { sunrise: fmt(pt.sunrise, tz), dhuhr: fmt(pt.dhuhr, tz), sunset: fmt(pt.maghrib, tz), asrShafi: fmt(pt.asr, tz) },
    };
  });
}

// angle sweep for a prayer whose time depends only on its own angle
function sweepAngle(days, lat, lon, tz, which) {
  const coords = new Coordinates(lat, lon);
  const best = [];
  for (let a = 10; a <= 22.0001; a += 0.05) {
    let se = 0, n = 0;
    for (const d of days) {
      const [y, mo, dd] = d.date.split('-').map(Number);
      const date = new Date(Date.UTC(y, mo - 1, dd, 12));
      const params = CalculationMethod.Other();
      params.fajrAngle = which === 'fajr' ? a : 18;
      params.ishaAngle = which === 'isha' ? a : 17;
      params.madhab = Madhab.Shafi;
      params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
      params.rounding = Rounding.None;
      const pt = new PrayerTimes(coords, date, params);
      const t = fmt(which === 'fajr' ? pt.fajr : pt.isha, tz);
      let e = Math.abs(t - d.pub[which]);
      if (e > 720) e = 1440 - e;
      se += e; n++;
    }
    best.push({ angle: Number(a.toFixed(2)), mae: se / n });
  }
  best.sort((x, y) => x.mae - y.mae);
  return best.slice(0, 4);
}

function scoreColumn(days, key, model, conv) {
  let exact = 0, w1 = 0, worst = 0, se = 0, n = 0;
  const resid = [];
  for (const d of days) {
    let pred = model(d);
    if (pred == null) continue;
    let pub = d.pub[key];
    if (conv === 'floor') pred = Math.floor(pred);
    else pred = Math.round(pred);
    let e = pub - pred;
    if (e > 720) e -= 1440;
    if (e < -720) e += 1440;
    resid.push(e);
    if (e === 0) exact++;
    if (Math.abs(e) <= 1) w1++;
    if (Math.abs(e) > Math.abs(worst)) worst = e;
    se += Math.abs(e); n++;
  }
  return { exact, within1: w1, worst, mae: +(se / n).toFixed(2), n, median: resid.sort((a, b) => a - b)[Math.floor(n / 2)] };
}

const files = process.argv.slice(2);
const report = [];
for (const f of files) {
  const src = JSON.parse(fs.readFileSync(f, 'utf8'));
  const tz = src.timezone;
  const days = base(src.rows, src.latitude, src.longitude, tz);
  const fajrFit = sweepAngle(days, src.latitude, src.longitude, tz, 'fajr');
  const ishaFit = sweepAngle(days, src.latitude, src.longitude, tz, 'isha');

  // offsets vs astronomical events
  const dhOff = days.map((d) => d.pub.dhuhr - d.sun.dhuhr).sort((a, b) => a - b);
  const mgOff = days.map((d) => d.pub.maghrib - d.sun.sunset).sort((a, b) => a - b);
  const srOff = days.map((d) => d.pub.sunrise - d.sun.sunrise).sort((a, b) => a - b);
  const asrOff = days.map((d) => d.pub.asr - d.sun.asrShafi).sort((a, b) => a - b);
  const med = (a) => a[Math.floor(a.length / 2)];

  const rec = {
    file: path.basename(f),
    source: src.source,
    lat: src.latitude, lon: src.longitude, tz,
    rows: src.rows_total,
    live_page_gate: src.live_page_gate,
    fajr_angle: fajrFit,
    isha_angle: ishaFit,
    offsets_median: { sunrise: med(srOff), dhuhr: med(dhOff), asr_shafi: med(asrOff), maghrib: med(mgOff) },
    offsets_range: {
      sunrise: [srOff[0], srOff[srOff.length - 1]],
      dhuhr: [dhOff[0], dhOff[dhOff.length - 1]],
      maghrib: [mgOff[0], mgOff[mgOff.length - 1]],
      asr: [asrOff[0], asrOff[asrOff.length - 1]],
    },
  };
  // full-column scores with the best angle pair and integer offsets
  const fa = fajrFit[0].angle, ia = ishaFit[0].angle;
  const dh = Math.round(med(dhOff)), mg = Math.round(med(mgOff));
  const params = CalculationMethod.Other();
  params.fajrAngle = fa; params.ishaAngle = ia; params.madhab = Madhab.Shafi;
  params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight; params.rounding = Rounding.None;
  const coords = new Coordinates(src.latitude, src.longitude);
  const model = (d) => {
    const [y, mo, dd] = d.date.split('-').map(Number);
    const pt = new PrayerTimes(coords, new Date(Date.UTC(y, mo - 1, dd, 12)), params);
    return {
      fajr: fmt(pt.fajr, tz), sunrise: fmt(pt.sunrise, tz) , dhuhr: fmt(pt.dhuhr, tz) + dh,
      asr: fmt(pt.asr, tz), maghrib: fmt(pt.maghrib, tz) + mg, isha: fmt(pt.isha, tz),
    };
  };
  rec.recipe = { fajr_angle: fa, isha_angle: ia, asr: 'Shafi', dhuhr_offset: dh, maghrib_offset: mg, rounding: 'nearest-minute' };
  rec.scores = {};
  for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    rec.scores[k] = scoreColumn(days, k, (d) => model(d)[k]);
  }
  // seasonal amplitude (Jan vs Jul fajr, published)
  const jan = days.filter((d) => d.date.slice(5, 7) === '01').map((d) => d.pub.fajr);
  const jul = days.filter((d) => d.date.slice(5, 7) === '07').map((d) => d.pub.fajr);
  rec.amplitude_fajr_min = Math.max(...jan) - Math.min(...jul);
  report.push(rec);
}
fs.writeFileSync(process.env.OUT || 'fit-out.json', JSON.stringify(report, null, 1));
console.log(JSON.stringify(report.map((r) => ({ f: r.file, fa: r.fajr_angle[0], ia: r.isha_angle[0], off: r.offsets_median, sc: Object.fromEntries(Object.entries(r.scores).map(([k, v]) => [k, `${v.exact}/${v.within1}/${v.worst}/${v.mae}`])) })), null, 1));
