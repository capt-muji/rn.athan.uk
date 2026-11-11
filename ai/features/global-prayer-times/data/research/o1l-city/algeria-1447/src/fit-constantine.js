// Fourth wilaya: Constantine's directorate table, Ramadan 1447, scored at its own coordinates.
import { readFileSync, writeFileSync } from 'node:fs';
import { PrayerTimes, Coordinates, CalculationMethod, Madhab, Rounding, HighLatitudeRule } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';

const ROOT = `${process.env.HOME}/athan-gitree/census/o1l-city/algeria-1447`;
const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const RECIPE = {
  fajrAngle: 17.8, ishaAngle: 16.1, madhab: Madhab.Shafi,
  per: { fajr: { margin: 0, mode: 'floor' }, sunrise: { margin: 1, mode: 'floor' }, dhuhr: { margin: 1, mode: 'floor' }, asr: { margin: 1, mode: 'floor' }, magrib: { margin: 4, mode: 'floor' }, isha: { margin: 5, mode: 'nearest' } },
};
const MODES = { nearest: Math.round, floor: Math.floor, ceil: Math.ceil };
const toMin = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(2));

const days = readFileSync(`${ROOT}/src/tsv/co47-09.tsv`, 'utf8').split('\n')
  .map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  .map((l) => { const p = l.split(/\s+/); return { date: p[0], obs: Object.fromEntries(PRAYERS.map((q, i) => [q, toMin(p[i + 1])])) }; });

function raw(day, site) {
  const p = CalculationMethod.Other();
  p.fajrAngle = RECIPE.fajrAngle;
  p.ishaAngle = RECIPE.ishaAngle;
  p.madhab = RECIPE.madhab;
  p.rounding = Rounding.None;
  p.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  const [y, m, d] = day.date.split('-').map(Number);
  const t = new PrayerTimes(new Coordinates(site.lat, site.lon), new Date(y, m - 1, d), p);
  const mins = (dt) => dt.getHours() * 60 + dt.getMinutes() + dt.getSeconds() / 60;
  return { fajr: mins(t.fajr), sunrise: mins(t.sunrise), dhuhr: mins(t.dhuhr), asr: mins(t.asr), magrib: mins(t.maghrib), isha: mins(t.isha) };
}

function score(site) {
  const per = {};
  for (const p of PRAYERS) {
    const { margin, mode } = RECIPE.per[p];
    let exact = 0, within1 = 0, worst = 0, sum = 0;
    for (const d of days) {
      const err = MODES[mode](raw(d, site)[p] + margin) - d.obs[p];
      if (err === 0) exact++;
      if (Math.abs(err) <= 1) within1++;
      worst = Math.max(worst, Math.abs(err));
      sum += Math.abs(err);
    }
    per[p] = { exact, within1, worst, mae: +(sum / days.length).toFixed(2), n: days.length };
  }
  const tot = PRAYERS.reduce((a, p) => ({ exact: a.exact + per[p].exact, within1: a.within1 + per[p].within1, n: a.n + per[p].n, worst: Math.max(a.worst, per[p].worst) }), { exact: 0, within1: 0, n: 0, worst: 0 });
  return { ...tot, per };
}

const CONSTANTINE = { name: 'Constantine', lat: 36.365, lon: 6.6147 };
const declared = score(CONSTANTINE);

// grid: where does the directorate's own table place the site?
let best = null;
for (let lat = 36.05; lat <= 36.7; lat += 0.01) {
  for (let lon = 6.3; lon <= 6.95; lon += 0.01) {
    const s = score({ lat: +lat.toFixed(3), lon: +lon.toFixed(3) });
    if (!best || s.exact > best.exact || (s.exact === best.exact && s.worst < best.worst)) best = { lat: +lat.toFixed(3), lon: +lon.toFixed(3), exact: s.exact, within1: s.within1, worst: s.worst, n: s.n };
  }
}

const out = { meta: { engine: 'adhan-js 4.4.6', source: 'Constantine directorate Ramadan 1447 table, internews.dz 2026-02-18', tz: process.env.TZ, recipe: RECIPE }, days: days.length, declared: { site: CONSTANTINE, ...declared }, impliedPoint: best };
writeFileSync(`${ROOT}/data/dz-constantine-1447-ramadan-fit.json`, JSON.stringify(out, null, 1));
console.log(`Constantine ${CONSTANTINE.lat}/${CONSTANTINE.lon}  ${days.length} days`);
console.log(`  frozen: exact ${declared.exact}/${declared.n}, within1 ${declared.within1}/${declared.n}, worst ${declared.worst}`);
for (const p of PRAYERS) console.log(`    ${p.padEnd(8)} ${declared.per[p].exact}/${declared.per[p].n} w1 ${declared.per[p].within1} worst ${declared.per[p].worst} mae ${declared.per[p].mae}`);
console.log('  implied point', JSON.stringify(best));
