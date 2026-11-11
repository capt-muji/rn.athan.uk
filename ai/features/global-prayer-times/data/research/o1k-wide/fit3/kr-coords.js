// Korea: settle the stated-recipe verdict. MWL ceil at three coord
// hypotheses, per-column, with and without the 2027-01-27 slip day.
// Run: TZ=Asia/Seoul node kr-coords.js
import * as fs from 'node:fs';
import { loadAdhan, methodParams, parseHHMM, evalFixed, secOfDay, scoreLine } from './lib.mjs';

const HOME = process.env.HOME;
const raw = JSON.parse(fs.readFileSync(HOME + '/athan-gitree/census/o1k-wide/koreajapan/data/kmf-seoul-2026-2027.json', 'utf8'));
const adhan = await loadAdhan();
const SLIP = '2027-01-27';
const isos = Object.keys(raw).sort().filter(i => i !== SLIP);
const rows = isos.map(iso => {
  const [y, m, d] = iso.split('-').map(Number);
  const r = raw[iso];
  return { iso, y, m, d, fajr: parseHHMM(r.fajr), sunrise: parseHHMM(r.sunrise), dhuhr: parseHHMM(r.dhuhr), asr: parseHHMM(r.asr), magrib: parseHHMM(r.magrib), isha: parseHHMM(r.isha) };
});
const PICK = { fajr: t => t.fajr, sunrise: t => t.sunrise, dhuhr: t => t.dhuhr, asr: t => t.asr, magrib: t => t.maghrib, isha: t => t.isha };
const COLS = Object.keys(PICK);
const HYP = { stated_37_6_127: [37.6, 127.0], city: [37.5665, 126.9780], masjid: [37.5483, 126.9774] };

for (const [name, [lat, lon]] of Object.entries(HYP)) {
  const c = new adhan.Coordinates(lat, lon);
  console.log('== ' + name + ' (' + lat + ',' + lon + ') MWL ceil, slip day excluded, n=' + rows.length);
  let tex = 0, tw1 = 0;
  for (const col of COLS) {
    const sec = secOfDay(rows, (y, m, d) => new adhan.PrayerTimes(c, new Date(y, m - 1, d), methodParams(adhan, () => adhan.CalculationMethod.MuslimWorldLeague()), ), PICK[col]);
    const r = evalFixed(sec, rows.map(x => x[col]), 0, 'ceil');
    tex += r.exact; tw1 += r.within1;
    console.log('  ' + scoreLine(col, r));
  }
  console.log('  TOTAL exact ' + tex + '/' + (rows.length * 6) + '  within1 ' + tw1 + '/' + (rows.length * 6));
}
