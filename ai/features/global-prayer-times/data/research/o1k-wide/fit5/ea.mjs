// Job 2: the East Africa mosque clusters. Full-year mawaqit payloads, 2026.
// Hargeisa x3 and Mogadishu x2 in Africa/Mogadishu, Djibouti x6 in Africa/Djibouti.
import fs from 'node:fs';
import { load, series, bestMargin, scanValue, score, marginsIn, line, PRAYERS } from './lib.mjs';

const ROOT = process.env.HOME + '/athan-gitree/census/o1k-wide/horneast2/data/';
const adhan = await load();
const { CalculationParameters, Madhab } = adhan;

function params({ fajrAngle = 18, ishaAngle = 17, ishaInterval = 0, madhab = Madhab.Shafi }) {
  const p = new CalculationParameters('Other', fajrAngle, ishaAngle, ishaInterval);
  p.madhab = madhab;
  return p;
}

const SETS = [
  { city: 'Hargeisa', name: 'hargeisa-marwa', file: 'somalia-hargeisa-masjid-marwa.json', lat: 9.56, lon: 44.065 },
  { city: 'Hargeisa', name: 'hargeisa-nuurul-huda', file: 'somalia-hargeisa-masjid-nuurul-huda.json', lat: 9.56, lon: 44.065 },
  { city: 'Hargeisa', name: 'hargeisa-ina-weerar', file: 'somalia-hargeisa-masjid-ina-weerar.json', lat: 9.56, lon: 44.065 },
  { city: 'Mogadishu', name: 'mogadishu-rabbul-caalamiin', file: 'somalia-mawaqit-masjid-rabbul-caalamiin-mogadishu.json', lat: 2.0469, lon: 45.3184 },
  { city: 'Mogadishu', name: 'mogadishu-cali-jimcaale', file: 'somalia-mawaqit-masjidka-cali-jimcaale-mogadishu.json', lat: 2.0469, lon: 45.3184 },
  { city: 'Djibouti', name: 'djibouti-djaffar-gabode4', file: 'djibouti-mawaqit-masjid-djaffar-gabode4.json', lat: 11.5721, lon: 43.1456 },
  { city: 'Djibouti', name: 'djibouti-abd-ar-rahman', file: 'djibouti-mawaqit-msjd-abd-ar-rahman-bin-awf.json', lat: 11.5721, lon: 43.1456 },
  { city: 'Djibouti', name: 'djibouti-al-salam-fyart', file: 'djibouti-mawaqit-masjid-al-salam-fyart.json', lat: 11.5721, lon: 43.1456 },
  { city: 'Djibouti', name: 'djibouti-tayib-nagad', file: 'djibouti-mawaqit-mosquee-tayib-nagad.json', lat: 11.5721, lon: 43.1456 },
  { city: 'Djibouti', name: 'djibouti-nashr-aldine', file: 'djibouti-mawaqit-mosquee-nashr-aldine.json', lat: 11.5721, lon: 43.1456 },
  { city: 'Djibouti', name: 'djibouti-ihsaan', file: 'djibouti-mawaqit-mosquee-ihsaan.json', lat: 11.5721, lon: 43.1456 },
];

const angles = [];
for (let a = 100; a <= 200; a++) angles.push(a / 10);

function readRows(file) {
  const raw = JSON.parse(fs.readFileSync(ROOT + file));
  return Object.keys(raw).sort().map((day) => ({
    date: day, fajr: raw[day].fajr, sunrise: raw[day].sunrise, dhuhr: raw[day].dhuhr,
    asr: raw[day].asr, maghrib: raw[day].magrib, isha: raw[day].isha,
  }));
}

const MODES = ['nearest', 'floor', 'ceil'];
const out = {};

