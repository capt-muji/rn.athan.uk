// KHGT (Muhammadiyah) harvest: Jan + Jul, six years, three coordinates.
// One POST per city-year-month; each response flushed to captures/ on arrival.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.env.HOME, 'athan-gitree/census/o1k-wide/deep3');
const CAP = path.join(ROOT, 'captures');
const DATA = path.join(ROOT, 'data');
const URL = 'https://api-khgt.muhammadiyah.or.id/api/sholat/schedule';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const CITIES = {
  jakarta: { lat: -6.2088, lng: 106.8456, tz: 'Asia/Jakarta' },
  surabaya: { lat: -7.2575, lng: 112.7521, tz: 'Asia/Jakarta' },
  jayapura: { lat: -2.5916, lng: 140.6690, tz: 'Asia/Jayapura' },
};
const YEARS = [2025, 2027, 2029, 2031, 2033, 2035];
const MONTHS = [1, 7];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const [city, c] of Object.entries(CITIES)) {
  for (const y of YEARS) {
    for (const m of MONTHS) {
      const file = path.join(CAP, `khgt-${city}-${y}-${String(m).padStart(2, '0')}.json`);
      if (fs.existsSync(file) && fs.statSync(file).size > 1000) { console.log('skip', file); continue; }
      const body = JSON.stringify({ lat: c.lat, lng: c.lng, date: `${y}-${String(m).padStart(2, '0')}-01`, mode: 'monthly_masehi' });
      let ok = false;
      for (let attempt = 1; attempt <= 4 && !ok; attempt++) {
        try {
          const res = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
            body,
          });
          const txt = await res.text();
          if (res.status !== 200) throw new Error('http ' + res.status);
          const j = JSON.parse(txt);
          if (!j.success || !j.data?.schedules?.length) throw new Error('shape ' + txt.slice(0, 120));
          fs.writeFileSync(file, txt);
          console.log('ok', city, y, m, j.data.schedules.length, 'elev', j.data.elevation, 'tz', j.data.timezone);
          ok = true;
        } catch (e) {
          console.log('retry', city, y, m, attempt, e.message);
          await sleep(1500 * attempt);
        }
      }
      if (!ok) throw new Error(`failed ${city} ${y} ${m}`);
      await sleep(400);
    }
  }
}
console.log('harvest complete');
