// Parse the six Oman second-city captures into dated rows.
// The page prints dhuhr/asr/maghrib/isha in 12-hour form with NO meridiem (recorded trap):
// add 12h when the printed hour is below 12.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const CAP = path.join(ROOT, 'captures');
const DATA = path.join(ROOT, 'data');
const CITIES = ['salalah', 'sohar', 'nizwa', 'sur', 'ibri', 'buraimi'];
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

for (const name of CITIES) {
  const rows = {};
  const files = fs.readdirSync(CAP).filter((f) => f.startsWith(`om-${name}-`) && f.endsWith('.html'));
  for (const f of files) {
    const mm = /-(\d{4})-(\d{2})\.html$/.exec(f);
    const year = Number(mm[1]);
    const month = Number(mm[2]);
    const html = fs.readFileSync(path.join(CAP, f), 'utf8');
    for (const tr of html.match(/<tr>[\s\S]*?<\/tr>/g) || []) {
      const tds = [...tr.matchAll(/<td[^>]*>(?:<font[^>]*>)?([^<]*)</g)].map((m) => m[1].trim());
      if (tds.length < 7) continue;
      const dm = /^(\d+)\/(\d+)\/(\d{4})$/.exec(tds[0]);
      if (!dm) continue;
      const [, day, mon, yr] = dm.map(Number);
      if (yr !== year || mon !== month) continue;
      const out = {};
      tds.slice(1, 7).forEach((t, i) => {
        let [hh, mi] = t.split(':').map(Number);
        // dhuhr prints 11:59 through 12:4x and needs no conversion; only asr/maghrib/isha
        // print a bare 12-hour afternoon hour (03:30 = 15:30).
        if (i >= 3 && hh < 10) hh += 12;
        out[COLS[i]] = `${String(hh).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
      });
      rows[`${yr}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`] = out;
    }
  }
  const keys = Object.keys(rows).sort();
  fs.writeFileSync(path.join(DATA, `om-${name}.json`), JSON.stringify(rows, null, 1));
  console.log(`${name}: ${keys.length} rows ${keys[0]} .. ${keys[keys.length - 1]}`);
}
