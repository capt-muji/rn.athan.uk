// R9: invert the Algerian Ministry of Religious Affairs and Endowments' own annual
// calendar for Algiers (marw.gov.dz/media/calendrier/1448/Alger.pdf), OCR'd locally
// from the ministry PDF with pdfocr-ar.swift. The seven time columns, as OCR emits
// them left to right: Isha, Maghrib, Asr, Zawal (Dhuhr), Qibla, Shuruq, Fajr. The
// Qibla column is the ministry's own "وقت وجود الشمس في اتجاه القبلة" row, not a prayer.
import { readFileSync } from 'node:fs';
import { invertRow } from './solar-harness.mjs';

// Algiers city centre. UTC+1 all year; Algeria observes no DST.
const LAT = 36.7538, LNG = 3.0588, TZ = 1;

const files = process.argv.slice(2);
const rows = [];
for (const f of files) {
  for (const line of readFileSync(new URL('./' + f, import.meta.url), 'utf8').split('\n')) {
    const c = line.split('\t').map(s => s.trim());
    const di = c.findIndex(s => /^202[67]\/\d{2}\/\d{2}$/.test(s));
    if (di < 0) continue;
    const t = c.slice(0, di).filter(s => /^\d{1,2}:\d{2}$/.test(s));
    if (t.length !== 7) continue;
    const [isha, maghrib, asr, dhuhr, qibla, sunrise, fajr] = t;
    const [yy, mm, dd] = c[di].split('/').map(Number);
    rows.push({ date: c[di], y: yy, m: mm, d: dd, fajr, sunrise, dhuhr, asr, maghrib, isha, qibla });
  }
}

console.log(`parsed ${rows.length} days from the ministry's Algiers calendar`);
const acc = { fajrAngle: [], sunriseAngle: [], dhuhrOffsetMin: [], asrFactor: [], maghribAngle: [], maghribMinusSunsetMin: [], ishaAngle: [], ishaAfterMaghribMin: [] };
for (const r of rows) {
  const inv = invertRow({ lat: LAT, lng: LNG, tz: TZ, ...r });
  for (const k of Object.keys(acc)) if (inv[k] !== undefined) acc[k].push(inv[k]);
}
// Report the inter-quartile band alongside the full range: a handful of OCR misreads
// in a 135-day scan move min and max but cannot move the quartiles.
const stat = a => {
  const s = [...a].sort((x, y) => x - y);
  const q = p => s[Math.floor(p * (s.length - 1))];
  return { min: s[0], q1: q(0.25), median: q(0.5), q3: q(0.75), max: s[s.length - 1], mean: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) };
};
for (const [k, a] of Object.entries(acc)) if (a.length) console.log(k.padEnd(24), JSON.stringify(stat(a)));
