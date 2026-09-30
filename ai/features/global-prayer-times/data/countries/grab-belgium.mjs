// R9: pull the Executief van de Moslims van Belgie / Executif des Musulmans de
// Belgique annual prayer table out of its own PDF at
// emb-net.be/sites/default/files/horaire_priere_emb_2026.pdf.
//
// The EMB is the body recognised by the Belgian state as representing the Muslim
// community, and this table is issued by its Conseil des Theologiens. R5 recorded
// Belgium as having no national authority publishing a method; it has both.
//
// PDFKit's text layer emits one cell per line, in the PDF's own right-to-left order:
//   <greg-day> <icha> <maghrib> <asr> <dhohr> <chourouq> <fajr> <arabic-weekday> ...
// Times are written `H.MM`. The script walks the line stream and takes any run of
// exactly six `H.MM` cells preceded by a two-digit Gregorian day.
//
// usage: node grab-belgium.mjs be-emb-2026.txt
import { readFileSync, writeFileSync } from 'node:fs';

const MONTHS = ['JANVIER', 'FEVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
  'JUILLET', 'AOUT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DECEMBRE'];

const lines = readFileSync(process.argv[2], 'utf8').split('\n').map(s => s.trim());
const isTime = s => /^\d{1,2}\.\d{2}$/.test(s);
const rows = [];
let month = 0;

for (let i = 0; i < lines.length; i++) {
  const hit = MONTHS.findIndex((n, k) => new RegExp(`^${n}\\s+${k + 1}\\s*/\\s*2026`).test(lines[i]));
  if (hit >= 0) { month = hit + 1; continue; }
  if (!month) continue;
  if (!/^\d{1,2}$/.test(lines[i])) continue;
  const d = Number(lines[i]);
  if (!(d >= 1 && d <= 31)) continue;
  const t = [];
  for (let j = i + 1; j < i + 8 && j < lines.length; j++) {
    if (!isTime(lines[j])) break;
    t.push(lines[j].replace('.', ':'));
  }
  if (t.length !== 6) continue;
  // The block is printed right to left: icha, maghrib, asr, dhohr, chourouq, fajr.
  const [isha, maghrib, asr, dhuhr, sunrise, fajr] = t;
  rows.push([month, d, fajr, sunrise, dhuhr, asr, maghrib, isha].join('\t'));
  i += 6;
}

// Keep the first occurrence of each month-day: the PDF repeats its header blocks.
const seen = new Set(), out = [];
for (const r of rows) {
  const k = r.split('\t').slice(0, 2).join('-');
  if (seen.has(k)) continue;
  seen.add(k); out.push(r);
}

writeFileSync(new URL('./be-emb-2026.tsv', import.meta.url), out.join('\n') + '\n');
console.log(`${out.length} days parsed from the EMB's own 2026 table`);
const byMonth = {};
for (const r of out) { const m = r.split('\t')[0]; byMonth[m] = (byMonth[m] || 0) + 1; }
console.log('days per month:', JSON.stringify(byMonth));
