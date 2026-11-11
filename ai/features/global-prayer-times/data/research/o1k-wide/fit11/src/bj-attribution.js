// Benin attribution: the published table against the page's own declared point,
// against the point its own geometry implies, and against the named cities.
import { readFileSync, writeFileSync } from 'node:fs';
import { PrayerTimes, Coordinates, CalculationMethod, Madhab, Rounding, HighLatitudeRule } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';

const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const MODES = { nearest: Math.round, floor: Math.floor, ceil: Math.ceil };
const doc = JSON.parse(readFileSync('../sahel2/data/benin-cotonou-omar-el-farooq-mawaqit-2026.json', 'utf8'));
const toMin = (s) => Number(s.split(':')[0]) * 60 + Number(s.split(':')[1]);
const days = Object.keys(doc.rows)
  .sort()
  .map((date) => ({
    date,
    obs: {
      fajr: toMin(doc.rows[date].fajr),
      sunrise: toMin(doc.rows[date].sunrise),
      dhuhr: toMin(doc.rows[date].dhuhr),
      asr: toMin(doc.rows[date].asr),
      magrib: toMin(doc.rows[date].magrib),
      isha: toMin(doc.rows[date].isha),
    },
  }));

function rawSeries(day, lat, lon, params) {
  const p = CalculationMethod.Other();
  p.fajrAngle = params.fajrAngle;
  p.ishaAngle = params.ishaAngle;
  p.madhab = params.madhab;
  p.rounding = Rounding.None;
  p.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  const [y, m, d] = day.date.split('-').map(Number);
  const t = new PrayerTimes(new Coordinates(lat, lon), new Date(y, m - 1, d), p);
  const mins = (dt) => dt.getHours() * 60 + dt.getMinutes() + dt.getSeconds() / 60;
  return { fajr: mins(t.fajr), sunrise: mins(t.sunrise), dhuhr: mins(t.dhuhr), asr: mins(t.asr), magrib: mins(t.maghrib), isha: mins(t.isha) };
}

function bestMargin(raws, obsList, range = [-10, 10]) {
  let best = null;
  for (const mode of ['nearest', 'floor', 'ceil']) {
    for (let m = range[0]; m <= range[1]; m++) {
      const f = MODES[mode];
      let exact = 0;
      let within1 = 0;
      let worst = 0;
      let sum = 0;
      for (let i = 0; i < raws.length; i++) {
        const err = f(raws[i] + m) - obsList[i];
        if (err === 0) exact++;
        if (Math.abs(err) <= 1) within1++;
        worst = Math.max(worst, Math.abs(err));
        sum += Math.abs(err);
      }
      const s = { margin: m, mode, exact, within1, worst, mae: +(sum / raws.length).toFixed(2) };
      if (!best || s.worst < best.worst || (s.worst === best.worst && s.mae < best.mae) || (s.worst === best.worst && s.mae === best.mae && s.exact > best.exact)) best = s;
    }
  }
  return best;
}

// the platform's own convention on this census (fit2/Togo): MWL 18/17, zero margin, nearest
function scoreAt(lat, lon, params = { fajrAngle: 18, ishaAngle: 17, madhab: Madhab.Shafi }, margins = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, magrib: 0, isha: 0 }) {
  let exact = 0;
  let within1 = 0;
  let worst = 0;
  let sum = 0;
  for (const d of days) {
    const raw = rawSeries(d, lat, lon, params);
    for (const p of PRAYERS) {
      const err = MODES.nearest(raw[p] + margins[p]) - d.obs[p];
      if (err === 0) exact++;
      if (Math.abs(err) <= 1) within1++;
      worst = Math.max(worst, Math.abs(err));
      sum += Math.abs(err);
    }
  }
  return { exact, within1, n: days.length * PRAYERS.length, worst, mae: +(sum / (days.length * PRAYERS.length)).toFixed(2) };
}

// recover the implied point from the table alone: dhuhr gives longitude, the
// annual swing of sunrise gives latitude.
function fitPoint(lat, lon) {
  const params = { fajrAngle: 18, ishaAngle: 17, madhab: Madhab.Shafi };
  const per = {};
  for (const p of PRAYERS) {
    const raws = days.map((d) => rawSeries(d, lat, lon, params)[p]);
    per[p] = bestMargin(raws, days.map((d) => d.obs[p]));
  }
  const exact = PRAYERS.reduce((a, p) => a + per[p].exact, 0);
  const within1 = PRAYERS.reduce((a, p) => a + per[p].within1, 0);
  const worst = Math.max(...PRAYERS.map((p) => per[p].worst));
  return { lat, lon, exact, within1, worst, n: days.length * 6, per };
}

const out = { source: doc.slug, declared: { lat: doc.latitude, lon: doc.longitude, timezone: doc.timezone } };

out.atDeclaredPoint = { score: scoreAt(doc.latitude, doc.longitude), fit: fitPoint(doc.latitude, doc.longitude) };
console.log('declared point 6.4161/2.1211, MWL zero-margin nearest:', JSON.stringify(out.atDeclaredPoint.score));
console.log('declared point free margins:', JSON.stringify({ exact: out.atDeclaredPoint.fit.exact, within1: out.atDeclaredPoint.fit.within1, worst: out.atDeclaredPoint.fit.worst }));

