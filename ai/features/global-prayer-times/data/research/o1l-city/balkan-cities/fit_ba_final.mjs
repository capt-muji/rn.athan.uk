// Bosnia final object: fajr 18 / isha 16 at the city's own point, sunrise+sunset at a
// shared horizon depression A, per-column minute temkin. Tests one recipe across 61 cities.
import fs from 'node:fs';
import { loadRows, compute, PRAYERS, fitMargin, perYear } from './fitlib.mjs';
const TZ='Europe/Sarajevo';
const coords=JSON.parse(fs.readFileSync('data/ba_coords.json','utf8'));
const elev=JSON.parse(fs.readFileSync('data/ba_elev.json','utf8'));
const index=JSON.parse(fs.readFileSync('data/ba_cities_index.json','utf8'));

function build(data, c, A) {
  const a = compute(data, { lat: c.lat, lon: c.lon, tz: TZ, fajr: 18, isha: 16, madhab: 'shafi' });
  const s = compute(data, { lat: c.lat, lon: c.lon, tz: TZ, fajr: A, isha: A, madhab: 'shafi' });
  return a.map((r, i) => ({ date: r.date, want: r.want, got: { fajr: r.got.fajr, sunrise: s[i].got.fajr, dhuhr: r.got.dhuhr, asr: r.got.asr, maghrib: s[i].got.isha, isha: r.got.isha } }));
}
const cities = [];
for (const id of Object.keys(index).map(Number)) { const c = coords[id]; if (!c) continue; cities.push({ id, meta: index[id], c, data: loadRows('data/' + index[id].file) }); }

function totalScore(A) {
  let e = 0, w = 0, n = 0;
  for (const { c, data } of cities) {
    const rows = build(data, c, A);
    for (const p of PRAYERS) { const m = fitMargin(rows, p); e += m.exact; w += m.within1; n += m.n; }
  }
  return { e, w, n };
}
let best = null;
for (let A = 1.3; A <= 2.6 + 1e-9; A += 0.1) {
  const s = totalScore(+A.toFixed(1));
  console.log('A', A.toFixed(1), 'exact', s.e, (100 * s.e / s.n).toFixed(1) + '%', 'w1', s.w, (100 * s.w / s.n).toFixed(1) + '%');
  if (!best || s.w > best.s.w) best = { A: +A.toFixed(1), s };
}
console.log('BEST A', best.A, JSON.stringify(best.s));

const out = [];
for (const { id, meta, c, data } of cities) {
  const rows = build(data, c, best.A);
  const rec = { id, place: meta.place, lat: c.lat, lon: c.lon, elevationM: elev[id]?.cityElevationM ?? null, horizonDeg: best.A, margins: {}, perYear: [] };
  const ms = {}, modes = {};
  for (const p of PRAYERS) { const m = fitMargin(rows, p); ms[p] = m.margin; modes[p] = m.mode; rec.margins[p] = { m: m.margin, mode: m.mode, exact: m.exact, within1: m.within1, mae: +m.mae.toFixed(2), sd: +m.sd.toFixed(2) }; }
  rec.perYear = perYear(rows, ms, modes);
  out.push(rec);
}
fs.writeFileSync('data/ba_fit_final.json', JSON.stringify(out, null, 1));
const tot = out.reduce((a, r) => ({ e: a.e + r.perYear[0].exact, w: a.w + r.perYear[0].within1, n: a.n + r.perYear[0].n }), { e: 0, w: 0, n: 0 });
console.log('FINAL exact', tot.e, (100 * tot.e / tot.n).toFixed(1) + '%', 'w1', tot.w, (100 * tot.w / tot.n).toFixed(1) + '%', 'of', tot.n);
for (const r of out.sort((a, b) => a.perYear[0].within1 / a.perYear[0].n - b.perYear[0].within1 / b.perYear[0].n).slice(0, 8))
  console.log('worst', r.place.padEnd(16), r.elevationM, r.perYear[0].within1 + '/' + r.perYear[0].n);
