// islamweb winter angle + summer cap isolation.
// Run: TZ=Europe/Oslo node nowinter.mjs
import { loadTable, makeContext } from './engine.mjs';
const HOME = process.env.HOME;
const E = HOME + '/athan-gitree/census/o1k-wide/europe/data/';
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };

for (const [tag, lat, lng] of [['oslo', 59.9139, 10.7522], ['bergen', 60.3913, 5.3221], ['kristiansand', 58.1461, 7.9956]]) {
  const t = loadTable({ file: `${E}no-islamweb-${tag}-2026.json`, cols: { fajr: 'fajr', sunrise: 'sunrise', maghrib: 'magrib', isha: 'isha' } });
  const ctx = await makeContext(lat, lng, t.slots);
  console.log(`\n### ${tag}`);
  for (const [p, sign] of [['fajr', 1], ['isha', -1]]) {
    const lines = [];
    for (let a = 13; a <= 21.01; a += 0.5) {
      const byMo = {};
      for (let i = 0; i < t.slots.length; i++) {
        const sec = p === 'fajr' ? ctx.pairSec(i, a, 15, null).f : ctx.pairSec(i, 18, a, null).i;
        if (sec === null) continue;
        const chart = p === 'fajr' ? t.slots[i].chart.fajr : t.slots[i].chart.isha;
        const res = chart - sign * -1 * 0 - sec / 60; // chart - computed
        (byMo[t.slots[i].key.slice(5, 7)] ??= []).push(res);
      }
      const mo = {};
      for (const [m, arr] of Object.entries(byMo)) mo[m] = med(arr);
      const winter = ['11', '12', '01', '02'].map((m) => mo[m]).filter((x) => !isNaN(x));
      const wSpread = med(winter.map((x) => Math.abs(x - med(winter))));
      lines.push(`${a.toFixed(1)}: winter med ${med(winter).toFixed(1)} mad ${(wSpread).toFixed(1)} | 12:${(mo['12'] ?? NaN).toFixed(0)} 03:${(mo['03'] ?? NaN).toFixed(0)} 06:${(mo['06'] ?? NaN).toFixed(0)} 09:${(mo['09'] ?? NaN).toFixed(0)}`);
    }
    console.log(`${p}:`);
    for (const l of lines) console.log('  ' + l);
  }
  // summer lead/night + lag/night
  const fn = [], ln = [];
  for (let i = 0; i < t.slots.length; i++) {
    const k = t.slots[i].key.slice(5, 7);
    if (!['05', '06', '07', '08'].includes(k)) continue;
    const night = ctx.night[i] / 60;
    fn.push([(t.slots[i].chart.sunrise - t.slots[i].chart.fajr) / night, k]);
    ln.push([(t.slots[i].chart.isha - t.slots[i].chart.maghrib) / night, k]);
  }
  const agg = (arr) => { const o = {}; for (const [v, k] of arr) (o[k] ??= []).push(v); return Object.entries(o).map(([k, a]) => `${k}:${med(a).toFixed(3)}`).join(' '); };
  console.log('fajr lead/night: ' + agg(fn));
  console.log('isha lag/night: ' + agg(ln));
}
