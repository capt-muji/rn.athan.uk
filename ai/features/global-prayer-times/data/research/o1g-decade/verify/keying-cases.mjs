// Stage 8: concrete counterexamples for the MM-DD vs day-of-year keying claim,
// built from our own extraction and the recipe tables.
import fs from 'node:fs';
import path from 'node:path';

const HOME = process.env.HOME;
const ROOT = path.join(HOME, 'athan-gitree/census/o1g-decade');
const OUT = path.join(ROOT, 'verify');
const ext = JSON.parse(fs.readFileSync(path.join(OUT, 'extract-2028-2038.json'), 'utf8'));
const recipe = JSON.parse(fs.readFileSync(path.join(ROOT, 'fit/recipe.json'), 'utf8'));
const pad = (n) => String(n).padStart(2, '0');
const doy = (y, m, d) => Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000) + 1;

// DOY index -> MM-DD from the 2027 reference year
const byDoy = new Map();
for (let m = 1; m <= 12; m++) {
  const dim = new Date(Date.UTC(2027, m, 0)).getUTCDate();
  for (let d = 1; d <= dim; d++) byDoy.set(doy(2027, m, d), `${pad(m)}-${pad(d)}`);
}

const cases = ['2028-03-02', '2028-06-30', '2032-03-02', '2036-12-25', '2028-02-29'];
const out = cases.map((k) => {
  const [y, m, d] = k.split('-').map(Number);
  const mmdd = k.slice(5);
  const idx = doy(y, m, d);
  const borrowed = byDoy.get(idx);
  const r = ext[k];
  const truthLead = r.sunrise - r.fajr, truthLag = r.isha - r.magrib;
  return {
    date: k,
    truthLead, truthLag,
    mmddOffset: { fajr: recipe.prayers.fajr.table[mmdd], isha: recipe.prayers.isha.table[mmdd] },
    doyWouldBorrow: borrowed,
    doyOffset: { fajr: recipe.prayers.fajr.table[borrowed], isha: recipe.prayers.isha.table[borrowed] },
    mmddErr: { fajr: recipe.prayers.fajr.table[mmdd] - truthLead, isha: recipe.prayers.isha.table[mmdd] - truthLag },
    doyErr: { fajr: recipe.prayers.fajr.table[borrowed] - truthLead, isha: recipe.prayers.isha.table[borrowed] - truthLag },
  };
});
fs.writeFileSync(path.join(OUT, 'stage8-keying-cases.json'), JSON.stringify(out, null, 2));
for (const c of out) console.log(JSON.stringify(c));
