// Job 2 held-object scoring: census recipe 18/18, dhuhr +7, maghrib +2,
// fajr FLOOR, isha CEIL against 2024, 2025, and the 4-city today rows.
// Run: TZ=Africa/Tunis node tn-hold.mjs
import fs from 'node:fs';
import { loadAdhan, p2m, parseHHMM, evalFixed, scoreLine } from './lib.mjs';

const HOME = process.env.HOME;
const adhan = await loadAdhan();
const FIELDS = ['fajr', 'dhuhr', 'asr', 'magrib', 'isha'];
const PT_NAME = { fajr: 'fajr', dhuhr: 'dhuhr', asr: 'asr', magrib: 'maghrib', isha: 'isha' };
const secOf = (x) => x.getHours() * 3600 + x.getMinutes() * 60 + x.getSeconds();

function loadYear(y) {
  const rows = JSON.parse(fs.readFileSync(`${HOME}/athan-gitree/census/o1k-wide/northafrica2/data/tn-inm-tunis-${y}.json`, 'utf8'));
  const keys = Object.keys(rows).sort();
  return keys.map((key) => {
    const [yy, m, d] = key.split('-').map(Number);
    return { key, date: new Date(yy, m - 1, d), chart: Object.fromEntries(FIELDS.map((f) => [f, parseHHMM(rows[key][f])])) };
  });
}

function heldStats(slots, lat, lng) {
  const params = new adhan.CalculationParameters(null, 18, 18);
  params.rounding = 'none';
  params.madhab = 'shafi';
  const coords = new adhan.Coordinates(lat, lng);
  const sec = {};
  for (const f of FIELDS) sec[f] = new Float64Array(slots.length);
  for (let i = 0; i < slots.length; i++) {
    const pt = new adhan.PrayerTimes(coords, slots[i].date, params);
    for (const f of FIELDS) sec[f][i] = secOf(pt[PT_NAME[f]]);
  }
  const MARGIN = { fajr: 0, dhuhr: 7, asr: 0, magrib: 2, isha: 0 };
  const MODE = { fajr: 'floor', dhuhr: 'nearest', asr: 'nearest', magrib: 'nearest', isha: 'ceil' };
  const per = {};
  for (const f of FIELDS) per[f] = evalFixed(sec[f], Int32Array.from(slots, (s) => s.chart[f]), MARGIN[f], MODE[f]);
  return { per, sec };
}

const out = {};
for (const y of [2024, 2025]) {
  const slots = loadYear(y);
  const { per } = heldStats(slots, 36.8, 10.18);
  const total = Object.values(per).reduce((a, r) => a + r.exact, 0);
  console.log(`== held recipe on ${y} (Tunis 36.8/10.18), total exact ${total}/${slots.length * 5} ==`);
  for (const [f, r] of Object.entries(per)) console.log('  ' + scoreLine(f, r));
  out[y] = per;
}

// rounding-mode sensitivity at frozen margins (dhuhr/asr/maghrib unspecified by the census)
console.log('\n== rounding sensitivity at frozen margins (fajr floor, isha ceil held fixed) ==');
for (const y of [2024, 2025]) {
  const slots = loadYear(y);
  const { sec } = heldStats(slots, 36.8, 10.18);
  for (const [f, modes] of [['dhuhr', ['floor', 'ceil', 'nearest']], ['asr', ['floor', 'ceil', 'nearest']], ['magrib', ['floor', 'ceil', 'nearest']]]) {
    const chart = Int32Array.from(slots, (s) => s.chart[f]);
    const m = { dhuhr: 7, asr: 0, magrib: 2 }[f];
    const line = modes.map((mode) => {
      const r = evalFixed(sec[f], chart, m, mode);
      return `${mode} ${r.exact}/w1 ${r.within1}/worst ${r.worst}`;
    }).join('   ');
    console.log(`${y} ${f} margin ${m}: ${line}`);
  }
}

// 4-city today rows, 2026-11-10
const today = JSON.parse(fs.readFileSync(HOME + '/athan-gitree/census/o1k-wide/northafrica2/data/tn-inm-today-2026-11-10.json', 'utf8'));
const row = today['2026-11-10'];
console.log('\n== held recipe vs 4-city today rows (2026-11-10) ==');
for (const [city, c] of Object.entries(row)) {
  const lat = Number(c.lat.trim()), lng = Number(c.lng.trim());
  const slot = [{ key: '2026-11-10', date: new Date(2026, 10, 10), chart: Object.fromEntries(FIELDS.map((f) => [f, parseHHMM(c[f])])) }];
  const { per } = heldStats(slot, lat, lng);
  const summary = FIELDS.map((f) => `${f} ${per[f].exact ? 'exact' : (per[f].worst === 1 ? '+/-1' : 'off ' + per[f].worst)}`).join('  ');
  console.log(`${city.padEnd(9)} (${lat}, ${lng}): ${summary}`);
}
fs.writeFileSync(HOME + '/athan-gitree/census/o1k-wide/fit1/tn-hold.json', JSON.stringify(out, null, 1));
console.log('\nwrote tn-hold.json');
