// Claim 4: Algeria. My own transcription of Rajab 1448 (PDF page 8) is the calibration month.
// Then score the other 1448 months and the four 1447 months; test reprint vs recompute.
import fs from 'node:fs';
import path from 'node:path';
import { params, times, hm, MODES } from './lib.mjs';

const FIT2 = '$HOME/athan-gitree/census/o1k-wide/fit2';
const FIT11 = '$HOME/athan-gitree/census/o1k-wide/fit11';
const LAT = 36.7538, LNG = 3.0588, TZ = 'Africa/Algiers';
const out = { calibration: "Rajab 1448, dz-marw-calendrier-1448-alger.pdf page 8, transcribed by verify3", transcriptionCheck: {}, fit: {}, scores: {}, reprintTest: {} };

// my own reading of page 8 (day-of-Rajab order), Gregorian date, fajr sunrise zawal asr maghrib isha
const MINE = `2026-12-11 06:18 07:51 12:42 15:14 17:35 19:00
2026-12-12 06:19 07:51 12:42 15:15 17:35 19:00
2026-12-13 06:19 07:52 12:42 15:15 17:36 19:00
2026-12-14 06:20 07:53 12:43 15:15 17:36 19:00
2026-12-15 06:21 07:54 12:43 15:15 17:36 19:01
2026-12-16 06:21 07:54 12:44 15:16 17:36 19:01
2026-12-17 06:22 07:55 12:44 15:16 17:37 19:02
2026-12-18 06:23 07:55 12:45 15:16 17:37 19:02
2026-12-19 06:23 07:56 12:45 15:17 17:38 19:02
2026-12-20 06:24 07:57 12:46 15:17 17:38 19:03
2026-12-21 06:24 07:57 12:46 15:18 17:39 19:03
2026-12-22 06:25 07:58 12:47 15:18 17:39 19:04
2026-12-23 06:25 07:58 12:47 15:19 17:40 19:04
2026-12-24 06:26 07:59 12:48 15:19 17:40 19:05
2026-12-25 06:26 07:59 12:48 15:20 17:41 19:05
2026-12-26 06:26 07:59 12:49 15:21 17:41 19:06
2026-12-27 06:27 08:00 12:49 15:21 17:42 19:07
2026-12-28 06:27 08:00 12:50 15:22 17:43 19:07
2026-12-29 06:28 08:00 12:50 15:22 17:43 19:08
2026-12-30 06:28 08:01 12:51 15:23 17:44 19:09
2026-12-31 06:28 08:01 12:51 15:24 17:45 19:09
2027-01-01 06:28 08:01 12:52 15:25 17:46 19:10
2027-01-02 06:29 08:01 12:52 15:25 17:46 19:11
2027-01-03 06:29 08:01 12:53 15:26 17:47 19:11
2027-01-04 06:29 08:01 12:53 15:27 17:48 19:12
2027-01-05 06:29 08:01 12:54 15:28 17:49 19:13
2027-01-06 06:29 08:01 12:54 15:28 17:50 19:14
2027-01-07 06:29 08:01 12:54 15:29 17:51 19:15
2027-01-08 06:29 08:01 12:55 15:30 17:52 19:15`;
const calib = MINE.trim().split('\n').map(line => {
  const [iso, fajr, sunrise, dhuhr, asr, maghrib, isha] = line.split(' ');
  return { iso, printed: { fajr: hm(fajr), sunrise: hm(sunrise), dhuhr: hm(dhuhr), asr: hm(asr), maghrib: hm(maghrib), isha: hm(isha) } };
});
out.calibration = { month: 'Rajab 1448', rows: calib.length, first: calib[0].iso, last: calib[calib.length - 1].iso };

// check against fit2's transcription of the same page
{
  const theirs = JSON.parse(fs.readFileSync(path.join(FIT2, 'dz-alger-1448-rajab.json'), 'utf8')).rows;
  let cells = 0, mismatch = 0;
  const diffs = [];
  for (const r of calib) {
    const t = theirs[r.iso]; if (!t) { diffs.push({ iso: r.iso, missing: true }); continue; }
    for (const [k, tk] of [['fajr', 'fajr'], ['sunrise', 'sunrise'], ['dhuhr', 'dhuhr'], ['asr', 'asr'], ['maghrib', 'magrib'], ['isha', 'isha']]) {
      cells++;
      if (r.printed[k] !== hm(t[tk])) { mismatch++; diffs.push({ iso: r.iso, col: k, mine: r.printed[k], theirs: hm(t[tk]) }); }
    }
  }
  out.transcriptionCheck = { source: 'fit2/dz-alger-1448-rajab.json', cells, mismatch, diffs: diffs.slice(0, 10) };
}