for (const s of SETS) {
  const rows = readRows(s.file);
  const dates = rows.map((r) => r.date);
  const coords = { lat: s.lat, lon: s.lon };
  const chart = {};
  for (const p of PRAYERS) chart[p] = rows.map((r) => parseInt(r[p].slice(0, 2), 10) * 60 + parseInt(r[p].slice(3, 5), 10));

  console.log(`\n########## ${s.name}  ${rows.length} rows  ${dates[0]} .. ${dates[dates.length - 1]}`);

  const perMode = {};
  for (const mode of MODES) {
    const fajr = scanValue(adhan, coords, dates, chart.fajr, 'fajr', angles,
      (a) => params({ fajrAngle: a, ishaAngle: 17 }), { mode, marginBound: 2 });
    const geo = series(adhan, coords, dates, params({ fajrAngle: fajr.best.value, ishaAngle: 17 }));
    const sunrise = bestMargin(geo.sunrise, chart.sunrise, { margins: marginsIn(2), modes: [mode] });
    const dhuhr = bestMargin(geo.dhuhr, chart.dhuhr, { margins: marginsIn(2), modes: [mode] });
    const maghrib = bestMargin(geo.maghrib, chart.maghrib, { margins: marginsIn(2), modes: [mode] });
    const asrShafi = bestMargin(geo.asr, chart.asr, { margins: marginsIn(2), modes: [mode] });
    const asrHanafi = bestMargin(series(adhan, coords, dates, params({ fajrAngle: fajr.best.value, madhab: Madhab.Hanafi })).asr,
      chart.asr, { margins: marginsIn(2), modes: [mode] });
    const ishaAngle = scanValue(adhan, coords, dates, chart.isha, 'isha', angles,
      (a) => params({ fajrAngle: fajr.best.value, ishaAngle: a }), { mode, marginBound: 2 });
    const ivs = [];
    for (let n = 55; n <= 100; n++) ivs.push(n);
    const ishaInterval = scanValue(adhan, coords, dates, chart.isha, 'isha', ivs,
      (n) => params({ fajrAngle: fajr.best.value, ishaAngle: 0, ishaInterval: n }), { mode, marginBound: 2 });

    const useInterval = ishaInterval.best.worst < ishaAngle.best.worst
      || (ishaInterval.best.worst === ishaAngle.best.worst && ishaInterval.best.exact > ishaAngle.best.exact);
    const isha = useInterval ? ishaInterval : ishaAngle;
    const margin = { fajr: fajr.best.margin, sunrise: sunrise.margin, dhuhr: dhuhr.margin, asr: asrShafi.margin, maghrib: maghrib.margin, isha: isha.best.margin };
    const ser = series(adhan, coords, dates, params({
      fajrAngle: fajr.best.value, ishaAngle: useInterval ? 0 : ishaAngle.best.value,
      ishaInterval: useInterval ? ishaInterval.best.value : 0,
    }));
    const joint = {};
    let worstAll = 0, exactAll = 0, within1All = 0;
    for (const col of PRAYERS) {
      joint[col] = score(ser[col], chart[col], margin[col], mode);
      worstAll = Math.max(worstAll, joint[col].worst);
      exactAll += joint[col].exact;
      within1All += joint[col].within1;
    }
    perMode[mode] = { mode, fajr, sunrise, dhuhr, maghrib, asrShafi, asrHanafi, ishaAngle, ishaInterval, useInterval, isha, joint, worstAll, exactAll, within1All, margin };
    console.log(`  ${mode.padEnd(8)} worst ${worstAll} within1 ${within1All}/${rows.length * 6} exact ${exactAll}/${rows.length * 6}  fajr ${fajr.best.value.toFixed(1)}@${fajr.best.margin}  isha ${useInterval ? 'int' + ishaInterval.best.value : ishaAngle.best.value.toFixed(1)}@${isha.best.margin}  asr ${asrShafi.margin}`);
  }
  const chosen = MODES.map((m) => perMode[m]).sort((a, b) => b.within1All - a.within1All || b.exactAll - a.exactAll || a.worstAll - b.worstAll)[0];
  const band = (c) => { const v = c.curve.filter((x) => x.worst <= 1).map((x) => x.value); return v.length ? [Math.min(...v), Math.max(...v)] : null; };
  console.log(`  ADOPTED ${chosen.mode}: fajr ${chosen.fajr.best.value.toFixed(1)} [band ${band(chosen.fajr)}] isha ${chosen.useInterval ? 'interval ' + chosen.ishaInterval.best.value : chosen.ishaAngle.best.value.toFixed(1) + ' deg'} [band ${band(chosen.useInterval ? chosen.ishaInterval : chosen.ishaAngle)}] worst ${chosen.worstAll} exact ${chosen.exactAll}/${rows.length * 6}`);
  for (const col of PRAYERS) console.log('   ', line(col, chosen.joint[col]).trim());

  out[s.name] = {
    city: s.city, coords: { lat: s.lat, lon: s.lon }, rows: rows.length,
    mode: chosen.mode,
    fajrAngle: chosen.fajr.best.value, fajrBand: band(chosen.fajr), fajrMargin: chosen.fajr.best.margin,
    fajrScore: { exact: chosen.joint.fajr.exact, within1: chosen.joint.fajr.within1, worst: chosen.joint.fajr.worst },
    ishaModel: chosen.useInterval ? 'interval' : 'angle',
    ishaAngle: chosen.ishaAngle.best.value, ishaAngleBand: band(chosen.ishaAngle),
    ishaInterval: chosen.ishaInterval.best.value, ishaIntervalBand: band(chosen.ishaInterval),
    ishaMargin: chosen.isha.best.margin,
    ishaScore: { exact: chosen.joint.isha.exact, within1: chosen.joint.isha.within1, worst: chosen.joint.isha.worst },
    asrSchool: 'Shafi', asrMargin: chosen.asrShafi.margin, asrScore: { exact: chosen.joint.asr.exact, worst: chosen.joint.asr.worst }, asrHanafiWorst: chosen.asrHanafi.worst,
    sunriseMargin: chosen.sunrise.margin, dhuhrMargin: chosen.dhuhr.margin, maghribMargin: chosen.maghrib.margin,
    sunriseScore: { exact: chosen.joint.sunrise.exact, worst: chosen.joint.sunrise.worst },
    dhuhrScore: { exact: chosen.joint.dhuhr.exact, worst: chosen.joint.dhuhr.worst },
    maghribScore: { exact: chosen.joint.maghrib.exact, worst: chosen.joint.maghrib.worst },
    joint: { worst: chosen.worstAll, exact: chosen.exactAll, within1: chosen.within1All, of: rows.length * 6 },
  };
}

