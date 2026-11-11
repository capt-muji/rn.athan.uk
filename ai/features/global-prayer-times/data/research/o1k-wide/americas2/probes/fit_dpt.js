// Fit a dpt full-year feed to an angle pair. Usage: node fit_dpt.js <domain> <lat> <lon> <tz>
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/Adhan.js');
const fs = require('fs');
const [domain, lat, lon, tz] = process.argv.slice(2);
const rows = JSON.parse(fs.readFileSync(`captures/dpt_${domain}.json`))[0];
const coords = new adhan.Coordinates(+lat, +lon);
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const days = rows.filter(r => r.fajr_begins && r.fajr_begins !== '00:00:00');
function fit(which) {
  let best = null;
  for (let a = 6; a <= 21.001; a += 0.05) {
    const p = new adhan.CalculationParameters('Other', which === 'fajr' ? a : 18, which === 'isha' ? a : 17);
    p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
    let s = 0;
    for (const r of days) {
      const [Y, M, D] = r.d_date.split('-').map(Number);
      const pt = new adhan.PrayerTimes(coords, new Date(Y, M - 1, D), p);
      s += Math.abs(toMin(fmt.format(which === 'fajr' ? pt.fajr : pt.isha)) - toMin((which === 'fajr' ? r.fajr_begins : r.isha_begins).slice(0, 5)));
    }
    const mae = s / days.length;
    if (!best || mae < best.mae) best = { angle: +a.toFixed(2), mae: +mae.toFixed(2) };
  }
  return best;
}
function fitSolar(kind) {
  // sunrise/maghrib carry no angle; they show whether the clock offset and coords are right
  const p = new adhan.CalculationParameters('Other', 18, 17);
  let s = 0;
  for (const r of days) {
    const [Y, M, D] = r.d_date.split('-').map(Number);
    const pt = new adhan.PrayerTimes(coords, new Date(Y, M - 1, D), p);
    const got = toMin(fmt.format(kind === 'sunrise' ? pt.sunrise : pt.maghrib));
    const want = toMin((kind === 'sunrise' ? r.sunrise : r.maghrib_begins).slice(0, 5));
    s += got - want;
  }
  return +(s / days.length).toFixed(1);
}
console.log(JSON.stringify({
  domain, days: days.length,
  fajr: fit('fajr'), isha: fit('isha'),
  sunriseOffsetMeanMin: fitSolar('sunrise'), maghribOffsetMeanMin: fitSolar('maghrib'),
  asrHanafi: days.filter(r => r.asr_mithl_1 !== r.asr_mithl_2).length > days.length / 2,
}));
