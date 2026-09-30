// R9: Norway's summer rule, isolated. Sweden freezes a FRACTION OF THE NIGHT; Norway
// does something different and simpler, and the difference matters because the two
// countries share a border and a latitude band.
//
// Islamsk Rad Norge holds the printed Fajr and Isha at a FIXED CLOCK TIME for weeks
// at a stretch, in blocks, while the `Morgengry 16` and `Kveldsgry 15` columns stay
// blank. This script counts the blocks and their lengths.
import { readFileSync } from 'node:fs';

const rows = [];
for (const line of readFileSync(new URL('./no-oslo-2026.tsv', import.meta.url), 'utf8').split('\n')) {
  const c = line.split('\t');
  if (c.length !== 13) continue;
  const [dato, , morgengry, fajr, , , , , , maghrib, isha, kveldsgry] = c;
  const [d, m] = dato.split('.').map(Number);
  rows.push({ m, d, morgengry, fajr, maghrib, isha, kveldsgry });
}
rows.sort((a, b) => a.m - b.m || a.d - b.d);

const blocks = (key) => {
  const out = [];
  let cur = null;
  for (const r of rows) {
    const v = r[key];
    if (cur && cur.value === v) { cur.days++; cur.to = `${r.m}-${r.d}`; continue; }
    if (cur) out.push(cur);
    cur = { value: v, days: 1, from: `${r.m}-${r.d}`, to: `${r.m}-${r.d}` };
  }
  if (cur) out.push(cur);
  return out;
};

for (const key of ['fajr', 'isha']) {
  const b = blocks(key).filter(x => x.days >= 5);
  console.log(`\n${key}: runs of 5 or more consecutive days on the SAME printed clock time`);
  for (const x of b) console.log(`  ${x.value}  held for ${String(x.days).padStart(3)} days, ${x.from} to ${x.to}`);
  const held = b.reduce((s, x) => s + x.days, 0);
  console.log(`  total days inside such a run: ${held} of ${rows.length}`);
}

// Cross-check: does each frozen value equal the angle-derived value on the last day
// before the freeze, that is, is this the classic `Aqrab al-Ayyam` (nearest day) rule?
const firstBlank = rows.findIndex(r => !r.morgengry);
if (firstBlank > 0) {
  console.log(`\nlast day with the 'Morgengry 16' column filled: ${rows[firstBlank - 1].m}-${rows[firstBlank - 1].d},` +
    ` Fajr ${rows[firstBlank - 1].fajr}`);
  console.log(`first day with it blank:                        ${rows[firstBlank].m}-${rows[firstBlank].d},` +
    ` Fajr ${rows[firstBlank].fajr}`);
}
const lastBlankIdx = rows.length - 1 - [...rows].reverse().findIndex(r => !r.morgengry);
if (lastBlankIdx < rows.length - 1) {
  console.log(`last day blank:                                 ${rows[lastBlankIdx].m}-${rows[lastBlankIdx].d},` +
    ` Fajr ${rows[lastBlankIdx].fajr}`);
  console.log(`first day filled again:                         ${rows[lastBlankIdx + 1].m}-${rows[lastBlankIdx + 1].d},` +
    ` Fajr ${rows[lastBlankIdx + 1].fajr}`);
}
