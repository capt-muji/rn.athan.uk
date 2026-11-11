// muftyat.kz serves no times: the page's own prayTimes.js computes them in the browser.
// Harvest = run the publisher's served engine with the page's own settings (scripts.js
// hard-codes ISNA, Hanafi asr, AngleBased high lats, and the 48 N margin block).
// dst forced 0: the page passes 'auto', which reads the VISITOR's zone and adds +60.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'captures', 'kz-prayTimes.js'), 'utf8');
const ctx = { console: { log() {} } };
vm.createContext(ctx);
vm.runInContext(src, ctx);
const prayTimes = ctx.prayTimes;

prayTimes.setMethod('ISNA');
prayTimes.adjust({ asr: 'Hanafi' });
prayTimes.adjust({ highLats: 'AngleBased' });

const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function margins(lat, i) {
  if (i === 1) return lat < 48 ? -3 : -5;
  if (i > 1 && i < 5) return lat < 48 ? 3 : 5;
  return 0;
}

function shift(hhmm, add) {
  const [h, m] = hhmm.split(':').map(Number);
  let total = h * 60 + m + add;
  total = ((total % 1440) + 1440) % 1440;
  return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
}

function yearRows(lat, lng, tz, year) {
  const out = {};
  const d = new Date(Date.UTC(year, 0, 1));
  while (d.getUTCFullYear() === year) {
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const t = prayTimes.getTimes([y, m, day], [lat, lng], tz, 0, '24h');
    const row = {};
    COLS.forEach((k, i) => { row[k] = shift(t[k], margins(lat, i)); });
    out[`${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`] = row;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

const CITIES = [
  { key: 'astana', lat: 51.133333, lng: 71.433333, tz: 5 },
];
const YEARS = [2026, 2027, 2029, 2033, 2035, 2040, 2050, 2075];

for (const c of CITIES) {
  for (const y of YEARS) {
    const rows = yearRows(c.lat, c.lng, c.tz, y);
    fs.writeFileSync(path.join(ROOT, 'data', `kz-${c.key}-${y}.json`), JSON.stringify(rows));
    console.log(`${c.key} ${y} ${Object.keys(rows).length} rows`);
  }
}
