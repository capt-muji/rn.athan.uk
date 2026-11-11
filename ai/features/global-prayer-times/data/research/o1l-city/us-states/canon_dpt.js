// Convert dpt year JSON to canonical athan rows + iqamah (jamah) rows.
// Usage: node canon_dpt.js <domain> [tzOutHint]
import { readFileSync, writeFileSync } from 'node:fs';

const [domain] = process.argv.slice(2);
const rows = JSON.parse(readFileSync(`captures/dpt_${domain}.json`, 'utf8'))[0];
const hm = (s) => (s ? String(s).slice(0, 5) : null);
const athan = {}, iqamah = {};
for (const r of rows) {
  const key = String(r.d_date).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
  athan[key] = { fajr: hm(r.fajr_begins), sunrise: hm(r.sunrise), dhuhr: hm(r.zuhr_begins), asr: hm(r.asr_mithl_1), maghrib: hm(r.maghrib_begins), isha: hm(r.isha_begins) };
  iqamah[key] = { fajr: hm(r.fajr_jamah), dhuhr: hm(r.zuhr_jamah), asr: hm(r.asr_jamah), maghrib: hm(r.maghrib_jamah), isha: hm(r.isha_jamah) };
}
const year = rows[0] ? String(rows[0].d_date).slice(0, 4) : 'x';
writeFileSync(`data/dpt_${domain}_${year}.json`, JSON.stringify(athan, null, 1));
writeFileSync(`data/iqamah_dpt_${domain}_${year}.json`, JSON.stringify(iqamah, null, 1));
console.log(`data/dpt_${domain}_${year}.json`, Object.keys(athan).length, 'athan rows,', Object.keys(iqamah).length, 'iqamah rows');