fs.writeFileSync('ea-fit.json', JSON.stringify(out, null, 1));

// ---- cluster sameness: day-by-day deltas inside each city ----
// ---- the platform-class recipe applied unchanged to every payload ----
console.log('\nPLATFORM CLASS: MWL 18/17, Shafi, nearest, zero margins, applied unchanged');
const fixed = params({ fajrAngle: 18, ishaAngle: 17 });
for (const s of SETS) {
  const rows = readRows(s.file);
  const ser = series(adhan, { lat: s.lat, lon: s.lon }, rows.map((r) => r.date), fixed);
  const per = {};
  let worst = 0, exact = 0, within1 = 0, n = 0;
  const dist = {};
  for (const col of PRAYERS) {
    const chart = rows.map((r) => parseInt(r[col].slice(0, 2), 10) * 60 + parseInt(r[col].slice(3, 5), 10));
    const r = score(ser[col], chart, 0, 'nearest');
    per[col] = { exact: r.exact, within1: r.within1, worst: r.worst, mae: +r.mae.toFixed(2), bias: +r.bias.toFixed(2) };
    worst = Math.max(worst, r.worst); exact += r.exact; within1 += r.within1; n += r.n;
    dist[col] = r;
  }
  console.log(`  ${s.name.padEnd(28)} worst ${String(worst).padStart(2)}  within1 ${within1}/${n}  exact ${exact}/${n}  ` +
    PRAYERS.map((p) => `${p[0]}${per[p].worst}/${per[p].exact}`).join(' '));
  out[s.name].fixed = { worst, exact, within1, n, per };
}
fs.writeFileSync('ea-fit.json', JSON.stringify(out, null, 1));

console.log('\nCLUSTER SAMENESS (minute deltas across the full year)');
const byCity = {};
for (const s of SETS) (byCity[s.city] ||= []).push(s);
for (const [city, sets] of Object.entries(byCity)) {
  const base = readRows(sets[0].file);
  for (const s of sets.slice(1)) {
    const cmp = readRows(s.file);
    const d = {};
    for (const col of PRAYERS) {
      let min = 0, max = 0;
      for (let i = 0; i < base.length; i++) {
        const a = parseInt(base[i][col].slice(0, 2), 10) * 60 + parseInt(base[i][col].slice(3, 5), 10);
        const b = parseInt(cmp[i][col].slice(0, 2), 10) * 60 + parseInt(cmp[i][col].slice(3, 5), 10);
        min = Math.min(min, b - a); max = Math.max(max, b - a);
      }
      d[col] = [min, max];
    }
    console.log(`  ${city}: ${sets[0].name} vs ${s.name}`, JSON.stringify(d));
  }
}
console.log('\nwrote ea-fit.json');
