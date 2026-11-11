// Does the per-wilaya minute register reproduce the regional books? The 1447
// register carries 25 northern wilayas; Adrar and Djelfa are outside it. Score
// each regional book on its own coordinates with the frozen Alger recipe, then
// test the register's own longitude-only rule against the printed differences.
import { readFileSync, writeFileSync } from 'node:fs';
import { PrayerTimes, Coordinates, CalculationMethod, Madhab, Rounding, HighLatitudeRule } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';

const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const MODES = { nearest: Math.round, floor: Math.floor, ceil: Math.ceil };
const RECIPE = {
  fajrAngle: 17.8,
  ishaAngle: 16.1,
  madhab: Madhab.Shafi,
  per: {
    fajr: { margin: 0, mode: 'floor' },
    sunrise: { margin: 1, mode: 'floor' },
    dhuhr: { margin: 1, mode: 'floor' },
    asr: { margin: 1, mode: 'floor' },
    magrib: { margin: 4, mode: 'floor' },
    isha: { margin: 5, mode: 'nearest' },
  },
};
const SITES = {
  alger: { lat: 36.7538, lon: 3.0588, file: 'dz-alger-1447-jumada1.json' },
  djelfa: { lat: 34.6703, lon: 3.263, file: 'dz-djelfa-1447-jumada1.json' },
  adrar: { lat: 27.8743, lon: -0.2939, file: 'dz-adrar-1447-jumada1.json' },
};
const toMin = (s) => (s.includes(':') ? Number(s.split(':')[0]) * 60 + Number(s.split(':')[1]) : null);
const load = (f) => {
  const doc = JSON.parse(readFileSync(f, 'utf8'));
  return Object.keys(doc.rows)
    .sort()
    .map((date) => ({
      date,
      obs: {
        fajr: toMin(doc.rows[date].fajr),
        sunrise: toMin(doc.rows[date].sunrise),
        dhuhr: toMin(doc.rows[date].dhuhr),
        asr: toMin(doc.rows[date].asr),
        magrib: toMin(doc.rows[date].maghrib),
        isha: toMin(doc.rows[date].isha),
      },
    }));
};

function rawSeries(day, site, params) {
  const p = CalculationMethod.Other();
  p.fajrAngle = params.fajrAngle;
  p.ishaAngle = params.ishaAngle;
  p.madhab = params.madhab;
  p.rounding = Rounding.None;
  p.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  const [y, m, d] = day.date.split('-').map(Number);
  const t = new PrayerTimes(new Coordinates(site.lat, site.lon), new Date(y, m - 1, d), p);
  const mins = (dt) => dt.getHours() * 60 + dt.getMinutes() + dt.getSeconds() / 60;
  return { fajr: mins(t.fajr), sunrise: mins(t.sunrise), dhuhr: mins(t.dhuhr), asr: mins(t.asr), magrib: mins(t.maghrib), isha: mins(t.isha) };
}

const days = Object.fromEntries(Object.entries(SITES).map(([k, s]) => [k, load(s.file)]));
const out = {};

for (const [k, site] of Object.entries(SITES)) {
  const daysHere = days[k];
  const per = {};
  let exactT = 0;
  let w1T = 0;
  let worstT = 0;
  for (const p of PRAYERS) {
    const { margin, mode } = RECIPE.per[p];
    let exact = 0;
    let within1 = 0;
    let worst = 0;
    let sum = 0;
    for (const d of daysHere) {
      const err = MODES[mode](rawSeries(d, site, RECIPE)[p] + margin) - d.obs[p];
      if (err === 0) exact++;
      if (Math.abs(err) <= 1) within1++;
      worst = Math.max(worst, Math.abs(err));
      sum += Math.abs(err);
    }
    per[p] = { exact, within1, worst, mae: +(sum / daysHere.length).toFixed(2), n: daysHere.length };
    exactT += exact;
    w1T += within1;
    worstT = Math.max(worstT, worst);
  }
  out[k] = { site, recipe: { fajrAngle: RECIPE.fajrAngle, ishaAngle: RECIPE.ishaAngle, madhab: 'shafi' }, per, totals: { exact: exactT, within1: w1T, n: daysHere.length * 6, worst: worstT } };
  console.log(`${k}: exact ${exactT}/${daysHere.length * 6}, within1 ${w1T}/${daysHere.length * 6}, worst ${worstT}`);
  for (const p of PRAYERS) {
    const s = per[p];
    console.log(`  ${p.padEnd(8)} ${s.exact}/${s.n} exact, ${s.within1}/${s.n} within1, worst ${s.worst}, mae ${s.mae}`);
  }
}

// printed difference vs Algiers, and the register's longitude-only rule
const base = days.alger;
const register = JSON.parse(readFileSync('dz-wilaya-offsets-1447.json', 'utf8'));
out.registerColumns = register.wilayas.map((w) => w.wilaya);
const diffs = {};
for (const k of ['djelfa', 'adrar']) {
  const rows = days[k];
  const per = {};
  for (const p of PRAYERS) {
    const printed = rows.map((d, i) => d.obs[p] - base[i].obs[p]);
    const adhan = rows.map((d, i) => rawSeries(d, SITES[k], RECIPE)[p] - rawSeries(base[i], SITES.alger, RECIPE)[p]);
    const mean = (a) => +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2);
    const lonMin = 4 * (SITES[k].lon - SITES.alger.lon);
    per[p] = {
      printedMean: mean(printed),
      printedMin: Math.min(...printed),
      printedMax: Math.max(...printed),
      adhanMean: mean(adhan),
      longitudeRule: +lonMin.toFixed(1),
      residualVsAdhan: +Math.max(...printed.map((x, i) => Math.abs(x - adhan[i]))).toFixed(2),
      residualVsLongitude: +Math.max(...printed.map((x) => Math.abs(x - lonMin))).toFixed(1),
    };
    console.log(`${k} vs Alger ${p.padEnd(8)} printed ${per[p].printedMin}..${per[p].printedMax} mean ${per[p].printedMean} | adhan ${per[p].adhanMean} | 4min/deg ${per[p].longitudeRule} | worst vs adhan ${per[p].residualVsAdhan} | worst vs longitude ${per[p].residualVsLongitude}`);
  }
  diffs[k] = per;
}
out.regionalVsAlger = diffs;

// is either regional book inside the register?
for (const k of ['djelfa', 'adrar']) {
  out[`${k}InRegister`] = register.wilayas.some((w) => w.wilaya === (k === 'djelfa' ? 'الجلفة' : 'أدرار'));
}

// the register's nearest-longitude entry for Adrar is Oran (+15/+14/+15/+18/+18/+16):
// compare it against the printed Adrar-Alger difference column by column
const oran = register.wilayas.find((w) => w.wilaya === 'وهران').minutes;
out.adrarVsOranEntry = Object.fromEntries(
  PRAYERS.map((p, i) => {
    const printed = days.adrar.map((d, j) => d.obs[p] - base[j].obs[p]);
    const mean = +(printed.reduce((x, y) => x + y, 0) / printed.length).toFixed(2);
    return [p, { printedMean: mean, oranEntry: oran[i], miss: +(mean - oran[i]).toFixed(2) }];
  }),
);

writeFileSync('dz-offset-register-check.json', JSON.stringify(out, null, 1));
console.log('\nAdrar vs the register\'s nearest-longitude entry (Oran):', JSON.stringify(out.adrarVsOranEntry));
console.log('Djelfa in register:', out.djelfaInRegister, ' Adrar in register:', out.adrarInRegister);
