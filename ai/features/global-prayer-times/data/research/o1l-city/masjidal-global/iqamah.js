// Characterise the iqamah layer: fixed clock, athan + offset, or weekday table.
import { readFileSync, readdirSync } from 'node:fs';

const toMin = (s) => {
  if (!s) return null;
  const t = String(s).trim().toUpperCase().replace(/\s+/g, '');
  let m = /^(\d{1,2}):(\d{2})(AM|PM)$/.exec(t);
  if (m) { let h = Number(m[1]) % 12; if (m[3] === 'PM') h += 12; return h * 60 + Number(m[2]); }
  m = /^(\d{1,2}):(\d{2})/.exec(t);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
const ids = process.argv.slice(2);
const out = [];
for (const id of ids) {
  for (const y of [2026]) {
    let j;
    try { j = JSON.parse(readFileSync(`captures/masjidal_${id}_${y}.json`, 'utf8')); } catch { continue; }
    const salah = (j.data && j.data.salah) || [];
    const iq = (j.data && j.data.iqamah) || [];
    if (!iq.length) { out.push({ id, y, iq: 'none' }); continue; }
    const keys = ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'];
    const athanKeys = ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'];
    const res = {};
    for (let k = 0; k < keys.length; k++) {
      const offs = [];
      for (let i = 0; i < Math.min(salah.length, iq.length); i++) {
        const a = toMin(salah[i][athanKeys[k]]), q = toMin(iq[i][keys[k]]);
        if (a === null || q === null) continue;
        let d = q - a;
        if (d < -720) d += 1440;
        if (d > 720) d -= 1440;
        offs.push(d);
      }
      const uniq = new Set(offs);
      const vals = new Set(offs.map((o) => o));
      res[keys[k]] = {
        distinctOffsets: uniq.size,
        min: Math.min(...offs), max: Math.max(...offs),
        fixed: uniq.size === 1,
      };
    }
    const fixedCols = Object.values(res).filter((r) => r.fixed).length;
    out.push({ id, y, iq: fixedCols >= 4 ? 'fixed-offset' : fixedCols === 0 ? 'variable' : 'mixed', cols: res });
  }
}
for (const r of out) {
  if (!r.cols) { console.log(r.id, r.iq); continue; }
  const s = Object.entries(r.cols).map(([k, v]) => `${k}:${v.fixed ? '+' + v.min : v.min + '..' + v.max}`).join(' ');
  console.log(`${r.id}\t${r.iq}\t${s}`);
}
