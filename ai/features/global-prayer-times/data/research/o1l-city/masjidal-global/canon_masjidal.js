// Convert masjidal captures to canonical dated rows (athan layer) + iqamah layer files.
import { readFileSync, writeFileSync } from 'node:fs';

const to24 = (s) => {
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(String(s));
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
};

const ids = process.argv.slice(2);
for (const id of ids) {
  for (const y of [2026, 2025, 2024]) {
    let j;
    try { j = JSON.parse(readFileSync(`captures/masjidal_${id}_${y}.json`, 'utf8')); } catch { continue; }
    const salah = (j.data && j.data.salah) || [];
    const iq = (j.data && j.data.iqamah) || [];
    const rows = {};
    for (const r of salah) {
      const d = new Date(r.date.replace(/^[A-Za-z]+,\s*/, ''));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!/AM|PM/i.test(String(r.fajr))) continue;
      rows[key] = { fajr: to24(r.fajr), sunrise: to24(r.sunrise), dhuhr: to24(r.zuhr), asr: to24(r.asr), maghrib: to24(r.maghrib), isha: to24(r.isha) };
    }
    writeFileSync(`data/masjidal_${id}_${y}.json`, JSON.stringify(rows, null, 1));
    const irows = {};
    for (const r of iq) {
      const d = new Date(r.date.replace(/^[A-Za-z]+,\s*/, ''));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      irows[key] = { fajr: to24(r.fajr), dhuhr: to24(r.zuhr), asr: to24(r.asr), maghrib: to24(r.maghrib), isha: to24(r.isha) };
    }
    writeFileSync(`data/iqamah_${id}_${y}.json`, JSON.stringify(irows, null, 1));
    console.log(id, y, Object.keys(rows).length, 'athan rows,', Object.keys(irows).length, 'iqamah rows');
  }
}
