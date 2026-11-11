import fs from 'fs';

const BASE = '$HOME/athan-gitree/census/o1l-city/indonesia-cities/data';
const jsorg = JSON.parse(fs.readFileSync('data/jsorg-raw.json', 'utf8'));
const MAP = {
  banda_aceh: 'banda-aceh', bandung: 'bandung', surabaya: 'surabaya', medan: 'medan',
  makassar: 'makassar', jayapura: 'jayapura', yogyakarta: 'yogyakarta', semarang: 'semarang',
  denpasar: 'denpasar', pontianak: 'pontianak', padang: 'padang', palembang: 'palembang',
  banjarmasin: 'banjarmasin', manado: 'manado', mataram: 'mataram', kupang: 'kupang',
  ambon: 'ambon', ternate: 'ternate', pekanbaru: 'pekanbaru', samarinda: 'samarinda',
  tanjung_pinang: 'tanjung-pinang', serang: 'serang', bengkulu: 'bengkulu',
  bandar_lampung: 'bandar-lampung', pangkal_pinang: 'pangkal-pinang', gorontalo: 'gorontalo',
  jambi: 'jambi', kendari: 'kendari', palu: 'palu', mamuju: 'mamuju',
  tanjung_selor: 'bulungan', sorong: 'sorong', manokwari: 'manokwari', nabire: 'nabire',
  wamena: 'jayawijaya', merauke: 'merauke', jakarta_pusat: 'jakarta-pusat',
};
const m = s => { const [h, mm] = s.split(':').map(Number); return h * 60 + mm; };
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

const out = {};
for (const [city, slug] of Object.entries(MAP)) {
  const f = `${BASE}/khgt-2026-${slug}.json`;
  if (!fs.existsSync(f) || !jsorg[city]) continue;
  const k = JSON.parse(fs.readFileSync(f, 'utf8'));
  const acc = {}; let n = 0;
  for (const c of COLS) acc[c] = [];
  for (const [ym, days] of Object.entries(jsorg[city])) {
    if (!ym.startsWith('2026-')) continue;
    const [y, mo] = ym.split('-').map(Number);
    const dim = new Date(Date.UTC(y, mo, 0)).getUTCDate();
    for (const d of days) {
      if (d.day > dim) continue;
      const iso = `${ym}-${String(d.day).padStart(2, '0')}`;
      const r = k.rows[iso];
      if (!r) continue;
      n++;
      for (const c of COLS) {
        let delta = m(d[c]) - m(r[c]);
        while (delta > 720) delta -= 1440;
        while (delta < -720) delta += 1440;
        acc[c].push(delta);
      }
    }
  }
  const rec = { n, cols: {} };
  for (const c of COLS) {
    const v = acc[c].sort((a, b) => a - b);
    if (!v.length) continue;
    const med = v[Math.floor(v.length / 2)];
    rec.cols[c] = { median: +med.toFixed(2), min: v[0], max: v[v.length - 1] };
  }
  out[city] = rec;
}
fs.writeFileSync('data/jsorg-vs-khgt.json', JSON.stringify(out, null, 1));
for (const [c, r] of Object.entries(out)) {
  console.log(c.padEnd(15), String(r.n).padStart(3),
    COLS.map(k => `${k.slice(0, 3)} ${r.cols[k].median >= 0 ? '+' : ''}${r.cols[k].median}[${r.cols[k].min}..${r.cols[k].max}]`).join(' '));
}
