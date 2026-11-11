// dpt year feed -> canonical rows. Fields: fajr_begins, sunrise, zuhr_begins,
// asr_mithl_1 (Shafi), asr_mithl_2 (Hanafi), maghrib_begins, isha_begins.
import { readFileSync, writeFileSync } from 'node:fs';

const d = process.argv[2];
const out = process.argv[3];
const j = JSON.parse(readFileSync(`captures/dpt_${d}.json`, 'utf8'));
const rows = Array.isArray(j[0]) ? j[0] : j;
const zero = (t) => !t || /^00:00(:00)?$/.test(t);
const canon = {};
let kept = 0, zeroed = 0;
for (const r of rows) {
  const key = r.d_date;
  if (!key) continue;
  if ([r.fajr_begins, r.sunrise, r.zuhr_begins, r.asr_mithl_1, r.maghrib_begins, r.isha_begins].some(zero)) { zeroed++; continue; }
  canon[key] = {
    fajr: r.fajr_begins.slice(0, 5),
    sunrise: r.sunrise.slice(0, 5),
    dhuhr: r.zuhr_begins.slice(0, 5),
    asr: r.asr_mithl_1.slice(0, 5),
    asrHanafi: r.asr_mithl_2.slice(0, 5),
    maghrib: r.maghrib_begins.slice(0, 5),
    isha: r.isha_begins.slice(0, 5),
  };
  kept++;
}
writeFileSync(out, JSON.stringify(canon, null, 1));
const years = [...new Set(Object.keys(canon).map((k) => k.slice(0, 4)))];
console.log(d, 'raw', rows.length, 'kept', kept, 'zeroed', zeroed, 'years', years.join(','),
  kept ? `${Object.keys(canon)[0]} -> ${Object.keys(canon).slice(-1)[0]}` : '');
