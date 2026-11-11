// Print the band table from data/band-scores.json (read-only helper).
import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync(new URL('./data/band-scores.json', import.meta.url), 'utf8'));
const order = { control: 0, '45-55': 1, '55-60': 2, '>60': 3 };
const rows = d.surfaces.slice().sort((a, b) => order[a.band] - order[b.band] || (a.fajr.mean ?? 999) - (b.fajr.mean ?? 999));
for (const s of rows) {
  const f = s.fajr.mean ?? 'null';
  const i = s.isha.mean ?? 'null';
  const syn = s.syntheticDays ? ` syn${s.syntheticDays}` : '';
  const und = s.undefinedFajr || s.undefinedIsha ? ` und${s.undefinedFajr}/${s.undefinedIsha}` : '';
  console.log(
    String(s.band).padEnd(7), s.id.padEnd(28), String(s.lat).padEnd(6),
    'f', String(f).padEnd(6), 'i', String(i).padEnd(6),
    'w2f', String(s.fajr.within2).padEnd(5), 'w2i', String(s.isha.within2).padEnd(5),
    'janF/julF', (s.fajr.jan ?? '-') + '/' + (s.fajr.jul ?? '-'),
    'janI/julI', (s.isha.jan ?? '-') + '/' + (s.isha.jul ?? '-'),
    String(s.rows).padEnd(4), s.tier.slice(0, 4) + syn + und,
  );
}
console.log('TOTAL', d.surfaces.length);
