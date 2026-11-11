// Century probe at the sample's latitude extremes: 1318H, 1400H, 1500H, same recipe.
const fs = require('fs');
const path = require('path');
const ADHAN = path.join(process.env.HOME, 'athan-gitree/census/adhan-build/node_modules/adhan');
const A = require(ADHAN);

const ROOT = path.join(__dirname, '..');
const CAP = path.join(ROOT, 'captures');
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const ZONE = 3;
const fl = (x) => Math.floor(x + 1e-9);
const tm = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const wm = (d, o) => ((((d.getTime() + o * 3600000) % 86400000) + 86400000) % 86400000) / 60000;
function P() {
  const p = new A.CalculationParameters('Other', 18.5, 18, 0);
  p.madhab = A.Madhab.Shafi;
  p.highLatitudeRule = A.HighLatitudeRule.MiddleOfTheNight;
  p.rounding = A.Rounding.None;
  return p;
}
const CITIES = [['turaif', 31.6725, 38.6636], ['farasan', 16.70, 42.1167]];
const YEARS = [1318, 1400, 1500];
const out = { job: 'O1l-40 century probe, latitude extremes', cities: {} };

for (const [name, lat, lon] of CITIES) {
  const res = { lat, lon, years: {}, intervals: {}, violations: [] };
  const monthIv = {};
  for (const yh of YEARS) {
    const rows = JSON.parse(fs.readFileSync(path.join(CAP, `sa-${name}-h${yh}.json`), 'utf8'))
      .filter((r) => r.hijriDate.year === yh)
      .map((r) => ({ date: r.date.slice(0, 10), hm: r.hijriDate.month, tab: r.prayerTimes }));
    let n = 0, exact = 0, w1 = 0, sum = 0, max = 0;
    for (const r of rows) {
      const [y, m, d] = r.date.split('-').map(Number);
      const pt = new A.PrayerTimes(new A.Coordinates(lat, lon), new Date(y, m - 1, d), P());
      const p = {
        fajr: fl(wm(pt.fajr, ZONE) + 1),
        sunrise: fl(wm(pt.sunrise, ZONE)),
        dhuhr: fl(wm(pt.dhuhr, ZONE) + 1),
        asr: fl(wm(pt.asr, ZONE) + 1),
        maghrib: fl(wm(pt.maghrib, ZONE) + 1),
      };
      p.isha = p.maghrib + (r.hm === 9 ? 120 : 90);
      for (const c of COLS) {
        const e = p[c] - tm(r.tab[c]);
        n++; if (e === 0) exact++; if (Math.abs(e) <= 1) w1++;
        sum += Math.abs(e); max = Math.max(max, Math.abs(e));
      }
      const iv = (tm(r.tab.isha) - tm(r.tab.maghrib) + 1440) % 1440;
      res.intervals[iv] = (res.intervals[iv] || 0) + 1;
      (monthIv[r.hm] = monthIv[r.hm] || new Set()).add(iv);
    }
    res.years[yh] = { rows: rows.length, from: rows[0].date, to: rows[rows.length - 1].date,
      exactPct: +(100 * exact / n).toFixed(1), w1Pct: +(100 * w1 / n).toFixed(1), mae: +(sum / n).toFixed(3), max };
    console.log(`${name} ${yh}H rows=${rows.length} ${rows[0].date}..${rows[rows.length - 1].date} exact=${res.years[yh].exactPct}% w1=${res.years[yh].w1Pct}% mae=${res.years[yh].mae} max=${max}`);
  }
  for (const [m, s] of Object.entries(monthIv)) {
    const want = Number(m) === 9 ? 120 : 90;
    for (const iv of s) if (iv !== want) res.violations.push({ month: +m, iv });
  }
  res.monthExact = res.violations.length === 0;
  console.log(`${name} intervals=${JSON.stringify(res.intervals)} violations=${res.violations.length}`);
  out.cities[name] = res;
}
fs.writeFileSync(path.join(ROOT, 'data', 'sa-century-probe.json'), JSON.stringify(out, null, 1));
