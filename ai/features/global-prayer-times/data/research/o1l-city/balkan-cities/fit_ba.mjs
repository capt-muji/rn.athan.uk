import fs from 'node:fs';
import { loadRows, compute, fitMargin, PRAYERS, perYear } from './fitlib.mjs';

const TZ = 'Europe/Sarajevo';
const coords = JSON.parse(fs.readFileSync('data/ba_coords.json', 'utf8'));
const elev = fs.existsSync('data/ba_elev.json') ? JSON.parse(fs.readFileSync('data/ba_elev.json', 'utf8')) : {};
const index = JSON.parse(fs.readFileSync('data/ba_cities_index.json', 'utf8'));
const ESS = { fajr: 18, isha: 16 };

const out = [];
for (const id of Object.keys(index).map(Number)) {
  const meta = index[id];
  const c = coords[id];
  if (!c) { console.error('NO COORDS', meta.place); continue; }
  const data = loadRows(`data/${meta.file}`);
  const rows = compute(data, { lat: c.lat, lon: c.lon, tz: TZ, ...ESS, madhab: 'shafi' });
  const margins = {};
  for (const p of PRAYERS) margins[p] = fitMargin(rows, p);
  const modes = Object.fromEntries(PRAYERS.map(p => [p, margins[p].mode]));
  const ms = Object.fromEntries(PRAYERS.map(p => [p, margins[p].margin]));
  const yr = perYear(rows, ms, modes);
  const rec = {
    id, place: meta.place, lat: c.lat, lon: c.lon, coordSource: c.source,
    terrain: elev[id] ? { elevationM: elev[id].cityElevationM, horizonEastDeg: elev[id].horizonEastDeg, horizonWestDeg: elev[id].horizonWestDeg } : null,
    margins: Object.fromEntries(PRAYERS.map(p => [p, { m: margins[p].margin, mode: margins[p].mode, exact: margins[p].exact, within1: margins[p].within1, mae: +margins[p].mae.toFixed(2), sd: +margins[p].sd.toFixed(2) }])),
    perYear: yr,
  };
  out.push(rec);
  const e = rec.terrain;
  console.error(`${meta.place.padEnd(16)} elev=${String(e?.elevationM ?? '-').padStart(5)} hE=${String(e?.horizonEastDeg ?? '-').padStart(6)} hW=${String(e?.horizonWestDeg ?? '-').padStart(6)} | sun ${String(ms.sunrise).padStart(4)}${margins.sunrise.mode[0]} dh ${String(ms.dhuhr).padStart(3)}${margins.dhuhr.mode[0]} asr ${String(ms.asr).padStart(3)} mg ${String(ms.maghrib).padStart(4)}${margins.maghrib.mode[0]} | exact ${margins.sunrise.exact}/${margins.maghrib.exact} mae ${margins.sunrise.mae.toFixed(1)}/${margins.maghrib.mae.toFixed(1)}`);
}
fs.writeFileSync(process.argv[2] ?? 'data/ba_fit_ess.json', JSON.stringify(out, null, 1));
console.error('cities', out.length);
