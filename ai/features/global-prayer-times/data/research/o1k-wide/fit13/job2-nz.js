// Job 2: NZ FIANZ Ramadan 1447H sheets — angle pair behind the stated offsets.
import * as L from './lib.js';

const CITIES = [
  ['Auckland', 'nz-2026-ramadan-auckland.json', -36.8485, 174.7633],
  ['Wellington', 'nz-2026-ramadan-wellington.json', -41.2866, 174.7756],
  ['Christchurch', 'nz-2026-ramadan-christchurch.json', -43.5321, 172.6362],
];
const ZONE = 'Pacific/Auckland';

function implied(rows, lat, lon, field, which) {
  const vals = rows.map((r) => L.impliedAngle(r.date, lat, lon, which, L.parseHM(r.times[field]), ZONE));
  return L.stats(vals);
}

const out = { _job: 'Job 2: FIANZ Ramadhan Calendar 1447H (fianz.com), stated offsets fitted', zone: ZONE, cities: {} };

for (const [name, file, lat, lon] of CITIES) {
  const rows = L.loadTable(`${L.DATA}/${file}`);
  const c = { file, lat, lon, rows: rows.length, span: [rows[0].date, rows[rows.length - 1].date] };

  // stated-offset internals
  const suhoorGap = L.stats(rows.map((r) => (L.parseHM(r.times.fajr) - L.parseHM(r.times.suhoorEnds)) / 60));
  const magribGap = L.stats(rows.map((r) => (L.parseHM(r.times.magrib) - L.rawTimes(r.date, lat, lon).sunset / 1000 ? 0 : 0))); // placeholder, real one below
  const magVsSunset = [];
  for (const r of rows) {
    const sunsetSec = L.localSeconds(L.rawTimes(r.date, lat, lon).sunset, ZONE);
    magVsSunset.push((L.parseHM(r.times.magrib) - sunsetSec) / 60);
  }
  c.suhoorEnds_minus_fajr = { median: +suhoorGap.median.toFixed(2), min: +suhoorGap.min.toFixed(2), max: +suhoorGap.max.toFixed(2), sd: suhoorGap.sd };
  c.magrib_minus_sunset = { median: +L.stats(magVsSunset).median.toFixed(2), min: +L.stats(magVsSunset).min.toFixed(2), max: +L.stats(magVsSunset).max.toFixed(2), sd: L.stats(magVsSunset).sd };

  // implied angles
  c.fajrImpliedAngle = implied(rows, lat, lon, 'fajr', 'fajr');
  c.ishaImpliedAngle = implied(rows, lat, lon, 'isha', 'isha');

  // residual scan across candidate angles for fajr and isha
  c.fajrScan = {};
  for (const a of [15, 16, 17, 18, 19, 20]) {
    const st = L.stats(L.residuals(rows, lat, lon, ZONE, 'fajr', { angle: a }));
    c.fajrScan[a] = { median: +st.median.toFixed(2), sd: st.sd, min: +st.min.toFixed(2), max: +st.max.toFixed(2) };
  }
  c.ishaScan = {};
  for (const a of [14, 15, 16, 17, 18, 19]) {
    const st = L.stats(L.residuals(rows, lat, lon, ZONE, 'isha', { angle: a }));
    c.ishaScan[a] = { median: +st.median.toFixed(2), sd: st.sd, min: +st.min.toFixed(2), max: +st.max.toFixed(2) };
  }

  // other prayers vs raw astronomy
  c.otherResiduals = {};
  for (const [prayer, cfg] of [['sunrise', {}], ['dhuhr', {}], ['asr', { shadow: 1 }], ['asrHanafi', 'asr2']]) {
    const p = prayer === 'asrHanafi' ? 'asr' : prayer;
    const cc = prayer === 'asrHanafi' ? { shadow: 2 } : cfg;
    const st = L.stats(L.residuals(rows, lat, lon, ZONE, p, cc));
    c.otherResiduals[prayer] = { median: +st.median.toFixed(2), sd: st.sd, min: +st.min.toFixed(2), max: +st.max.toFixed(2) };
  }

  // exact score of the assembled recipe
  const bestFajr = 18, bestIsha = 18; // resolved after scan; final recipe applied below
  out.cities[name] = c;
}

// resolve the shared pair from the scans, then exact-score it per city
function resolve() {
  let best = null;
  for (const fa of [15, 16, 17, 18, 19, 20]) {
    for (const ia of [14, 15, 16, 17, 18, 19]) {
      let sd = 0, medianOff = 0, n = 0;
      for (const [name, file, lat, lon] of CITIES) {
        const rows = L.loadTable(`${L.DATA}/${file}`);
        const rf = L.residuals(rows, lat, lon, ZONE, 'fajr', { angle: fa, offsetMin: Math.round(0) });
        const ri = L.residuals(rows, lat, lon, ZONE, 'isha', { angle: ia });
        const sf = L.stats(rf), si = L.stats(ri);
        sd += sf.sd + si.sd; n += 2;
        // distance of the residual set from a whole-minute constant (fit quality)
        medianOff += Math.abs(sf.median - Math.round(sf.median)) + Math.abs(si.median - Math.round(si.median));
      }
      const key = { fa, ia, sd: +(sd / n).toFixed(3), medianOff: +(medianOff / n).toFixed(3) };
      if (!best || key.sd < best.sd) best = key;
    }
  }
  return best;
}
const pair = resolve();
out.sharedPairScan = pair;
out.statedOffsets = {
  suhoorEnds: 'fajr minus 5 min (printed "5 minutes allowed between end of Suhur and Fajr")',
  iftar: 'sunset +5 min (printed "5 minutes allowed between sunset and Iftar/Maghrib")',
  asr: 'single shadow (printed); double shadow = +40 min (printed)',
};
L.writeJSON('tmp-nz.json', out);
console.log('PAIR SCAN:', JSON.stringify(pair));
for (const [name, c] of Object.entries(out.cities)) {
  console.log(name, 'fajrImplied', JSON.stringify(c.fajrImpliedAngle), 'ishaImplied', JSON.stringify(c.ishaImpliedAngle));
  console.log(name, 'suhoor', JSON.stringify(c.suhoorEnds_minus_fajr), 'magVsSunset', JSON.stringify(c.magrib_minus_sunset));
  console.log(name, 'others', JSON.stringify(c.otherResiduals));
  console.log(name, 'fajrScan', JSON.stringify(c.fajrScan), 'ishaScan', JSON.stringify(c.ishaScan));
}