// --- fit on Rajab 1448 alone ---
function fitColumn(key, { angles = null, isSunset = false, madhab = 'shafi', range = null } = {}) {
  let best = null;
  const angleList = angles || [null];
  for (const ang of angleList) {
    const p = params({ fajr: ang ?? 18, isha: ang ?? 18, madhab });
    for (const mode of ['floor', 'nearest', 'ceil']) for (const margin of range) {
      let n = 0, exact = 0, w1 = 0, worst = 0, sumAbs = 0;
      for (const r of calib) {
        const t = times(LAT, LNG, r.iso, p, TZ);
        const c = key === 'maghrib' ? t.sunset : t[key];
        const printed = r.printed[key];
        if (c == null || printed == null) continue;
        const d = MODES[mode](c + margin) - printed;
        n++; if (d === 0) exact++; if (Math.abs(d) <= 1) w1++; worst = Math.max(worst, Math.abs(d)); sumAbs += Math.abs(d);
      }
      const cand = { angle: ang, mode, margin, n, exact, w1, worst, mae: n ? sumAbs / n : 0 };
      if (!best || cand.exact > best.exact || (cand.exact === best.exact && cand.worst < best.worst) || (cand.exact === best.exact && cand.worst === best.worst && cand.w1 > best.w1)) best = cand;
    }
  }
  return best;
}
const angleRange = [];
for (let a = 16.5; a <= 19.0001; a += 0.01) angleRange.push(Number(a.toFixed(2)));
const ishaRange = [];
for (let a = 14.5; a <= 18.5001; a += 0.01) ishaRange.push(Number(a.toFixed(2)));
const margins = [];
for (let m = -2; m <= 8.0001; m += 0.5) margins.push(Number(m.toFixed(1)));

out.fit.rajabOnly = {
  fajr: fitColumn('fajr', { angles: angleRange, range: margins }),
  sunrise: fitColumn('sunrise', { angles: [null], range: margins }),
  dhuhr: fitColumn('dhuhr', { angles: [null], range: margins }),
  asr: fitColumn('asr', { angles: [null], madhab: 'shafi', range: margins }),
  asrHanafi: fitColumn('asr', { angles: [null], madhab: 'hanafi', range: margins }),
  maghrib: fitColumn('maghrib', { angles: [null], range: margins }),
  isha: fitColumn('isha', { angles: ishaRange, range: margins }),
};
// freeze the best per column
const F = {
  fajr: out.fit.rajabOnly.fajr,
  sunrise: out.fit.rajabOnly.sunrise,
  dhuhr: out.fit.rajabOnly.dhuhr,
  asr: out.fit.rajabOnly.asr,
  maghrib: out.fit.rajabOnly.maghrib,
  isha: out.fit.rajabOnly.isha,
};
out.frozen = Object.fromEntries(Object.entries(F).map(([k, v]) => [k, { angle: v.angle, mode: v.mode, margin: v.margin }]));

