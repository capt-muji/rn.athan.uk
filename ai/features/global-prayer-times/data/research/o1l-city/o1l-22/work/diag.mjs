import fs from 'node:fs';
const S = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const slug = process.argv[3];
const surf = S[slug];
const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const dates = Object.keys(surf.days).sort().filter((d) => !d.endsWith('02-29'));
const pick = dates.filter((d) => d.endsWith('-01') || d.endsWith('-15'));
for (const d of pick) {
  const r = surf.days[d];
  const m = Object.fromEntries(Object.entries(r).map(([k, v]) => [k, toMin(v)]));
  console.log(d, 'fajr', r.fajr, 'sun', r.sunrise, 'dhuhr', r.dhuhr, 'asr', r.asr, 'maghrib', r.maghrib, 'isha', r.isha,
    '| isha-maghrib', m.isha - m.maghrib, '| fajr-sunrise', m.fajr - m.sunrise, '| dhuhr-sunrise', m.dhuhr - m.sunrise);
}
