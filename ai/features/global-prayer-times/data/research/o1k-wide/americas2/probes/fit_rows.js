// Fit an arbitrary set of dated rows to angles. Columns are fitted independently, which is the
// only way to keep the grid cheap: {date: [fajr,sunrise,dhuhr,asr,maghrib,isha]}.
// node fit_rows.js <jsonfile> <lat> <lon> <tz> [shafi|hanafi]
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/Adhan.js');
const fs = require('fs');
const [file, lat, lon, tz, madhab] = process.argv.slice(2);
const rows = JSON.parse(fs.readFileSync(file));
const coords = new adhan.Coordinates(+lat, +lon);
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const dates = Object.keys(rows).sort();
const entry = d => (Array.isArray(rows[d]) ? rows[d] : [rows[d].fajr, rows[d].sunrise, rows[d].dhuhr, rows[d].asr, rows[d].magrib, rows[d].isha]);
const rules = { mid: adhan.HighLatitudeRule.MiddleOfTheNight, seventh: adhan.HighLatitudeRule.SeventhOfTheNight, angle: adhan.HighLatitudeRule.TwilightAngle };
const mad = madhab === 'hanafi' ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;

function fitColumn(colIdx, which) {
  let best = null;
  for (const [rn, rv] of Object.entries(rules)) {
    for (let a = 8; a <= 21.001; a += 0.1) {
      let err = 0;
      for (const d of dates) {
        const [Y, M, D] = d.split('-').map(Number);
        const p = new adhan.CalculationParameters('Other', which === 'fajr' ? a : 18, which === 'isha' ? a : 17);
        p.highLatitudeRule = rv;
        p.madhab = mad;
        const t = new adhan.PrayerTimes(coords, new Date(Y, M - 1, D), p);
        err += Math.abs(toMin(fmt.format(which === 'fajr' ? t.fajr : t.isha)) - toMin(entry(d)[colIdx]));
      }
      const mae = err / dates.length;
      if (!best || mae < best.mae) best = { rule: rn, angle: +a.toFixed(1), mae: +mae.toFixed(2) };
    }
  }
  return best;
}

function solarOffsets(fa, is) {
  const acc = { sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0 };
  for (const d of dates) {
    const [Y, M, D] = d.split('-').map(Number);
    const p = new adhan.CalculationParameters('Other', fa, is);
    p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
    p.madhab = mad;
    const t = new adhan.PrayerTimes(coords, new Date(Y, M - 1, D), p);
    const e = entry(d);
    acc.sunrise += toMin(e[1]) - toMin(fmt.format(t.sunrise));
    acc.dhuhr += toMin(e[2]) - toMin(fmt.format(t.dhuhr));
    acc.asr += toMin(e[3]) - toMin(fmt.format(t.asr));
    acc.maghrib += toMin(e[4]) - toMin(fmt.format(t.maghrib));
  }
  for (const k of Object.keys(acc)) acc[k] = +(acc[k] / dates.length).toFixed(1);
  return acc;
}

const fajr = fitColumn(0, 'fajr');
const isha = fitColumn(5, 'isha');
console.log(JSON.stringify({ file, days: dates.length, span: [dates[0], dates[dates.length - 1]], fajr, isha, solarOffsetMin: solarOffsets(fajr.angle, isha.angle) }));
