// Independent re-derivation of the headline numbers, written from scratch against the
// raw JSON so a bug in compare.mjs cannot hide. Run: TZ=Europe/London node verify.mjs
import fs from 'fs';
import { generateYear } from '../fit/predict.mjs';

const ROOT = new URL('../', import.meta.url).pathname;
const truth = JSON.parse(fs.readFileSync(ROOT + 'truth/truth-2028-2038.json', 'utf8'));
const src = JSON.parse(fs.readFileSync(ROOT + 'data/2027.json', 'utf8'));
const P = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const m = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));

const dates = Object.keys(truth).sort();
console.log('truth rows', dates.length, 'first', dates[0], 'last', dates.at(-1));

let worstAll = 0, exactAll = 0, withinAll = 0, nAll = 0;
const leaps = {};
for (let y = 2028; y <= 2038; y++) {
  const gen = generateYear(y);
  let worst = 0, exact = 0, within = 0, n = 0;
  for (const k of dates.filter((d) => d.startsWith(String(y)))) {
    if (!gen[k]) throw new Error('missing ' + k);
    if (Object.keys(gen[k]).length !== 7) throw new Error('key shape ' + k);
    for (const p of P) {
      const e = Math.abs(m(gen[k][p]) - m(truth[k][p]));
      n++; if (e === 0) exact++; if (e <= 1) within++; if (e > worst) worst = e;
    }
  }
  if (Object.keys(gen).length !== dates.filter((d) => d.startsWith(String(y))).length) throw new Error('day count ' + y);
  leaps[y] = { n, exact, within, worst };
  nAll += n; exactAll += exact; withinAll += within; if (worst > worstAll) worstAll = worst;
}
console.log(JSON.stringify(leaps, null, 1));
console.log('ALL', { nAll, exactAll, withinAll, worstAll, exactPct: +(100 * exactAll / nAll).toFixed(2), withinPct: +(100 * withinAll / nAll).toFixed(2) });

// Naive arm, independent: literal 2027 MM-DD replay, 02-29 = half-up mean of 02-28/03-01.
const fill = {};
for (const p of P) fill[p] = Math.floor((m(src['2027-02-28'][p]) + m(src['2027-03-01'][p])) / 2 + 0.5);
let nw = 0, ew = 0, ww = 0, wWorst = 0;
for (const k of dates) {
  const md = k.slice(5);
  const row = md === '02-29'
    ? Object.fromEntries(P.map((p) => [p, fill[p]]))
    : Object.fromEntries(P.map((p) => [p, m(src['2027-' + md][p])]));
  for (const p of P) {
    const e = Math.abs(row[p] - m(truth[k][p]));
    nw++; if (e === 0) ew++; if (e <= 1) ww++; if (e > wWorst) wWorst = e;
  }
}
console.log('NAIVE', { nw, ew, ww, wWorst, exactPct: +(100 * ew / nw).toFixed(2), withinPct: +(100 * ww / nw).toFixed(2) });
console.log('fill 02-29', JSON.stringify(Object.fromEntries(P.map((p) => [p, `${String(Math.floor(fill[p] / 60)).padStart(2, '0')}:${String(fill[p] % 60).padStart(2, '0')}`]))));
