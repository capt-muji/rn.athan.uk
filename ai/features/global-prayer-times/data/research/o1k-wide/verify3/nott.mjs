import fs from 'node:fs';
import { params, times, MODES } from './lib.mjs';
const raw = JSON.parse(fs.readFileSync('$HOME/athan-gitree/census/o1k-wide/uktowns2/data/nottingham-ic-2026.json', 'utf8'));
const hm = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const rows = Object.entries(raw).filter(([iso]) => /^\d{4}-\d{2}-\d{2}$/.test(iso) && !/^2026-(05|06|07)/.test(iso));
const p = params({ fajr: 18, isha: 18, madhab: 'hanafi' });
let best = null;
for (const mode of ['floor', 'ceil', 'nearest']) for (let mg = -15; mg <= 15; mg++) {
  let n = 0, ex = 0, w1 = 0, worst = 0;
  for (const [iso, r] of rows) {
    const c = times(52.9548, -1.1581, iso, p, 'Europe/London').fajr;
    const d = MODES[mode](c + mg) - hm(r.fajr);
    n++; if (d === 0) ex++; if (Math.abs(d) <= 1) w1++; worst = Math.max(worst, Math.abs(d));
  }
  const cand = { mode, mg, n, ex, w1, worst };
  if (!best || cand.w1 > best.w1 || (cand.w1 === best.w1 && cand.ex > best.ex)) best = cand;
}
console.log('NOTTINGHAM 273 rows 18/18 best', JSON.stringify(best));
const cov = JSON.parse(fs.readFileSync('$HOME/athan-gitree/census/o1k-wide/uktowns2/data/coventry-zeenatul-islam-2026.json', 'utf8'));
for (const [iso, r] of Object.entries(cov)) {
  if (iso.startsWith('2026-03')) {
    const F = hm(r.sunrise) - hm(r.fajr);
    if (F > 105 || F < 90) console.log('COV OUTLIER', iso, JSON.stringify(r), 'F', F);
  }
}
