// Glasgow vs Dundee: MSC seasonal twilight + wall-clock clamp hypotheses.
// Run: TZ=Europe/London node msc-test.mjs
import { loadAdhan } from './lib.mjs';
import { loadTable, makeContext } from './engine.mjs';

const HOME = process.env.HOME;
const adhan = await loadAdhan();
const { pathToFileURL } = await import('node:url');
const Astro = (await import(pathToFileURL(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Astronomical.js'))).default;

const dayOfYear = (d) => {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
};
const mins = (dt) => dt.getHours() * 60 + dt.getMinutes();
const fmt = (v) => `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;

for (const [name, file, lat, lng] of [
  ['glasgow', HOME + '/athan-gitree/census/o1k-wide/ukscotland/data/glasgow-central-mosque-2026.json', 55.8609, -4.2479],
  ['dundee', HOME + '/athan-gitree/census/o1k-wide/ukscotland/data/dundee-almaktoum-mosque-2026.json', 56.4620, -2.9707],
]) {
  const cfg = { file, cols: { fajr: 'fajr_begins', sunrise: 'sunrise', dhuhr: 'zuhr_begins', asr: 'asr_mithl_1', maghrib: 'maghrib_begins', isha: 'isha_begins' } };
  const t = loadTable(cfg);
  const ctx = await makeContext(lat, lng, t.slots);
  console.log(`\n### ${name}`);
  // MSC seasonal twilight (as adhan applies for method MSC at lat>=55):
  // fajr = max(seasonalTwilight, sunrise - night/7); isha = min? -> adhan: isha = later-of replaced by night/7 then safe<isha
  // adhan MSC above 55: fajrTime := sunrise - night/7 (replaces angle), safeFajr = seasonAdjustedMorningTwilight,
  // fajr = later(safeFajr, fajrTime). ishaTime := sunset + night/7, safeIsha = seasonAdjustedEveningTwilight,
  // isha = earlier(safeIsha, ishaTime).
  let eF = 0, eI = 0, nF = 0, nI = 0;
  const resF = [], resI = [];
  for (let i = 0; i < t.slots.length; i++) {
    const d = t.slots[i].date;
    const doy = dayOfYear(d);
    const safeF = Astro.seasonAdjustedMorningTwilight(lat, doy, d.getFullYear(), ctx.srDate[i]);
    const safeI = Astro.seasonAdjustedEveningTwilight(lat, doy, d.getFullYear(), ctx.ssDate[i], 'general');
    const sevF = new Date(ctx.srDate[i].getTime() - ctx.night[i] * 1000 / 7);
    const sevI = new Date(ctx.ssDate[i].getTime() + ctx.night[i] * 1000 / 7);
    const fajr = sevF > safeF ? sevF : safeF;
    const isha = sevI < safeI ? sevI : safeI;
    const cf = t.slots[i].chart.fajr, ci = t.slots[i].chart.isha;
    const rf = cf - mins(fajr), ri = ci - mins(isha);
    if (Math.abs(rf) <= 1 || Math.abs(rf - 1440) <= 1) eF++;
    if (Math.abs(ri) <= 1 || Math.abs(ri + 1440) <= 1) eI++;
    if (Math.abs(rf) <= 3 || Math.abs(rf - 1440) <= 3) nF++;
    if (Math.abs(ri) <= 3 || Math.abs(ri + 1440) <= 3) nI++;
    resF.push([t.slots[i].key, rf]); resI.push([t.slots[i].key, ri]);
  }
  console.log(`MSC twilight(>=55 rule): fajr exact±0 ${eF}/365 ±1min ${nF}; isha exact±0 ${eI}/365 ±1min ${nI}`);
  const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
  const byMonth = {};
  for (const [k, r] of resF) { const mo = k.slice(5, 7); (byMonth[mo] ??= []).push(r); }
  console.log('fajr month medians:', Object.entries(byMonth).map(([mo, a]) => `${mo}:${med(a.filter((x) => Math.abs(x) < 90)).toFixed(1)}(n=${a.length})`).join(' '));
  const byM2 = {};
  for (const [k, r] of resI) { const mo = k.slice(5, 7); (byM2[mo] ??= []).push(r); }
  console.log('isha month medians:', Object.entries(byM2).map(([mo, a]) => `${mo}:${med(a.filter((x) => Math.abs(x) < 90)).toFixed(1)}(n=${a.length})`).join(' '));

  // clamp windows: runs of >=5 identical minutes for fajr/isha
  for (const [p, ch] of [['fajr', t.slots.map((s) => s.chart.fajr)], ['isha', t.slots.map((s) => s.chart.isha)]]) {
    const runs = [];
    let start = 0;
    for (let i = 1; i <= ch.length; i++) {
      if (i === ch.length || ch[i] !== ch[start]) {
        if (i - start >= 5) runs.push(`${t.slots[start].key}..${t.slots[i - 1].key} @${fmt(ch[start])} (${i - start}d)`);
        start = i;
      }
    }
    console.log(`${p} constant runs >=5: ${runs.length ? runs.join(' | ') : 'none'}`);
  }
}
