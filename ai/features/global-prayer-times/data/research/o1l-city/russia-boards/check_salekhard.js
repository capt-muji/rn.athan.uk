const fs = require('fs');
const path = require('path');
const L = require(path.join(process.env.HOME, 'athan-gitree/census/c23-russia/fit/lib'));

const TZ = 'Asia/Yekaterinburg';
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/cdum_2026.json'), 'utf8'));
const rows = data['Салехард'].rows;
const p = L.params({ fajrAngle: 18, ishaAngle: 17 });
p.rounding = 'none';
const dateOf = (iso) => new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10), 12));

const CAND = {
  Salekhard: { lat: 66.53, lon: 66.60 },
  Surgut: { lat: 61.25, lon: 73.40 },
  // a mid-latitude site whose June day length matches a 47 N summer
  probe47: { lat: 47.0, lon: 66.6 },
};

const byMonth = {};
for (const [iso, r] of Object.entries(rows)) {
  const m = +iso.slice(5, 7);
  byMonth[m] = byMonth[m] || { n: 0, sun: [], dhuhr: [], asr: [], maghrib: [] };
  byMonth[m].n += 1;
  byMonth[m].sun.push(r.sunrise);
  byMonth[m].dhuhr.push(r.dhuhr);
  byMonth[m].asr.push(r.asr);
  byMonth[m].maghrib.push(r.maghrib);
}

const fmt = (v) => `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(Math.round(v % 60)).padStart(2, '0')}`;
console.log('month  published(day1: sunrise dhuhr asr maghrib)   Salekhard model           Surgut model');
for (const m of Object.keys(byMonth).map(Number)) {
  const iso = `2026-${String(m).padStart(2, '0')}-01`;
  const d = dateOf(iso);
  const out = [];
  for (const [name, c] of Object.entries(CAND)) {
    const t = L.times(c.lat, c.lon, d, p, TZ);
    out.push(`${name}: ${fmt(t.sunrise)} ${fmt(t.dhuhr)} ${fmt(t.asr)} ${fmt(t.maghrib)}`);
  }
  console.log(`${String(m).padStart(2)}  ${fmt(byMonth[m].sun[0])} ${fmt(byMonth[m].dhuhr[0])} ${fmt(byMonth[m].asr[0])} ${fmt(byMonth[m].maghrib[0])}   ${out[0].padEnd(28)} ${out[1]}`);
}

// Day-length test: published sunrise->maghrib span vs each candidate.
console.log('\nmonth  pub span  Salekhard  Surgut  probe47');
for (const m of Object.keys(byMonth).map(Number)) {
  const span = (a) => Math.max(...a) - Math.min(...a);
  const d = dateOf(`2026-${String(m).padStart(2, '0')}-01`);
  const spanFor = (c) => { const t = L.times(c.lat, c.lon, d, p, TZ); return t.maghrib - t.sunrise; };
  console.log(`${String(m).padStart(2)} ${span(byMonth[m].maghrib).toFixed(0)}`.padEnd(8) +
    `${spanFor(CAND.Salekhard).toFixed(0)}`.padEnd(11) + `${spanFor(CAND.Surgut).toFixed(0)}`.padEnd(8) + spanFor(CAND.probe47).toFixed(0));
}
const jan = byMonth[1];
console.log('\n1 Jan: published asr - dhuhr =', jan.asr[0] - jan.dhuhr[0], 'min');
