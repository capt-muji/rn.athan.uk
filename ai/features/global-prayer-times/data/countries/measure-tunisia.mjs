// R9: invert the Tunisian Institut National de la Meteorologie's own Ramadan 1446
// imsakia for Tunis (meteo.tn/sites/default/files/2025-02/imsakia Tunis .pdf), OCR'd
// locally with pdfocr-ar.swift. Ramadan 1446 ran 1 to 30 March 2025.
//
// The PDF's two time columns are headed الإمساك (imsak) and الإفطار (iftar), each
// split into س (hours) and دق (minutes). OCR emits, left to right per row:
//   gregorian day, gregorian month, imsak minutes, imsak hours, iftar minutes, iftar hours.
import { readFileSync } from 'node:fs';
import { invertRow } from './solar-harness.mjs';

// Tunis city centre. UTC+1 all year; Tunisia observes no DST.
const LAT = 36.8065, LNG = 10.1815, TZ = 1;

const rows = [];
for (const line of readFileSync(new URL('./tn-tunis-imsakia-1446.txt', import.meta.url), 'utf8').split('\n')) {
  const n = (line.match(/\d+/g) || []).map(Number);
  const t = n.length === 7 ? n.slice(1) : n; // some rows repeat the day index
  if (t.length !== 6) continue;
  const [d, m, imin, ih, fmin, fh] = t;
  if (m !== 3 || d < 1 || d > 31 || ih > 23 || fh > 23) continue;
  rows.push({
    y: 2025, m, d, lat: LAT, lng: LNG, tz: TZ,
    fajr: `${ih}:${String(imin).padStart(2, '0')}`,
    maghrib: `${fh}:${String(fmin).padStart(2, '0')}`,
  });
}

console.log(`parsed ${rows.length} days of the INM's Tunis imsakia`);
const fajr = [], magh = [];
for (const r of rows) {
  const inv = invertRow(r);
  fajr.push(inv.fajrAngle);
  magh.push(inv.maghribMinusSunsetMin);
}
const stat = a => {
  const s = [...a].sort((x, y) => x - y);
  return { min: s[0], median: s[Math.floor(s.length / 2)], max: s[s.length - 1], mean: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) };
};
console.log('imsak/fajr depression angle ', JSON.stringify(stat(fajr)));
console.log('iftar minus sunset, minutes ', JSON.stringify(stat(magh)));
