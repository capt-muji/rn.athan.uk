// LUPT diff row listing with englishtowns' exact parse path.
// Run: TZ=Europe/London node ludiff.mjs
import fs from 'node:fs';
const HOME = process.env.HOME;
const D = HOME + '/athan-gitree/census/o1k-wide/uktowns2/data/';
const townFile = process.argv[2] ?? 'reading-amic-2026.json';
const townCols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr1', maghrib: 'magrib', isha: 'isha' };

const luptByMMDD = {};
for (const mo of ['01', '02', '04', '07', '11', '12']) {
  const d = JSON.parse(fs.readFileSync(`${D}lupt-2027-${mo}.json`, 'utf8'));
  for (const [k, row] of Object.entries(d)) luptByMMDD[k.slice(5)] = row;
}
const luCols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr1', maghrib: 'magrib', isha: 'isha' };
const pmLu = {};
for (const [p, col] of Object.entries(luCols)) {
  const vals = Object.values(luptByMMDD).map((r) => String(r[col] ?? '').trim());
  pmLu[p] = vals.some((v) => /^(\d{1,2}):/.exec(v) && parseInt(/^(\d{1,2}):/.exec(v)[1], 10) <= 9) && p !== 'fajr' && p !== 'sunrise';
}
console.log('pmLu', JSON.stringify(pmLu));
const parseLu = (v, p) => {
  if (!/^\d{1,2}:\d{2}$/.test(v)) return null;
  let h = parseInt(v.slice(0, v.indexOf(':')), 10);
  const m = parseInt(v.slice(-2), 10);
  if (pmLu[p] && h < 12) h += 12;
  return h * 60 + m;
};
const data = JSON.parse(fs.readFileSync(D + townFile, 'utf8'));
const byMo = {};
for (const [k, row] of Object.entries(data)) {
  const lu = luptByMMDD[k.slice(5)];
  if (!lu) continue;
  const a = parseLu(String(row[townCols.dhuhr] ?? '').trim(), 'dhuhr');
  const b = parseLu(String(lu.dhuhr ?? '').trim(), 'dhuhr');
  if (a === null || b === null) continue;
  (byMo[k.slice(5, 7)] ??= []).push([k, a - b, String(row[townCols.dhuhr]).trim(), String(lu.dhuhr).trim()]);
}
for (const [mo, arr] of Object.entries(byMo)) {
  const diffs = arr.map((x) => x[1]);
  const mean = diffs.reduce((x, y) => x + y, 0) / diffs.length;
  console.log(`${mo}: n=${diffs.length} mean ${mean.toFixed(1)} min ${Math.min(...diffs)} max ${Math.max(...diffs)}`);
  for (const [k, d, ta, tb] of arr.filter((x) => Math.abs(x[1]) > 20).slice(0, 4)) console.log(`   ${k} town ${ta} lupt ${tb} diff ${d}`);
}
