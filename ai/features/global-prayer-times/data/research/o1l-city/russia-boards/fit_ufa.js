// Ufa almanac recipe check: the fixed-interval table on the solar anchors, both years.
// Prints the residuals section 8 cites and writes data/ufa_fit.json.
const fs = require('fs');
const path = require('path');
const L = require(path.join(process.env.HOME, 'athan-gitree/census/c23-russia/fit/lib'));

const TZ = 'Asia/Yekaterinburg';
const POS = { lat: 54.7388, lon: 55.9721 };
const p = L.params({ fajrAngle: 16, ishaAngle: 15, madhab: 'hanafi' });
p.rounding = 'none';

const hm = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const dateOf = (iso, shift = 0) => new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10), 12) + shift * 86400000);
const stat = (a) => {
  const s = [...a].sort((x, y) => x - y);
  return { n: s.length, min: +s[0].toFixed(2), med: +s[Math.floor(s.length / 2)].toFixed(2), max: +s[s.length - 1].toFixed(2) };
};

const YEARS = [['ufa_1448', 4, 10], ['ufa_1446', 3, 0]];
const out = {};
for (const [file, maghribMargin, asrShift] of YEARS) {
  const rows = JSON.parse(fs.readFileSync(path.join(__dirname, `data/${file}.json`), 'utf8')).rows;
  const res = { sunrise: [], maghrib: [], fajrRule: [], ishaRule: [], dhuhr: [], asr: [], suhur: [] };
  let exact = 0, cells = 0;
  for (const [iso, r] of Object.entries(rows)) {
    const t = L.times(POS.lat, POS.lon, dateOf(iso), p, TZ);
    const ta = L.times(POS.lat, POS.lon, dateOf(iso, asrShift), p, TZ);
    res.sunrise.push(hm(r.sunrise) - t.sunrise);
    res.maghrib.push(hm(r.maghrib) - t.maghrib);
    res.fajrRule.push(hm(r.fajr) - (hm(r.sunrise) - 100));
    res.ishaRule.push(hm(r.isha) - (hm(r.maghrib) + 90));
    res.dhuhr.push(hm(r.dhuhr) - Math.max(810, t.dhuhr + 5));
    res.asr.push(hm(r.asr) - ta.asr);
    if (r.suhur) res.suhur.push(hm(r.fajr) - hm(r.suhur));
    const pred = { sunrise: Math.round(t.sunrise), maghrib: Math.round(t.maghrib) + maghribMargin,
      fajr: Math.round(t.sunrise) - 100, isha: Math.round(t.maghrib) + maghribMargin + 90,
      dhuhr: Math.max(810, Math.round(t.dhuhr) + 5), asr: Math.round(ta.asr) };
    for (const k of Object.keys(pred)) { cells += 1; if (pred[k] === hm(r[k])) exact += 1; }
  }
  out[file] = { rows: Object.keys(rows).length, exactCells: exact, cells,
    stats: Object.fromEntries(Object.entries(res).map(([k, v]) => [k, v.length ? stat(v) : null])) };
  console.log(file, `${out[file].rows} rows, cell-exact ${exact}/${cells}`);
  for (const [k, v] of Object.entries(out[file].stats)) if (v) console.log(`  ${k.padEnd(9)} n ${v.n} min ${v.min} med ${v.med} max ${v.max}`);
}
fs.writeFileSync(path.join(__dirname, 'data/ufa_fit.json'), JSON.stringify(out, null, 1));
