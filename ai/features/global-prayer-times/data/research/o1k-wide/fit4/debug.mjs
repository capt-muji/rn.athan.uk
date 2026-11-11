// Residual structure for one table: per-prayer robust residuals, defect rows,
// month medians, clamp windows. Run: TZ=Europe/London node debug.mjs <tag>
import { loadTable, makeContext } from './engine.mjs';
import fs from 'node:fs';

const HOME = process.env.HOME;
const tag = process.argv[2] ?? 'glasgow';
const cfgs = {
  glasgow: { file: HOME + '/athan-gitree/census/o1k-wide/ukscotland/data/glasgow-central-mosque-2026.json', cols: { fajr: 'fajr_begins', sunrise: 'sunrise', dhuhr: 'zuhr_begins', asr: 'asr_mithl_1', maghrib: 'maghrib_begins', isha: 'isha_begins' }, lat: 55.8609, lng: -4.2479, fa: 18.2, is: 18.1 },
  dundee: { file: HOME + '/athan-gitree/census/o1k-wide/ukscotland/data/dundee-almaktoum-mosque-2026.json', cols: { fajr: 'fajr_begins', sunrise: 'sunrise', dhuhr: 'zuhr_begins', asr: 'asr_mithl_1', maghrib: 'maghrib_begins', isha: 'isha_begins' }, lat: 56.4620, lng: -2.9707, fa: 18.1, is: 15.25 },
  aberdeen: { file: HOME + '/athan-gitree/census/o1k-wide/ukscotland/data/aberdeen-amic-central-2026.json', cols: { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'magrib', isha: 'isha' }, lat: 57.1499, lng: -2.0938, fa: 18, is: 15 },
};
const cfg = cfgs[tag];
const t = loadTable(cfg);
const ctx = await makeContext(cfg.lat, cfg.lng, t.slots);

const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const toMin = (sec) => sec / 60;

// solar residuals (raw, no margin) -> median per month + defect rows
const chartOf = (p) => t.slots.map((s) => s.chart[p]);
for (const p of ['sunrise', 'dhuhr', 'asr', 'maghrib']) {
  if (chartOf(p)[0] === undefined) continue;
  const rawKey = p === 'asr' ? 'asr1' : p;
  const res = t.slots.map((s, i) => s.chart[p] - toMin(ctx.raw[rawKey][i]));
  const m = med(res);
  const bad = [];
  for (let i = 0; i < t.slots.length; i++) if (Math.abs(res[i] - m) > 2.5) bad.push(`${t.slots[i].key} chart ${Math.floor(t.slots[i].chart[p] / 60)}:${String(t.slots[i].chart[p] % 60).padStart(2, '0')} res ${(res[i] - m).toFixed(1)}`);
  console.log(`\n== ${p}: median residual ${m.toFixed(1)} min, ${bad.length} defect rows (|res-med|>2.5)`);
  for (const b of bad.slice(0, 40)) console.log('  ' + b);
}

// fajr/isha residuals vs candidate pair where the angle exists
for (const [p, ang] of [['fajr', cfg.fa], ['isha', cfg.is]]) {
  const rows = [];
  for (let i = 0; i < t.slots.length; i++) {
    const sec = p === 'fajr' ? ctx.pairSec(i, cfg.fa, cfg.is, null).f : ctx.pairSec(i, cfg.fa, cfg.is, null).i;
    if (sec !== null) rows.push([i, t.slots[i].chart[p] - toMin(sec)]);
  }
  const m = med(rows.map((r) => r[1]));
  const byMonth = {};
  for (const [i, r] of rows) { const mo = t.slots[i].key.slice(5, 7); (byMonth[mo] ??= []).push(r - m); }
  console.log(`\n== ${p} @ ${ang} deg: median residual ${m.toFixed(1)}; month medians (res-med):`);
  console.log('  ' + Object.entries(byMonth).map(([mo, a]) => `${mo}:${med(a).toFixed(1)}(n=${a.length})`).join('  '));
}
