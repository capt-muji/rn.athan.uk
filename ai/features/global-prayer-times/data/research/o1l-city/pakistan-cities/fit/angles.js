const { Coordinates, CalculationParameters, PrayerTimes, Madhab, Rounding } = require(`${process.env.HOME}/athan-gitree/census/adhan-build/node_modules/adhan`);

const YEAR = 2026;

function params(fajr, isha) {
  const p = new CalculationParameters('x');
  p.fajrAngle = fajr;
  p.ishaAngle = isha;
  p.madhab = Madhab.Hanafi;
  p.rounding = Rounding.None;
  p.methodAdjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  return p;
}

function minutes(d) {
  const [h, m, s] = d.toLocaleString('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).split(':').map(Number);
  return h * 60 + m + s / 60;
}

function median(a) {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
}

// least-squares search over the two twilight angles, holding coordinates fixed
function searchAngles(chart, lat, lon, col) {
  const coords = new Coordinates(lat, lon);
  let best = null;
  for (let a = 15; a <= 20.5; a += 0.1) {
    const res = [];
    for (const row of chart) {
      const pt = new PrayerTimes(coords, new Date(Date.UTC(YEAR, row.m - 1, row.d, 12)), params(col === 'fajr' ? a : 18, col === 'isha' ? a : 18));
      res.push(row[col] - minutes(pt[col]));
    }
    const ok = res.filter((v) => Math.abs(v) < 20);
    const rms = Math.sqrt(ok.reduce((s, v) => s + v * v, 0) / ok.length);
    const bias = ok.reduce((s, v) => s + v, 0) / ok.length;
    if (!best || rms < best.rms) best = { angle: +a.toFixed(1), rms: +rms.toFixed(2), bias: +bias.toFixed(2), n: ok.length };
  }
  return best;
}

module.exports = { searchAngles, params, minutes, median, YEAR };
