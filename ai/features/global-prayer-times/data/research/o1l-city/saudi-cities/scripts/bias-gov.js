// Signed-error diagnostics: is a city's residual noise, or a systematic point offset?
const fs = require('fs');
const path = require('path');
const ADHAN = path.join(process.env.HOME, 'athan-gitree/census/adhan-build/node_modules/adhan');
const A = require(ADHAN);

const ROOT = path.join(__dirname, '..');
const CAP = path.join(ROOT, 'captures');
const CONF = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cities.json'), 'utf8'));
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const ZONE = 3;
const floorMin = (x) => Math.floor(x + 1e-9);
const tmin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const wallMinutes = (d, off) => ((((d.getTime() + off * 3600000) % 86400000) + 86400000) % 86400000) / 60000;

function params(a) {
  const p = new A.CalculationParameters('Other', a, 18, 0);
  p.madhab = A.Madhab.Shafi;
  p.highLatitudeRule = A.HighLatitudeRule.MiddleOfTheNight;
  p.rounding = A.Rounding.None;
  return p;
}
function raw(lat, lon, y, m, d) {
  const pt = new A.PrayerTimes(new A.Coordinates(lat, lon), new Date(y, m - 1, d), params(18.5));
  return { fajr: wallMinutes(pt.fajr, ZONE), sunrise: wallMinutes(pt.sunrise, ZONE), dhuhr: wallMinutes(pt.dhuhr, ZONE), asr: wallMinutes(pt.asr, ZONE), maghrib: wallMinutes(pt.maghrib, ZONE) };
}
function rows(name) {
  const out = [];
  for (const yh of [1448, 1449]) {
    const raw_ = JSON.parse(fs.readFileSync(path.join(CAP, `sa-${name}-${yh}.json`), 'utf8'));
    for (const r of raw_) if (r.hijriDate.year === yh) out.push({ date: r.date.slice(0, 10), hm: r.hijriDate.month, tab: r.prayerTimes });
  }
  return out;
}

// exact% for a point, holding the recipe's own margins
function exactAt(rs, lat, lon) {
  let n = 0, exact = 0;
  for (const r of rs) {
    const [y, m, d] = r.date.split('-').map(Number);
    const p = raw(lat, lon, y, m, d);
    for (const c of ['fajr', 'dhuhr', 'asr', 'maghrib']) {
      const pred = floorMin(p[c] + 1);
      n++; if (pred === tmin(r.tab[c])) exact++;
    }
    const sr = floorMin(p.sunrise);
    n++; if (sr === tmin(r.tab.sunrise)) exact++;
    const mg = floorMin(p.maghrib + 1);
    const isha = mg + (r.hm === 9 ? 120 : 90);
    n++; if (isha === tmin(r.tab.isha)) exact++;
  }
  return +(100 * exact / n).toFixed(1);
}

const report = {};
for (const city of CONF.cities) {
  const rs = rows(city.name);
  const bias = {};
  for (const c of COLS) {
    let s = 0, n = 0;
    const hist = {};
    for (const r of rs) {
      const [y, m, d] = r.date.split('-').map(Number);
      const p = raw(city.lat, city.lon, y, m, d);
      const pred = c === 'isha'
        ? floorMin(p.maghrib + 1) + (r.hm === 9 ? 120 : 90)
        : c === 'sunrise' ? floorMin(p.sunrise) : floorMin(p[c] + 1);
      const e = pred - tmin(r.tab[c]);
      s += e; n++; hist[e] = (hist[e] || 0) + 1;
    }
    bias[c] = { meanSigned: +(s / n).toFixed(3), hist };
  }
  report[city.name] = { lat: city.lat, lon: city.lon, bias };
}

// point search for the depressed cities
const SEARCH = ['najran', 'arar', 'turaif', 'sakaka', 'jubail'];
report.pointSearch = {};
for (const name of SEARCH) {
  const rs = rows(name);
  const c0 = CONF.cities.find((c) => c.name === name);
  let best = null;
  for (let dlat = -0.25; dlat <= 0.2501; dlat += 0.05) {
    for (let dlon = -0.5; dlon <= 0.5001; dlon += 0.05) {
      const e = exactAt(rs, +(c0.lat + dlat).toFixed(4), +(c0.lon + dlon).toFixed(4));
      if (!best || e > best.exact) best = { dlat: +dlat.toFixed(2), dlon: +dlon.toFixed(2), exact: e };
    }
  }
  report.pointSearch[name] = { base: exactAt(rs, c0.lat, c0.lon), best };
  console.log(name, 'base', report.pointSearch[name].base, 'best', JSON.stringify(best));
}
for (const [k, v] of Object.entries(report)) {
  if (k === 'pointSearch') continue;
  console.log(k.padEnd(17), COLS.map((c) => `${c}:${v.bias[c].meanSigned}`).join(' '));
}
fs.writeFileSync(path.join(ROOT, 'data', 'sa-gov-bias.json'), JSON.stringify(report, null, 1));
