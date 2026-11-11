// Algeria: joint fit across the two Hijri years, and score of the published constants.
import fs from 'node:fs';
import path from 'node:path';
import { params, times, hm, MODES } from './lib.mjs';

const FIT2 = '$HOME/athan-gitree/census/o1k-wide/fit2';
const FIT11 = '$HOME/athan-gitree/census/o1k-wide/fit11';
const LAT = 36.7538, LNG = 3.0588, TZ = 'Africa/Algiers';
const FILES = {
  1447: ['dz-alger-1447-jumada1', 'dz-alger-1447-jumada2', 'dz-alger-1447-rajab', 'dz-alger-1447-ramadan'],
  1448: ['dz-alger-1448-jumada1', 'dz-alger-1448-jumada2', 'dz-alger-1448-rajab', 'dz-alger-1448-ramadan'],
};
const out = { joints: {}, published: {}, family: {} };

function loadYear(y) {
  const rows = [];
  for (const f of FILES[y]) {
    const dir = y === '1447' ? FIT11 : FIT2;
    const d = JSON.parse(fs.readFileSync(path.join(dir, f + '.json'), 'utf8')).rows;
    for (const [iso, r] of Object.entries(d)) rows.push({ iso, month: f, printed: { fajr: hm(r.fajr), sunrise: hm(r.sunrise), dhuhr: hm(r.dhuhr), asr: hm(r.asr), maghrib: hm(r.magrib ?? r.maghrib), isha: hm(r.isha) } });
  }
  return rows.sort((a, b) => a.iso.localeCompare(b.iso));
}
const ROWS = { 1447: loadYear('1447'), 1448: loadYear('1448') };
ROWS.all = [...ROWS['1447'], ...ROWS['1448']];
out.rows = Object.fromEntries(Object.entries(ROWS).map(([k, v]) => [k, v.length]));

function score(rows, key, angle, mode, margin, madhab = 'shafi', isSunset = false) {
  const p = params({ fajr: key === 'isha' ? 18 : angle, isha: key === 'isha' ? angle : 18, madhab });
  let n = 0, exact = 0, w1 = 0, worst = 0, sumAbs = 0;
  for (const r of rows) {
    const t = times(LAT, LNG, r.iso, p, TZ);
    const c = isSunset ? t.sunset : t[key];
    const printed = r.printed[key];
    if (c == null || printed == null) continue;
    const d = MODES[mode](c + margin) - printed;
    n++; if (d === 0) exact++; if (Math.abs(d) <= 1) w1++; worst = Math.max(worst, Math.abs(d)); sumAbs += Math.abs(d);
  }
  return { n, exact, w1, worst, mae: n ? sumAbs / n : 0 };
}

function fitAngle(rows, key, lo, hi, step) {
  let best = null;
  for (let a = lo; a <= hi + 1e-9; a += step) {
    const ang = Number(a.toFixed(3));
    for (const mode of ['floor', 'ceil', 'nearest']) for (let m = -2; m <= 2.0001; m += 0.5) {
      const s = score(rows, key, ang, mode, Number(m.toFixed(1)));
      const cand = { angle: ang, mode, margin: Number(m.toFixed(1)), ...s };
      if (!best || cand.exact > best.exact || (cand.exact === best.exact && cand.worst < best.worst) || (cand.exact === best.exact && cand.worst === best.worst && cand.w1 > best.w1)) best = cand;
    }
  }
  return best;
}
function fitMargin(rows, key, lo, hi, madhab = 'shafi', isSunset = false) {
  let best = null;
  for (const mode of ['floor', 'ceil', 'nearest']) for (let m = lo; m <= hi + 1e-9; m += 0.5) {
    const s = score(rows, key, 18, mode, Number(m.toFixed(1)), madhab, isSunset);
    const cand = { mode, margin: Number(m.toFixed(1)), ...s };
    if (!best || cand.exact > best.exact || (cand.exact === best.exact && cand.worst < best.worst) || (cand.exact === best.exact && cand.worst === best.worst && cand.w1 > best.w1)) best = cand;
  }
  return best;
}

for (const [tag, rows] of Object.entries(ROWS)) {
  out.joints[tag] = {
    fajr: fitAngle(rows, 'fajr', 17.2, 18.4, 0.02),
    isha: fitAngle(rows, 'isha', 15, 17.2, 0.02),
    dhuhr: fitMargin(rows, 'dhuhr', -2, 4),
    asr: fitMargin(rows, 'asr', -2, 4),
    asrHanafi: fitMargin(rows, 'asr', -2, 4, 'hanafi'),
    maghrib: fitMargin(rows, 'maghrib', 0, 8, 'shafi', true),
    sunrise: fitMargin(rows, 'sunrise', -2, 4),
  };
  console.error('joint', tag, 'fajr', out.joints[tag].fajr.angle, out.joints[tag].fajr.mode, out.joints[tag].fajr.margin, 'isha', out.joints[tag].isha.angle, out.joints[tag].isha.mode, out.joints[tag].isha.margin);
}

// the published constants (fit2 / night summary): fajr 17.80 floor 0; isha 16.10 nearest +5;
// sunrise +1; dhuhr +1; asr Shafi +1; maghrib +4.
const PUB = { fajr: [17.8, 'floor', 0], isha: [16.1, 'nearest', 5], sunrise: [null, 'floor', 1], dhuhr: [null, 'floor', 1], asr: [null, 'floor', 1], maghrib: [null, 'floor', 4] };
for (const [tag, rows] of Object.entries(ROWS)) {
  out.published[tag] = {};
  for (const key of ['fajr', 'isha', 'sunrise', 'dhuhr', 'asr', 'maghrib']) {
    const [ang, mode, m] = PUB[key];
    out.published[tag][key] = score(rows, key, ang, mode, m, 'shafi', key === 'maghrib');
  }
}

// the degenerate family: my Rajab-only pair and the published pair, scored against each other's rows
out.family = {
  mine: { fajr: [17.39, 'floor', -2], isha: [15.73, 'floor', 7.5] },
  published: PUB,
  mineOnAll: {}, publishedOnAll: {},
};
for (const tag of ['1447', '1448', 'all']) {
  const rows = ROWS[tag];
  out.family.mineOnAll[tag] = { fajr: score(rows, 'fajr', 17.39, 'floor', -2), isha: score(rows, 'isha', 15.73, 'floor', 7.5) };
  out.family.publishedOnAll[tag] = { fajr: score(rows, 'fajr', 17.8, 'floor', 0), isha: score(rows, 'isha', 16.1, 'nearest', 5) };
}

fs.writeFileSync(new URL('./dz2.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
