// Seasonal wiggle of the fajr residual at 15 deg, per job3 set.
import fs from 'node:fs';
import { load, computeCols, chartOf, roundMin } from './lib.mjs';

const adhan = await load();
const j = JSON.parse(fs.readFileSync('job3-us.json'));
const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const sets = Object.keys(j).filter((k) => j[k].joint);
const out = {};
for (const k of sets) {
  const meta = j[k];
  const raw = JSON.parse(fs.readFileSync(process.env.HOME + '/athan-gitree/census/o1k-wide/' + meta.file));
  let dates, rows;
  if (raw.data && raw.data.salah) {
    dates = []; rows = [];
    for (const r of raw.data.salah) {
      const m = /^([A-Za-z]+) (\d+), (\d+)$/.exec(r.date.replace(/^[A-Za-z]+,\s*/, ''));
      dates.push(`${m[3]}-${String(MONTHS[m[1]]).padStart(2, '0')}-${String(+m[2]).padStart(2, '0')}`);
      const t24 = (s) => { const t = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(s); let h = +t[1] % 12; if (/pm/i.test(t[3])) h += 12; return String(h).padStart(2, '0') + ':' + t[2]; };
      rows.push({ fajr: t24(r.fajr) });
    }
  } else {
    dates = Object.keys(raw).sort();
    rows = dates.map((d) => ({ fajr: raw[d].fajr }));
  }
  const ser = computeCols(adhan, meta.coords, meta.tz, dates, { fajr: { kind: 'angle', v: 15, after: false } });
  const chart = chartOf(rows, ['fajr']);
  const by = {};
  for (let i = 0; i < dates.length; i++) { const m = dates[i].slice(0, 7); (by[m] ||= []).push(chart.fajr[i] - roundMin(ser.fajr[i] / 60, meta.rounding)); }
  const means = Object.values(by).map((v) => v.reduce((a, x) => a + x, 0) / v.length);
  const wiggle = Math.max(...means) - Math.min(...means);
  out[k] = { wiggle: +wiggle.toFixed(2), monthlyMeans: means.map((x) => +x.toFixed(2)) };
  console.log(k.padEnd(30), 'wiggle', wiggle.toFixed(2), 'means', means.map((x) => x.toFixed(1)).join(','));
}
fs.writeFileSync('job3-wiggle.json', JSON.stringify(out, null, 1));
console.log('wrote job3-wiggle.json');
