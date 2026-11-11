// Najran: locate the point the publisher's year table is computed at.
const fs = require('fs');
const path = require('path');
const ADHAN = path.join(process.env.HOME, 'athan-gitree/census/adhan-build/node_modules/adhan');
const A = require(ADHAN);
const ROOT = path.join(__dirname, '..');
const CAP = path.join(ROOT, 'captures');
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
function rows(name) {
  const out = [];
  for (const yh of [1448, 1449]) {
    for (const r of JSON.parse(fs.readFileSync(path.join(CAP, `sa-${name}-${yh}.json`), 'utf8')))
      if (r.hijriDate.year === yh) out.push({ date: r.date.slice(0, 10), hm: r.hijriDate.month, tab: r.prayerTimes });
  }
  return out;
}
const rs = rows('najran');
function stat(lat, lon) {
  let n = 0, exact = 0, s = 0;
  for (const r of rs) {
    const [y, m, d] = r.date.split('-').map(Number);
    const pt = new A.PrayerTimes(new A.Coordinates(lat, lon), new Date(y, m - 1, d), params(18.5));
    const pred = {
      fajr: floorMin(wallMinutes(pt.fajr, ZONE) + 1),
      sunrise: floorMin(wallMinutes(pt.sunrise, ZONE)),
      dhuhr: floorMin(wallMinutes(pt.dhuhr, ZONE) + 1),
      asr: floorMin(wallMinutes(pt.asr, ZONE) + 1),
      maghrib: floorMin(wallMinutes(pt.maghrib, ZONE) + 1),
    };
    pred.isha = pred.maghrib + (r.hm === 9 ? 120 : 90);
    for (const c of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
      const e = pred[c] - tmin(r.tab[c]);
      n++; s += e; if (e === 0) exact++;
    }
  }
  return { exact: +(100 * exact / n).toFixed(1), bias: +(s / n).toFixed(3) };
}
const grid = [];
for (let lat = 17.40; lat <= 17.6201; lat += 0.02) {
  for (let lon = 44.06; lon <= 44.2601; lon += 0.01) {
    const st = stat(+lat.toFixed(4), +lon.toFixed(4));
    grid.push({ lat: +lat.toFixed(3), lon: +lon.toFixed(3), ...st });
  }
}
grid.sort((a, b) => b.exact - a.exact || Math.abs(a.bias) - Math.abs(b.bias));
console.log('top 12 points:');
for (const g of grid.slice(0, 12)) console.log(`  lat=${g.lat} lon=${g.lon} exact=${g.exact}% bias=${g.bias}`);
const base = stat(17.52, 44.2);
console.log('published anchor 17.52/44.2:', JSON.stringify(base));
fs.writeFileSync(path.join(ROOT, 'data', 'najran-point-search.json'), JSON.stringify({ base, top: grid.slice(0, 40) }, null, 1));
