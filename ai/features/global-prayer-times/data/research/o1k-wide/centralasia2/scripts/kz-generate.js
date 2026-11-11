const fs = require('fs');
const path = require('path');
const vm = require('vm');

const CAP = path.join(__dirname, '..', 'captures');
const src = fs.readFileSync(path.join(CAP, 'kz-prayTimes.js'), 'utf8');
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(src, ctx);
const prayTimes = ctx.prayTimes;

function generate(lat, lng, tz, year) {
  prayTimes.setMethod('ISNA');
  prayTimes.adjust({ asr: 'Hanafi' });
  prayTimes.adjust({ highLats: 'AngleBased' });
  const list = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const out = {};
  const d = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));
  while (d <= end) {
    const y = d.getUTCFullYear(), m = d.getUTCMonth(), day = d.getUTCDate();
    // the page passes a local Date; UTC-noon-free construction keeps leap/day math stable
    const date = [y, m + 1, day];
    const t = prayTimes.getTimes(date, [lat, lng], tz, 0, '24h');
    const row = {};
    for (let i = 0; i < 6; i++) {
      let add = 0;
      if (lat < 48) {
        if (i === 1) add -= 3;
        else if (i > 1 && i < 5) add += 3;
      } else {
        if (i === 1) add -= 5;
        else if (i > 1 && i < 5) add += 5;
      }
      let [hh, mm] = t[list[i]].split(':').map(Number);
      let total = hh * 60 + mm + add;
      total = ((total % 1440) + 1440) % 1440;
      row[list[i]] = String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
    }
    out[`${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`] = row;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

const cities = [
  { name: 'astana', lat: 51.133333, lng: 71.433333, tz: 5, id: 3 },
  { name: 'karaganda', lat: 49.806406, lng: 73.085485, tz: 5, id: 39 },
  { name: 'shymkent', lat: 42.368009, lng: 69.612769, tz: 5, id: 57 },
];
const year = Number(process.argv[2] || 2028);
for (const c of cities) {
  const rows = generate(c.lat, c.lng, c.tz, year);
  const file = path.join(__dirname, '..', 'data', `kz-${c.name}-${year}.json`);
  fs.writeFileSync(file, JSON.stringify(rows, null, 0));
  console.log(c.name, year, Object.keys(rows).length, 'rows');
}
