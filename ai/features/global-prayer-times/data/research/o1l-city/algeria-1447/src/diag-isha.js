// Isha diagnostics: the angle and the margin are degenerate over the printed range,
// so print the joint grid and the monthly residual of the frozen recipe.
import { readFileSync } from 'node:fs';
import { PrayerTimes, Coordinates, CalculationMethod, Madhab, Rounding, HighLatitudeRule } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';

const ROOT = `${process.env.HOME}/athan-gitree/census/o1l-city/algeria-1447`;
const SITES = {
  dz47: { name: 'Alger', lat: 36.7538, lon: 3.0588 },
  ad47: { name: 'Adrar', lat: 27.8743, lon: -0.2939 },
  dj47: { name: 'Djelfa', lat: 34.6703, lon: 3.2630 },
};
const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const FROZEN = { fajr: [17.8, 0, Math.floor], sunrise: [null, 1, Math.floor], dhuhr: [null, 1, Math.floor], asr: [null, 1, Math.floor], magrib: [null, 4, Math.floor], isha: [16.1, 5, Math.round] };
const ISHA_ARTIFACT = new Set(['2026-02-14', '2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-04-13', '2026-04-14', '2026-04-15', '2026-04-16', '2026-04-17', '2026-04-18']);
const toMin = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(2));

function load(tag) {
  const doc = JSON.parse(readFileSync(`${ROOT}/data/${tag}-1447-all.json`, 'utf8'));
  const days = [];
  for (const [m, month] of Object.entries(doc.months)) {
    for (const [date, r] of Object.entries(month.rows)) {
      if (r.fajr == null) continue;
      days.push({ date, month: Number(m), obs: Object.fromEntries(PRAYERS.map((p) => [p, toMin(r[p === 'magrib' ? 'maghrib' : p])])) });
    }
  }
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

function raw(day, site, fajrAngle, ishaAngle) {
  const p = CalculationMethod.Other();
  p.fajrAngle = fajrAngle;
  p.ishaAngle = ishaAngle;
  p.madhab = Madhab.Shafi;
  p.rounding = Rounding.None;
  p.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  const [y, m, d] = day.date.split('-').map(Number);
  const t = new PrayerTimes(new Coordinates(site.lat, site.lon), new Date(y, m - 1, d), p);
  const mins = (dt) => dt.getHours() * 60 + dt.getMinutes() + dt.getSeconds() / 60;
  return { fajr: mins(t.fajr), sunrise: mins(t.sunrise), dhuhr: mins(t.dhuhr), asr: mins(t.asr), magrib: mins(t.maghrib), isha: mins(t.isha) };
}

const out = {};
for (const [tag, site] of Object.entries(SITES)) {
  const days = load(tag).filter((d) => !ISHA_ARTIFACT.has(d.date));
  // joint isha grid
  const grid = [];
  for (let a = 15.5; a <= 17.51; a += 0.1) {
    for (let mg = -2; mg <= 8; mg++) {
      for (const mode of ['nearest', 'floor', 'ceil']) {
        const f = mode === 'nearest' ? Math.round : mode === 'floor' ? Math.floor : Math.ceil;
        let exact = 0, within1 = 0, worst = 0, sum = 0;
        for (const d of days) {
          const err = f(raw(d, site, 17.8, a).isha + mg) - d.obs.isha;
          if (err === 0) exact++;
          if (Math.abs(err) <= 1) within1++;
          worst = Math.max(worst, Math.abs(err));
          sum += Math.abs(err);
        }
        grid.push({ angle: +a.toFixed(2), margin: mg, mode, exact, within1, worst, mae: +(sum / days.length).toFixed(3), n: days.length });
      }
    }
  }
  grid.sort((x, y) => x.worst - y.worst || y.exact - x.exact || x.mae - y.mae);
  // frozen recipe, isha residual per month
  const months = {};
  for (const d of load(tag)) {
    if (ISHA_ARTIFACT.has(d.date)) continue;
    const k = String(d.month);
    months[k] ??= { isha: [], fajr: [] };
    months[k].isha.push(Math.round(raw(d, site, 17.8, 16.1).isha + 5) - d.obs.isha);
    months[k].fajr.push(Math.floor(raw(d, site, 17.8, 16.1).fajr + 0) - d.obs.fajr);
  }
  const mean = (a) => +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2);
  out[tag] = {
    site,
    ishaTop: grid.slice(0, 8),
    ishaAtFrozen: grid.find((g) => g.angle === 16.1 && g.margin === 5 && g.mode === 'nearest'),
    ishaAt1630: grid.filter((g) => g.angle === 16.3).sort((x, y) => x.worst - y.worst || y.exact - x.exact)[0],
    monthlyResidual: Object.fromEntries(Object.entries(months).map(([k, v]) => [k, { ishaMean: mean(v.isha), ishaMin: Math.min(...v.isha), ishaMax: Math.max(...v.isha), fajrMean: mean(v.fajr) }])),
  };
}

console.log(JSON.stringify(out, null, 1));
for (const [tag, r] of Object.entries(out)) {
  console.log(`\n== ${r.site.name}  frozen isha: exact ${r.ishaAtFrozen.exact}/${r.ishaAtFrozen.n} w1 ${r.ishaAtFrozen.within1} worst ${r.ishaAtFrozen.worst} mae ${r.ishaAtFrozen.mae}`);
  console.log('  top grid:');
  for (const g of r.ishaTop) console.log(`   ${g.angle} ${g.margin}/${g.mode} exact ${g.exact} w1 ${g.within1} worst ${g.worst} mae ${g.mae}`);
  console.log('  16.30 best:', JSON.stringify(r.ishaAt1630));
  console.log('  monthly isha residual mean:', Object.entries(r.monthlyResidual).map(([k, v]) => `${k}:${v.ishaMean}`).join(' '));
  console.log('  monthly fajr residual mean:', Object.entries(r.monthlyResidual).map(([k, v]) => `${k}:${v.fajrMean}`).join(' '));
}
