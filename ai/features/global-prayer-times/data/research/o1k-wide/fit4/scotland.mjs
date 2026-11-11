// Job 1: the Scottish own tables. Glasgow + Dundee full years, Edinburgh month,
// Aberdeen Google-Sheets pair. Free fit + named candidates per mosque.
// Run: TZ=Europe/London node scotland.mjs
import fs from 'node:fs';
import { fitTable, printTable } from './engine.mjs';

const HOME = process.env.HOME;
const D = HOME + '/athan-gitree/census/o1k-wide/ukscotland/data/';
const OUT = HOME + '/athan-gitree/census/o1k-wide/fit4/scotland-fit.json';

const dptCols = { fajr: 'fajr_begins', sunrise: 'sunrise', dhuhr: 'zuhr_begins', asr: 'asr_mithl_1', maghrib: 'maghrib_begins', isha: 'isha_begins' };
const sheetCols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'magrib', isha: 'isha' };

const candidates = [
  { name: 'Wifaqul 18/15 caps 1/2+1/7', fa: 18, is: 15, portions: { fajr: 1 / 2, isha: 1 / 7 } },
  { name: 'Wifaqul 18/15 bare', fa: 18, is: 15 },
  { name: 'MWL 18/17 bare', fa: 18, is: 17 },
  { name: 'Diyanet-Europe 18/16 bare', fa: 18, is: 16 },
  { name: 'Karachi 18/18 bare', fa: 18, is: 18 },
  { name: 'Moonsighting 18/18 caps 1/7+1/7', fa: 18, is: 18, portions: { fajr: 1 / 7, isha: 1 / 7 } },
];

const tables = [
  { tag: 'glasgow-central', file: D + 'glasgow-central-mosque-2026.json', cols: dptCols, lat: 55.8609, lng: -4.2479, tz: 'Europe/London' },
  { tag: 'dundee-almaktoum', file: D + 'dundee-almaktoum-mosque-2026.json', cols: dptCols, lat: 56.4620, lng: -2.9707, tz: 'Europe/London' },
  { tag: 'edinburgh-central', file: D + 'edinburgh-central-mosque-2026-11.json', cols: { fajr: 'fajr', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'magrib', isha: 'isha' }, lat: 55.9440, lng: -3.1932, tz: 'Europe/London' },
  { tag: 'aberdeen-amic-central', file: D + 'aberdeen-amic-central-2026.json', cols: sheetCols, lat: 57.1499, lng: -2.0938, tz: 'Europe/London' },
  { tag: 'aberdeen-amic-spital', file: D + 'aberdeen-amic-spital-2026.json', cols: sheetCols, lat: 57.1499, lng: -2.0938, tz: 'Europe/London' },
];

const out = { job: 'scotland', meta: { adhan: '4.4.6', discipline: 'second resolution then explicit rounding', candidates: candidates.map((c) => c.name) }, tables: [] };
for (const t of tables) {
  const res = await fitTable(t, candidates);
  out.tables.push(res);
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  printTable(res);
}
console.log('\nwrote scotland-fit.json');
