// Emit normalized dated rows per governorate: {'YYYY-MM-DD': {fajr..isha}}.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const CONF = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cities.json'), 'utf8'));
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

let files = 0; let days = 0;
for (const city of CONF.cities) {
  const cap = city.capture || city.name;
  const out = {};
  for (const yh of [1448, 1449]) {
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'captures', `sa-${cap}-${yh}.json`), 'utf8'));
    for (const r of raw) {
      if (r.hijriDate.year !== yh) continue;
      const row = {};
      for (const c of COLS) row[c] = r.prayerTimes[c];
      out[r.date.slice(0, 10)] = row;
      days++;
    }
  }
  fs.writeFileSync(path.join(ROOT, 'data', `sa-${city.name}-rows.json`), JSON.stringify(out, null, 0));
  files++;
}
console.log(`wrote ${files} row files, ${days} dated rows`);
