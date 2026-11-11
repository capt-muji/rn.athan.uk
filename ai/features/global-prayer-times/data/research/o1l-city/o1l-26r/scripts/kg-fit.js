const fs = require('fs');
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');

const P = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function loadCity(name, year) {
  const dir = __dirname + '/../captures/';
  const files = fs.readdirSync(dir).filter(f => f.startsWith(`kg-${name}-${year}-`) && f.endsWith('.json'));
  const rows = {};
  for (const f of files) {
    let d;
    try { d = JSON.parse(fs.readFileSync(dir + f, 'utf8')); } catch (e) { continue; }
    if (!Array.isArray(d.prayertimes)) continue;
    for (const r of d.prayertimes) {
      const [dd, mm, yy] = r.date.split('-');
      rows[`${yy}-${mm}-${dd}`] = r;
    }
  }
  return rows;
}
const mins = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

function solar(y, mo, d, lat, lng) {
  const dayStart = Date.UTC(y, mo - 1, d);
  const p = new adhan.CalculationParameters('Other', 18, 18);
  p.madhab = adhan.Madhab.Hanafi;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  p.rounding = adhan.Rounding.None;
  const t = new adhan.PrayerTimes(new adhan.Coordinates(lat, lng), new Date(dayStart), p);
  const out = {};
  for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'sunset', 'isha']) {
    const m = (new Date(t[k]).getTime() - dayStart) / 60000 + 6 * 60;
    out[k] = m;
  }
  return out;
}

// recover (lat,lng) by minimising sunrise+dhuhr+sunset residual over the year
function recover(name, year, guessLat, guessLng) {
  const rows = loadCity(name, year);
  const dates = Object.keys(rows).sort();
  let best = null;
  for (let lat = guessLat - 0.6; lat <= guessLat + 0.6; lat += 0.01) {
    for (let lng = guessLng - 0.9; lng <= guessLng + 0.9; lng += 0.02) {
      let s = 0;
      for (const key of dates) {
        const [y, mo, d] = key.split('-').map(Number);
        const r = rows[key];
        const t = solar(y, mo, d, lat, lng);
        s += Math.abs(t.sunrise - mins(r.sunrise)) + Math.abs(t.dhuhr - mins(r.dhuhr)) + Math.abs(t.sunset - mins(r.sunset));
      }
      if (!best || s < best.s) best = { lat, lng, s };
    }
  }
  return best;
}

function fit(name, year, lat, lng) {
  const rows = loadCity(name, year);
  const dates = Object.keys(rows).sort();
  const acc = {};
  for (const k of P) acc[k] = { n: 0, exact: 0, w1: 0, abs: 0, bias: 0, worst: 0 };
  const ratioAcc = { n: 0, exact: 0, w1: 0, abs: 0, diffs: [] };
  let mg = { n: 0, exact: 0, offs: {} };
  for (const key of dates) {
    const [y, mo, d] = key.split('-').map(Number);
    const r = rows[key];
    const t = solar(y, mo, d, lat, lng);
    const pred = {
      fajr: t.fajr, sunrise: t.sunrise, dhuhr: t.dhuhr, asr: t.asr,
      maghrib: t.sunset + 7, isha: t.sunset + 7 + Math.round((7 / 9) * (t.sunrise - t.fajr) + 3.5),
    };
    for (const k of P) {
      const obs = mins(r[k]);
      const diff = obs - Math.round(pred[k]);
      const s = acc[k];
      s.n++; if (diff === 0) s.exact++; if (Math.abs(diff) <= 1) s.w1++;
      s.abs += Math.abs(diff); s.bias += diff;
      if (Math.abs(diff) > Math.abs(s.worst)) s.worst = diff;
    }
    const obsMg = mins(r.maghrib) - mins(r.sunset);
    mg.n++; mg.offs[obsMg] = (mg.offs[obsMg] || 0) + 1;
    const obsIsha = mins(r.isha) - mins(r.maghrib);
    const calcIsha = Math.round((7 / 9) * (t.sunrise - t.fajr) + 3.5);
    const dd = obsIsha - calcIsha;
    ratioAcc.n++; if (dd === 0) ratioAcc.exact++; if (Math.abs(dd) <= 1) ratioAcc.w1++;
    ratioAcc.abs += Math.abs(dd); ratioAcc.diffs.push(dd);
  }
  return { acc, ratioAcc, mg, days: dates.length };
}

function report(label, name, year, lat, lng) {
  const f = fit(name, year, lat, lng);
  const L = [`### ${label} ${year} — ${f.days} days, lat ${lat.toFixed(3)} lng ${lng.toFixed(3)}`,
    '| column | exact % | within-1 % | MAE | bias | worst |', '|---|---|---|---|---|---|'];
  for (const k of P) {
    const s = f.acc[k];
    L.push(`| ${s ? k : k} | ${(100 * s.exact / s.n).toFixed(2)} | ${(100 * s.w1 / s.n).toFixed(2)} | ${(s.abs / s.n).toFixed(3)} | ${(s.bias / s.n).toFixed(3)} | ${s.worst} |`);
  }
  const mgo = Object.entries(f.mg.offs).map(([k, v]) => `${k}:${v}`).join(' ');
  L.push(`maghrib-sunset offsets: ${mgo}`);
  L.push(`isha ratio: exact ${(100 * f.ratioAcc.exact / f.ratioAcc.n).toFixed(2)}% within-1 ${(100 * f.ratioAcc.w1 / f.ratioAcc.n).toFixed(2)}% MAE ${(f.ratioAcc.abs / f.ratioAcc.n).toFixed(3)}`);
  return L.join('\n');
}

module.exports = { loadCity, recover, fit, report, solar, mins, P };
