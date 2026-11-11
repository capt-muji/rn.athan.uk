// Read-back audit: a printed series moves smoothly, so a cell that jumps away
// from both neighbours is a candidate misread until it is re-read at high zoom.
import { readFileSync } from 'node:fs';

const FILES = [
  'dz-alger-1447-jumada1.json',
  'dz-alger-1447-jumada2.json',
  'dz-alger-1447-rajab.json',
  'dz-alger-1447-ramadan.json',
  'dz-adrar-1447-jumada1.json',
];
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const toMin = (s) => (s.includes(':') ? Number(s.split(':')[0]) * 60 + Number(s.split(':')[1]) : null);

for (const f of FILES) {
  const doc = JSON.parse(readFileSync(f, 'utf8'));
  const dates = Object.keys(doc.rows).sort();
  const flags = [];
  let span = 0;
  for (let i = 1; i < dates.length; i++) {
    const a = new Date(dates[i - 1] + 'T00:00:00Z');
    const b = new Date(dates[i] + 'T00:00:00Z');
    span += (b - a) / 86400000;
  }
  for (const c of COLS) {
    const v = dates.map((d) => toMin(doc.rows[d][c]));
    for (let i = 1; i < v.length - 1; i++) {
      const jump = v[i] - Math.round((v[i - 1] + v[i + 1]) / 2);
      if (Math.abs(jump) >= 2) flags.push({ date: dates[i], col: c, value: doc.rows[dates[i]][c], jump });
    }
    const deltas = v.slice(1).map((x, i) => x - v[i]);
    const monotone = deltas.every((d) => d >= 0) || deltas.every((d) => d <= 0);
    console.log(`${f} ${c}: n=${v.length} range ${Math.min(...v)}..${Math.max(...v)} monotone=${monotone}`);
  }
  console.log(`${f}: rows=${dates.length} spanDays=${span} daysExactlyRight=${span === dates.length - 1}`);
  if (flags.length) console.log('  flagged:', JSON.stringify(flags));
  console.log('');
}
