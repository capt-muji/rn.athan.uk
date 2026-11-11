import { readdirSync, readFileSync } from 'node:fs';

const meta = {
  xdy03lAX: ['US', 'IANT, Richardson TX'], '1QL0VydZ': ['US', 'ICOPS, Lynnwood WA'],
  '6adJkrKk': ['US', 'Islamic Center of Irvine CA'], '3OA8V3Kp': ['US', 'MAS Staten Island NY'],
  '0dYB46K6': ['CA', 'Nejashi, Toronto ON'], '1QL0lpLZ': ['CA', 'Halton Islamic Assoc., Burlington ON'],
  Vdw3zode: ['CA', 'Muslim Assoc. of New Brunswick, Saint John NB'], '5AvP54KX': ['CA', 'IQRA Masjid, Whitby ON'],
  pArDDkKb: ['GB', 'Fultali Islamic Centre, Coventry'], RKxqeRLO: ['GB', 'New Peckham Mosque, London'],
  '0xdyO0LX': ['GB', 'Masjid Al-Huda, Sheffield'], M9L2byLZ: ['GB', 'Wirral Shahjalal, Birkenhead'],
  wdqDq6Ab: ['AU', 'Australian Islamic Centre, Newport VIC'], nzKzVnKO: ['AU', 'Afghan Islamic Centre, Doveton VIC'],
  VGA6npAe: ['AU', 'United Muslims of Brisbane, Logan QLD'], pVdwkode: ['HK', 'TADREES-UL-QURAN, Kowloon'],
  EdoeoqL7: ['MU', 'Test01, Port Louis'], oxdN7nKV: ['CL', 'Mezquita As-Salam, Santiago'],
};

const out = [];
for (const f of readdirSync('out').filter((x) => /^f2_.*\.json$/.test(x))) {
  const r = JSON.parse(readFileSync('out/' + f, 'utf8'));
  const ys = Object.keys(r.years).filter((y) => r.years[y].parsed).map(Number).sort();
  const P = r.years[ys[0]];
  const m = meta[r.id] || ['?', '?'];
  const spread = Math.max(
    Math.max(...ys.map((y) => r.years[y].fajr.angle)) - Math.min(...ys.map((y) => r.years[y].fajr.angle)),
    Math.max(...ys.map((y) => r.years[y].isha.angle)) - Math.min(...ys.map((y) => r.years[y].isha.angle)));
  const w1 = Math.min(P.withMargins.fajr.w1Pct, P.withMargins.isha.w1Pct);
  const worst = Math.max(...['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map((c) => Math.abs(P.withMargins[c].worst)));
  const mg = P.margins;
  const mgs = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']
    .filter((c) => mg[c]).map((c) => c[0].toUpperCase() + (mg[c] > 0 ? '+' : '') + mg[c]).join(' ');
  out.push({
    id: r.id, cc: m[0], name: m[1], lat: P.geo.lat, lon: P.geo.lon, rms: P.geo.resid,
    fa: ys.map((y) => r.years[y].fajr.angle).join('/'),
    isha: P.isha.kind === 'interval' ? 'maghrib+' + P.isha.interval : ys.map((y) => r.years[y].isha.angle).join('/'),
    asr: P.asr, mgs, w1, worst, amp: P.amplitudeFajrJanJul, spread,
  });
}
out.sort((a, b) => a.cc.localeCompare(b.cc) || a.id.localeCompare(b.id));
console.log('| id | country | mosque | lat, lon | solar rms | fajr deg 24/25/26 | isha | asr | margins | twilight within-1 | worst | Jan->Jul fajr | 3y spread |');
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const r of out) {
  console.log('| ' + [r.id, r.cc, r.name, r.lat + ', ' + r.lon, r.rms, r.fa, r.isha, r.asr,
    r.mgs || 'none', r.w1 + '%', r.worst, r.amp, r.spread.toFixed(2) + ' deg'].join(' | ') + ' |');
}
