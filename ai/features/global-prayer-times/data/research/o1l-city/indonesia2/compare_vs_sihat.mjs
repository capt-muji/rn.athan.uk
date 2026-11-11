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
const COLS = [['fajr', 'fajr'], ['sunrise', 'sunrise'], ['dhuhr', 'dhuhr'],
  ['asr', 'asr'], ['maghrib', 'magrib'], ['isha', 'isha']];

const out = {};
for (const [city, slug] of Object.entries(MAP)) {
  const f = `${BASE}/sihat-2026-${slug}.json`;
  if (!fs.existsSync(f) || !jsorg[city]) continue;
  const sihat = JSON.parse(fs.readFileSync(f, 'utf8'));
  const rec = { elev: sihat.elevation, n: 0, cols: {} };
  const acc = {};
  for (const [pcol, scol] of COLS) acc[pcol] = [];
  for (const [ym, days] of Object.entries(jsorg[city])) {
    if (!ym.startsWith('2026-')) continue;
    const [y, mo] = ym.split('-').map(Number);
    const dim = new Date(Date.UTC(y, mo, 0)).getUTCDate();
    for (const d of days) {
      if (d.day > dim) continue;
      const iso = `${ym}-${String(d.day).padStart(2, '0')}`;
      const s = sihat.rows[iso];
      if (!s) continue;
      rec.n++;
      for (const [pcol, scol] of COLS) {
        let delta = m(d[pcol]) - m(s[scol]);
        while (delta > 720) delta -= 1440;
        while (delta < -720) delta += 1440;
        acc[pcol].push(delta);
      }
    }
  }
  for (const [pcol] of COLS) {
    const v = acc[pcol].sort((a, b) => a - b);
    if (!v.length) continue;
    const med = v[Math.floor(v.length / 2)];
    rec.cols[pcol] = {
      median: +med.toFixed(2), min: v[0], max: v[v.length - 1],
      same: +(100 * v.filter(x => x === med).length / v.length).toFixed(1),
    };
  }
  out[city] = rec;
}
fs.writeFileSync('data/jsorg-vs-sihat.json', JSON.stringify(out, null, 1));
for (const [c, r] of Object.entries(out)) {
  console.log(c.padEnd(15), String(r.n).padStart(3), 'elev', String(r.elev).padStart(4),
    COLS.map(([k]) => `${k.slice(0, 3)} ${r.cols[k].median >= 0 ? '+' : ''}${r.cols[k].median}[${r.cols[k].min}..${r.cols[k].max}] ${r.cols[k].same}%`).join(' '));
}
