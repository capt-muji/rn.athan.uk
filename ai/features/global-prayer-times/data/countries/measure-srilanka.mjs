import {readFileSync} from 'node:fs';
import {invertRow} from './solar-harness.mjs';
// All Ceylon Jamiyyathul Ulama (ACJU), the national ulama body incorporated by Act of
// Parliament No. 26 of 1985. Its own 11-zone national timetable, Zone 01 (Colombo,
// Gampaha, Kalutara), September. acju.lk/prayer-times, fetched 2026-09-30, OCR'd locally.
const lat=6.9271, lng=79.8612, tz=5.5, y=2026, m=9;
const to24=s=>{const [t,ap]=s.trim().split(/\s+/);let [h,mi]=t.split(':').map(Number);
  if(ap==='PM'&&h!==12)h+=12; if(ap==='AM'&&h===12)h=0; return `${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}`;};
const rows=readFileSync(new URL('./lk-colombo-sep.tsv',import.meta.url),'utf8').split('\n')
  .map(l=>l.split('\t')).filter(c=>/^\d{1,2}-Sep$/.test((c[0]||'').trim())&&c.length>=7);
console.log('rows parsed:', rows.length);
for (const c of [0,9,19,28]){
  if(!rows[c]) continue;
  const d=parseInt(rows[c][0]);
  const r=invertRow({y,m,d,lat,lng,tz,fajr:to24(rows[c][1]),sunrise:to24(rows[c][2]),
    dhuhr:to24(rows[c][3]),asr:to24(rows[c][4]),maghrib:to24(rows[c][5]),isha:to24(rows[c][6])});
  console.log(`Sep ${String(d).padStart(2)}`, JSON.stringify(r));
}
