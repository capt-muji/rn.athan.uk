// The federation's dhuhr doctrine: is the printed azan a month-block constant
// centred on solar noon + 33? Checked over all 12 months of the 2021 annual.
import { readFileSync } from 'node:fs';
import { loadAdhan, sun, tzOffsetMinutes, parseHHMM } from './lib.mjs';

const LAT = 12.3714, LNG = -1.5197, TZ = 'Africa/Ouagadougou';
const A = await loadAdhan();
const TXT = process.env.HOME + '/athan-gitree/census/o1k-wide/sahel2/captures/msbf-heures-priere-2021-extracted.txt';

const MONTHS = { Janvier: 1, 'Février': 2, Mars: 3, Avril: 4, Mai: 5, Juin: 6, Juillet: 7, 'Août': 8, Septembre: 9, Octobre: 10, Novembre: 11, 'Décembre': 12 };
const TIMES = /(\d{2}:\d{2})(?:\s+(\d{2}:\d{2})){9}/;
const pages = readFileSync(TXT, 'utf8').split(/===== PAGE \d+ =====/).slice(1);

const rows = [];
pages.forEach((page, i) => {
  const label = page.match(/(Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre)\s+(\d{4})/);
  if (!label) { console.log('page', i + 1, 'no month label'); return; }
  const month = MONTHS[label[1]], year = +label[2];
  for (const line of page.split('\n')) {
    if (!TIMES.test(line)) continue;
    const day = /^\s*(?:Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)?\s*\S*\s*(\d{1,2})\s+(\d{1,2})\s+/.exec(line);
    if (!day) continue;
    const t = line.match(/(\d{2}:\d{2})/g);
    rows.push({ page: i + 1, year, month, day: +day[1], hijriDay: +day[2], fajr: parseHHMM(t[0]), dhuhr: parseHHMM(t[2]), asr: parseHHMM(t[4]), maghrib: parseHHMM(t[6]), isha: parseHHMM(t[8]) });
  }
});

const off = tzOffsetMinutes(TZ, new Date(Date.UTC(2021, 0, 15, 12)));
for (const r of rows) {
  const s = sun(A, { lat: LAT, lng: LNG }, new Date(Date.UTC(r.year, r.month - 1, r.day, 0)));
  r.noon = s.transit * 60 + off;
  r.dhuhrOffset = +(r.dhuhr - r.noon).toFixed(1);
}

const byMonth = {};
for (const r of rows) (byMonth[r.month] ||= []).push(r);
let all = [];
console.log('month  days  printed  offset min .. max  mean');
for (const m of Object.keys(byMonth).map(Number).sort((a, b) => a - b)) {
  const g = byMonth[m];
  const v = g.map(r => r.dhuhrOffset);
  all = all.concat(v);
  const printed = new Set(g.map(r => r.dhuhr));
  console.log(String(m).padStart(2), String(g.length).padStart(5), [...printed].join(',').padStart(7), `${Math.min(...v).toFixed(1)} .. ${Math.max(...v).toFixed(1)}`.padStart(15), (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1).padStart(6));
}
console.log('whole year: mean offset', (all.reduce((a, b) => a + b, 0) / all.length).toFixed(2), 'days', all.length);
console.log('rows parsed', rows.length, 'hijri-day sanity (first row of each page):', pages.map((p, i) => rows.find(r => r.page === i + 1)?.hijriDay ?? '-').join(','));