// grid: coarsest useful step, then refine around the winner
let best = null;
const grid = [];
for (let lat = 6; lat <= 12.6; lat += 0.1) {
  for (let lon = 1.8; lon <= 3.6; lon += 0.1) {
    const s = scoreAt(+lat.toFixed(2), +lon.toFixed(2));
    grid.push({ lat: +lat.toFixed(2), lon: +lon.toFixed(2), ...s });
    if (!best || s.within1 > best.within1 || (s.within1 === best.within1 && s.worst < best.worst) || (s.within1 === best.within1 && s.worst === best.worst && s.mae < best.mae)) best = { lat: +lat.toFixed(2), lon: +lon.toFixed(2), ...s };
  }
}
out.gridBest = best;
console.log('grid best:', JSON.stringify(best));

// refine at 0.01 around the winner
let fine = best;
for (let lat = best.lat - 0.15; lat <= best.lat + 0.15; lat += 0.01) {
  for (let lon = best.lon - 0.15; lon <= best.lon + 0.15; lon += 0.01) {
    const s = scoreAt(+lat.toFixed(3), +lon.toFixed(3));
    if (s.within1 > fine.within1 || (s.within1 === fine.within1 && s.worst < fine.worst) || (s.within1 === fine.within1 && s.worst === fine.worst && s.mae < fine.mae)) fine = { lat: +lat.toFixed(3), lon: +lon.toFixed(3), ...s };
  }
}
out.fineBest = fine;
out.fineBestFit = fitPoint(fine.lat, fine.lon);
console.log('fine best:', JSON.stringify(fine));
console.log('fine best with free margins:', JSON.stringify({ exact: out.fineBestFit.exact, within1: out.fineBestFit.within1, worst: out.fineBestFit.worst, per: out.fineBestFit.per }));

// named cities
const CITIES = {
  Cotonou: { lat: 6.3703, lon: 2.3912 },
  'Cotonou-Gakpe': { lat: 6.4161, lon: 2.1211 },
  'Porto-Novo': { lat: 6.4969, lon: 2.6289 },
  AbomeyCalavi: { lat: 6.4489, lon: 2.3556 },
  Kandi: { lat: 11.1342, lon: 2.9364 },
  Parakou: { lat: 9.3372, lon: 2.6303 },
  Djougou: { lat: 9.7085, lon: 1.6656 },
  Natitingou: { lat: 10.3042, lon: 1.3796 },
  Malanville: { lat: 11.8656, lon: 3.3833 },
  Banikoara: { lat: 11.2983, lon: 2.4386 },
};
out.namedCities = Object.fromEntries(
  Object.entries(CITIES).map(([k, c]) => {
    const s = scoreAt(c.lat, c.lon);
    return [k, { ...c, exact: s.exact, within1: s.within1, worst: s.worst, mae: s.mae }];
  }),
);
console.log('\nnamed cities (MWL 18/17, zero margin, nearest):');
for (const [k, v] of Object.entries(out.namedCities)) console.log(`  ${k.padEnd(15)} ${v.lat}/${v.lon} exact ${v.exact}/2190 within1 ${v.within1} worst ${v.worst} mae ${v.mae}`);

const haversine = (a, b) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return +(2 * R * Math.asin(Math.sqrt(s))).toFixed(1);
};
const pin = { lat: doc.latitude, lon: doc.longitude };
out.distances = {
  fineToKandi: haversine(fine, CITIES.Kandi),
  fineToCotonou: haversine(fine, CITIES.Cotonou),
  fineToDeclared: haversine(fine, pin),
  declaredToKandi: haversine(pin, CITIES.Kandi),
  declaredToCotonou: haversine(pin, CITIES.Cotonou),
  declaredToPortoNovo: haversine(pin, CITIES['Porto-Novo']),
  declaredToOuidah: haversine(pin, { lat: 6.3654, lon: 2.0852 }),
  pinIsTheCensusCity: false,
  pinNote: 'the captured page never names Cotonou: name and label read Mosquee Omar El Farooq - GAKPe, countryCode BJ, timezone Africa/Porto-Novo, and the pin sits 30.3 km west of the Cotonou centre, 6.9 km from Ouidah',
};
console.log('\ndistances km:', JSON.stringify(out.distances));

// residual shape at the declared point: latitude signature
const residAt = (lat, lon) => {
  const rows = days.map((d) => {
    const raw = rawSeries(d, lat, lon, { fajrAngle: 18, ishaAngle: 17, madhab: Madhab.Shafi });
    return { date: d.date, ...Object.fromEntries(PRAYERS.map((p) => [p, +(raw[p] - d.obs[p]).toFixed(2)])) };
  });
  const months = {};
  for (const r of rows) {
    const k = r.date.slice(5, 7);
    months[k] ??= [];
    months[k].push(r);
  }
  const mean = (a) => +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
  return Object.fromEntries(Object.entries(months).map(([k, v]) => [k, Object.fromEntries(PRAYERS.map((p) => [p, mean(v.map((x) => x[p]))]))]));
};
out.monthlyResidualDeclared = residAt(doc.latitude, doc.longitude);
out.monthlyResidualFine = residAt(fine.lat, fine.lon);
console.log('\nmonthly mean residual (raw - printed, minutes) at the declared point:');
for (const [k, v] of Object.entries(out.monthlyResidualDeclared)) console.log(' ', k, PRAYERS.map((p) => `${p} ${v[p]}`).join('  '));
console.log('... at the implied point:');
for (const [k, v] of Object.entries(out.monthlyResidualFine)) console.log(' ', k, PRAYERS.map((p) => `${p} ${v[p]}`).join('  '));

writeFileSync('bj-attribution.json', JSON.stringify(out, null, 1));
