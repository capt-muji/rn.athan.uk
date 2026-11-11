// Parse the namaadhuvaguthu month tables into normalized dated rows.
// Each row carries its own date in the row class ("day D-M-Y N"); that string is the
// date source, never the month header.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CAP = path.join(ROOT, 'captures');

const KEY = { fajr: 'fajr', sunrise: 'sunrise', duhr: 'dhuhr', asr: 'asr', maghrib: 'maghrib', isha: 'isha' };
const COLS = Object.values(KEY);

function parseMonth(file) {
  const html = fs.readFileSync(file, 'utf8');
  const rows = {};
  const re = /<tr class="day (\d{1,2})-(\d{1,2})-(\d{4}) \d+">([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const [, d, mo, y, body] = m;
    const cells = [...body.matchAll(/<td class="prayer-time ([a-z]+)">(\d{2}):(\d{2})<\/td>/g)];
    if (cells.length !== 6) continue;
    const row = {};
    for (const c of cells) row[KEY[c[1]]] = `${c[2]}:${c[3]}`;
    if (!COLS.every((k) => row[k])) continue;
    rows[`${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`] = row;
  }
  return rows;
}

const TAGS = {
  male: [2027, 2031, 2036],
  thuraakunu: [2027, 2031, 2036],
  hoadedhdhoo: [2027, 2031, 2036],
};

for (const [tag, years] of Object.entries(TAGS)) {
  for (const year of years) {
    const merged = {};
    for (let month = 1; month <= 12; month += 1) {
      const f = path.join(CAP, `mv-${tag}-${year}-${String(month).padStart(2, '0')}.html`);
      if (!fs.existsSync(f)) continue;
      Object.assign(merged, parseMonth(f));
    }
    if (Object.keys(merged).length === 0) continue;
    fs.writeFileSync(path.join(ROOT, 'data', `mv-${tag}-${year}.json`), JSON.stringify(merged));
    const days = Object.keys(merged).sort();
    console.log(`${tag} ${year} ${days.length} rows ${days[0]} .. ${days[days.length - 1]}`);
  }
}