// score an arbitrary month file with the frozen recipe
function scoreMonth(rowsMap) {
  const rows = Object.entries(rowsMap).map(([iso, r]) => ({ iso, printed: { fajr: hm(r.fajr), sunrise: hm(r.sunrise), dhuhr: hm(r.dhuhr), asr: hm(r.asr), maghrib: hm(r.magrib ?? r.maghrib), isha: hm(r.isha) } }));
  const p = params({ fajr: F.fajr.angle, isha: F.isha.angle, madhab: 'shafi' });
  const res = {};
  let joint = 0, jointN = 0;
  for (const key of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    const rule = F[key];
    let n = 0, exact = 0, w1 = 0, worst = 0, sumAbs = 0;
    for (const r of rows) {
      const t = times(LAT, LNG, r.iso, p, TZ);
      const c = key === 'maghrib' ? t.sunset : t[key];
      const printed = r.printed[key];
      if (c == null || printed == null || !rule) continue;
      const d = MODES[rule.mode](c + rule.margin) - printed;
      n++; if (d === 0) exact++; if (Math.abs(d) <= 1) w1++; worst = Math.max(worst, Math.abs(d)); sumAbs += Math.abs(d);
    }
    res[key] = { n, exact, w1, worst, mae: n ? sumAbs / n : 0 };
  }
  for (const r of rows) {
    let ok = true;
    for (const key of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
      const rule = F[key]; if (!rule) { ok = false; break; }
      const t = times(LAT, LNG, r.iso, p, TZ);
      const c = key === 'maghrib' ? t.sunset : t[key];
      if (r.printed[key] == null || Math.abs(MODES[rule.mode](c + rule.margin) - r.printed[key]) > 1) { ok = false; break; }
    }
    if (ok) joint++; jointN++;
  }
  res.joint = { n: jointN, allSixWithin1: joint, pct: jointN ? 100 * joint / jointN : 0 };
  return res;
}

// other 1448 months (fit2) and the four 1447 months (fit11)
const months = [
  ['1448-jumada1', FIT2, 'dz-alger-1448-jumada1.json'],
  ['1448-jumada2', FIT2, 'dz-alger-1448-jumada2.json'],
  ['1448-ramadan', FIT2, 'dz-alger-1448-ramadan.json'],
  ['1447-jumada1', FIT11, 'dz-alger-1447-jumada1.json'],
  ['1447-jumada2', FIT11, 'dz-alger-1447-jumada2.json'],
  ['1447-rajab', FIT11, 'dz-alger-1447-rajab.json'],
  ['1447-ramadan', FIT11, 'dz-alger-1447-ramadan.json'],
];
for (const [tag, dir, file] of months) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  out.scores[tag] = { rows: Object.keys(d.rows).length, window: [Object.keys(d.rows)[0], Object.keys(d.rows).slice(-1)[0]], score: scoreMonth(d.rows) };
  console.error('scored', tag, JSON.stringify(out.scores[tag].score.joint));
}

// reprint test: Rajab 1447 vs Rajab 1448, corresponding Hijri day
{
  const y47 = JSON.parse(fs.readFileSync(path.join(FIT11, 'dz-alger-1447-rajab.json'), 'utf8')).rows;
  const y48 = JSON.parse(fs.readFileSync(path.join(FIT2, 'dz-alger-1448-rajab.json'), 'utf8')).rows;
  const k47 = Object.keys(y47).sort(), k48 = Object.keys(y48).sort();
  const cols = [['fajr', 'fajr'], ['sunrise', 'sunrise'], ['dhuhr', 'dhuhr'], ['asr', 'asr'], ['maghrib', 'magrib'], ['isha', 'isha']];
  let cells = 0, same = 0;
  const deltas = [];
  for (let i = 0; i < Math.min(k47.length, k48.length); i++) {
    for (const [a, b] of cols) {
      cells++;
      const x = hm(y47[k47[i]][a]), y = hm(y48[k48[i]][b]);
      if (x === y) same++; else deltas.push(Math.abs(x - y));
    }
  }
  out.reprintTest = {
    rajab1447: [k47[0], k47[k47.length - 1]], rajab1448: [k48[0], k48[k48.length - 1]],
    cells, identical: same, identicalPct: 100 * same / cells,
    meanAbsDiff: deltas.length ? deltas.reduce((p, q) => p + q, 0) / deltas.length : 0,
    maxAbsDiff: deltas.length ? Math.max(...deltas) : 0,
  };
}

// same-Gregorian-date control: the two months are 355 days apart, so a recompute should differ ~0-2 min.
fs.writeFileSync(new URL('./dz.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ calib: out.calibration, check: out.transcriptionCheck, frozen: out.frozen, fitRajab: out.fit.rajabOnly, scores: Object.fromEntries(Object.entries(out.scores).map(([k, v]) => [k, { window: v.window, joint: v.score.joint, perCol: Object.fromEntries(Object.entries(v.score).filter(([kk]) => kk !== 'joint').map(([kk, vv]) => [kk, `${vv.exact}/${vv.n} w1 ${vv.w1} worst ${vv.worst}`])) }])), reprint: out.reprintTest }, null, 1));
