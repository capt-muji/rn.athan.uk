import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('data/jsorg-raw.json', 'utf8'));
const out = {};
for (const [city, months] of Object.entries(raw)) {
  const cityRows = {};
  for (const [ym, days] of Object.entries(months)) {
    const [y, m] = ym.split('-').map(Number);
    const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
    for (const d of days) {
      if (d.day > dim) continue;
      cityRows[`${ym}-${String(d.day).padStart(2, '0')}`] = {
        fajr: d.fajr, sunrise: d.sunrise, dhuhr: d.dhuhr,
        asr: d.asr, maghrib: d.maghrib, isha: d.isha,
      };
    }
  }
  out[city] = cityRows;
}
fs.writeFileSync('data/jadwalsholat-org-rows.json', JSON.stringify(out, null, 0));
const n = Object.values(out).reduce((a, c) => a + Object.keys(c).length, 0);
console.log('cities', Object.keys(out).length, 'rows', n);
