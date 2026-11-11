import fs from 'node:fs';
import adhan from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js';

const { Coordinates, PrayerTimes, CalculationParameters, Madhab, Rounding, HighLatitudeRule } = adhan;
const S = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

const offCache = new Map();
const offsetFor = (tz, dateStr) => {
  const key = tz + dateStr;
  if (offCache.has(key)) return offCache.get(key);
  const [y, mo, d] = dateStr.split('-').map(Number);
  const probe = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(probe);
  const g = (t) => Number(parts.find(x => x.type === t).value);
  const local = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') % 24, g('minute'));
  const v = Math.round((local - probe.getTime()) / 60000);
  offCache.set(key, v);
  return v;
};
const mk = (fa, ia) => {
  const p = new CalculationParameters('custom', fa, ia);
  p.madhab = Madhab.Shafi;
  p.rounding = Rounding.None;
  p.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  return p;
};
const calc = (dateStr, p, lat, lon, tz) => {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const pt = new PrayerTimes(new Coordinates(lat, lon), new Date(Date.UTC(y, mo - 1, d, 12, 0, 0)), p);
  const off = offsetFor(tz, dateStr);
  const f = (x) => x.getUTCHours() * 60 + x.getUTCMinutes() + x.getUTCSeconds() / 60 + off;
  return { fajr: f(pt.fajr), sunrise: f(pt.sunrise), dhuhr: f(pt.dhuhr), asr: f(pt.asr), maghrib: f(pt.maghrib), isha: f(pt.isha) };
};
const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const med = (a) => { const v = a.slice().sort((x, y) => x - y); return v[Math.floor(v.length / 2)]; };
const hist = (a) => { const h = {}; for (const x of a) { const r = Math.round(x); h[r] = (h[r] || 0) + 1; } return JSON.stringify(h); };

for (const [slug, surf] of Object.entries(S)) {
  const dates = Object.keys(surf.days).sort().filter((d) => !(d.endsWith('-02-29')));
  const rows = Object.fromEntries(dates.map((d) => [d, Object.fromEntries(COLS.map((c) => [c, toMin(surf.days[d][c])]))]));
  for (const d of dates) if (rows[d].isha < rows[d].maghrib) rows[d].isha += 1440;
  const { lat, lon, tz } = surf;
  // angle search on fajr and isha, scored by absolute minute error
  const search = (col) => {
    const err = (a) => {
      const p = col === 'fajr' ? mk(a, 17) : mk(18, a);
      let abs = 0;
      for (const d of dates) abs += Math.abs(Math.round(calc(d, p, lat, lon, tz)[col]) - rows[d][col]);
      return abs;
    };
    let best = { a: 18, abs: Infinity };
    for (let a = 12; a <= 20; a += 0.25) { const e = err(a); if (e < best.abs) best = { a, abs: e }; }
    for (let a = best.a - 0.25; a <= best.a + 0.25; a += 0.01) { const e = err(a); if (e < best.abs) best = { a, abs: e }; }
    return best;
  };
  const fa = search('fajr');
  const ia = search('isha');
  const p = mk(fa.a, ia.a);
  const off = { sunrise: [], dhuhr: [], asr: [], maghrib: [] };
  for (const d of dates) {
    const c = calc(d, p, lat, lon, tz);
    for (const k of Object.keys(off)) off[k].push(rows[d][k] - c[k]);
  }
  const M = { sunrise: Math.round(med(off.sunrise)), dhuhr: Math.round(med(off.dhuhr)), asr: Math.round(med(off.asr)), maghrib: Math.round(med(off.maghrib)) };
  const score = {};
  let all6 = 0;
  for (const k of COLS) score[k] = [0, 0];
  for (const d of dates) {
    const c = calc(d, p, lat, lon, tz);
    const model = { fajr: c.fajr, sunrise: c.sunrise + M.sunrise, dhuhr: c.dhuhr + M.dhuhr, asr: c.asr + M.asr, maghrib: c.maghrib + M.maghrib, isha: c.isha };
    let ok = 0;
    for (const k of COLS) {
      const e = Math.abs(Math.round(model[k]) - rows[d][k]);
      score[k][0] += e; if (e <= 1) score[k][1]++;
      if (e <= 1) ok++;
    }
    if (ok === 6) all6++;
  }
  const n = dates.length;
  const amp = (col) => {
    const v = dates.map((d) => rows[d][col]);
    return Math.max(...v) - Math.min(...v);
  };
  console.log(`\n== ${slug} (${surf.label}) ${lat},${lon} ${tz} n=${n}`);
  console.log(`fajr ${fa.a.toFixed(2)} (meanAbs ${(fa.abs / n).toFixed(2)}) | isha ${ia.a.toFixed(2)} (meanAbs ${(ia.abs / n).toFixed(2)})`);
  console.log(`margins sunrise ${M.sunrise} dhuhr ${M.dhuhr} asr ${M.asr} maghrib ${M.maghrib}`);
  console.log(`sunrise hist ${hist(off.sunrise)} dhuhr hist ${hist(off.dhuhr)} maghrib hist ${hist(off.maghrib)} asr hist ${hist(off.asr)}`);
  console.log(COLS.map((k) => `${k} ${score[k][1]}/${n} mae ${(score[k][0] / n).toFixed(2)}`).join(' | '));
  console.log(`all6 ${all6}/${n} | amplitude fajr ${amp('fajr')} isha ${amp('isha')}`);
}
