import fs from 'node:fs';
import { loadRows, compute, fitMargin, fitAngle, PRAYERS, perYear } from './fitlib.mjs';

function fitCity(file, { lat, lon, tz, fajr, isha, grid }) {
  const data = loadRows(file);
  let params = { fajr, isha };
  if (grid) {
    const f = fitAngle(data, { lat, lon, tz, isha }, 'fajr', grid.fajr[0], grid.fajr[1]);
    const i = fitAngle(data, { lat, lon, tz, fajr: f.angle }, 'isha', grid.isha[0], grid.isha[1]);
    params = { fajr: f.angle, isha: i.angle };
  }
  const rows = compute(data, { lat, lon, tz, ...params, madhab: 'shafi' });
  const margins = {}, modes = {}, ms = {};
  for (const p of PRAYERS) { margins[p] = fitMargin(rows, p); modes[p] = margins[p].mode; ms[p] = margins[p].margin; }
  const yr = perYear(rows, ms, modes);
  const out = { place: file, lat, lon, tz, params, margins: {}, perYear: yr };
  for (const p of PRAYERS) out.margins[p] = { m: margins[p].margin, mode: margins[p].mode, exact: margins[p].exact, within1: margins[p].within1, mae: +margins[p].mae.toFixed(2), sd: +margins[p].sd.toFixed(2), n: margins[p].n };
  return out;
}
const me = fitCity('data/me_vaktijame_grp0_2026.json', { lat: 42.4304, lon: 19.2594, tz: 'Europe/Podgorica', fajr: 19.5, isha: 17.5 });
const rs = fitCity('data/rs_devridaim_2025_novipazar.json', { lat: 43.1367, lon: 20.5122, tz: 'Europe/Belgrade', grid: { fajr: [16, 20], isha: [14, 19] } });
fs.writeFileSync('data/me_grp0_fit.json', JSON.stringify(me, null, 1));
fs.writeFileSync('data/rs_novipazar_fit.json', JSON.stringify(rs, null, 1));
for (const [n, o] of [['ME grp0 Podgorica', me], ['RS Novi Pazar 2025', rs]]) {
  console.log('##', n, JSON.stringify(o.params));
  for (const p of PRAYERS) console.log('  ', p.padEnd(8), 'm', String(o.margins[p].m).padStart(5), o.margins[p].mode.padEnd(5), 'exact', o.margins[p].exact, 'w1', o.margins[p].within1, 'mae', o.margins[p].mae, 'sd', o.margins[p].sd);
  console.log('   perYear', JSON.stringify(o.perYear));
}
