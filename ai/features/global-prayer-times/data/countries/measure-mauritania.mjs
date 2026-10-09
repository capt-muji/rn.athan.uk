// R9: invert the Mauritanian Ministry of Islamic Affairs and Original Education's
// own Ramadan 1446 imsakia, published at affairesislamiques.mr as one page per city
// and OCR'd locally with `pdfocr-ar.swift`.
//
// The ministry's own seven time columns, right to left in the Arabic original:
//   الإمساك (imsak), الفجر (fajr), الشروق (sunrise), الظهر (dhuhr),
//   العصر (asr), الإفطار (iftar, that is Maghrib), العشاء (isha)
// OCR emits them left to right, so the parsed order is isha, iftar, asr, dhuhr,
// sunrise, fajr, imsak. Mauritania therefore prints a SEPARATE Imsak row, distinct
// from Fajr, which puts it in the Malaysia and Indonesia pattern rather than the
// Turkish one.
//
// Ramadan 1446 ran 1 to 30 March 2025. Mauritania is UTC+0 all year, no DST.
import { readFileSync } from 'node:fs';
import { invertRow, toH } from './solar-harness.mjs';

const CITIES = {
  'mr-p9.txt': { name: 'Rosso', lat: 16.5138, lng: -15.8050 },
  'mr-p11.txt': { name: 'Nouadhibou', lat: 20.9414, lng: -17.0347 },
  'mr-p4.txt': { name: 'Nema', lat: 16.6167, lng: -7.2500 },
};
const TZ = 0;

const stat = a => {
  const s = [...a].sort((x, y) => x - y);
  return { n: s.length, min: s[0], q1: s[Math.floor(0.25 * s.length)], median: s[Math.floor(0.5 * s.length)],
    q3: s[Math.floor(0.75 * s.length)], max: s[s.length - 1] };
};

for (const [file, c] of Object.entries(CITIES)) {
  const acc = { fajrAngle: [], sunriseAngle: [], dhuhrOffsetMin: [], asrFactor: [],
    maghribMinusSunsetMin: [], ishaAngle: [], ishaAfterMaghribMin: [] };
  const imsakGap = [];
  let n = 0;
  for (const line of readFileSync(new URL('./' + file, import.meta.url), 'utf8').split('\n')) {
    const t = (line.match(/\d{1,2}:\d{2}/g) || []);
    if (t.length !== 7) continue;
    const [isha, maghrib, asr, dhuhr, sunrise, fajr, imsak] = t;
    // The Gregorian day is the first bare 1-to-31 integer after the times.
    const rest = line.slice(line.lastIndexOf(t[6]) + t[6].length);
    const dm = rest.match(/(\d{1,2})\s*مارس/) || rest.match(/(\d{1,2})/);
    if (!dm) continue;
    const d = Number(dm[1]);
    if (!(d >= 1 && d <= 31)) continue;
    n++;
    imsakGap.push(Math.round((toH(fajr) - toH(imsak)) * 60));
    const inv = invertRow({ y: 2025, m: 3, d, lat: c.lat, lng: c.lng, tz: TZ,
      fajr, sunrise, dhuhr, asr, maghrib, isha });
    for (const k of Object.keys(acc)) if (inv[k] !== undefined) acc[k].push(inv[k]);
  }
  console.log(`\n=== ${c.name}, ${n} days of the ministry's Ramadan 1446 imsakia ===`);
  for (const [k, a] of Object.entries(acc)) if (a.length) console.log('  ', k.padEnd(24), JSON.stringify(stat(a)));
  const g = [...new Set(imsakGap)];
  console.log('   Fajr minus Imsak, minutes  ', JSON.stringify(stat(imsakGap)),
    g.length === 1 ? `INVARIANT at ${g[0]}` : `${g.length} distinct values`);
}
