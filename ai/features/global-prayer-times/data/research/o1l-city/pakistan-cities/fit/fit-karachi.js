const fs = require('fs');
const { run } = require('./lib');

const raw = JSON.parse(fs.readFileSync(`${__dirname}/../data/raw-karachi-parsed.json`, 'utf8'));
const chart = [];
for (let mon = 1; mon <= 12; mon++) {
  for (const [day, pairs] of raw[mon - 1][1]) {
    const [isha0, maghrib0, asr0, zuhr, zawal, sunrise, fajr] = pairs.map(([h, m]) => h * 60 + m);
    // chart prints 12h without meridiem; evening columns carry the +12h
    const isha = isha0 + 720;
    const maghrib = maghrib0 + 720;
    const asr = asr0 + 720;
    chart.push({ m: mon, d: day, fajr, sunrise, zuhr, asr, maghrib, isha });
  }
}
run('Karachi (perpetual chart, archive.org)', chart, 24.8607, 67.0011);

const rows = {};
for (const r of chart) {
  const p = (v) => `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(Math.round(v % 60)).padStart(2, '0')}`;
  rows[`2026-${String(r.m).padStart(2, '0')}-${String(r.d).padStart(2, '0')}`] = { fajr: p(r.fajr), sunrise: p(r.sunrise), dhuhr: p(r.zuhr), asr: p(r.asr), maghrib: p(r.maghrib), isha: p(r.isha) };
}
fs.writeFileSync(`${__dirname}/../data/pk-karachi-perpetual-chart.json`, JSON.stringify(rows, null, 1));
console.log('wrote rows', Object.keys(rows).length);

const { searchAngles } = require('./angles');
console.log('angle search fajr', JSON.stringify(searchAngles(chart, 24.8607, 67.0011, 'fajr')));
console.log('angle search isha', JSON.stringify(searchAngles(chart, 24.8607, 67.0011, 'isha')));
