// Chile 2016 fit: recover each poster's reference point, then read the margins off it.
//
// Coordinates are fitted on the two columns that carry no published safety margin,
// sunrise and dhuhr (pure geometry), because a large maghrib guard would otherwise
// drag the search inland. The per-column margins are then read as the residuals.
const fs = require('fs');
const path = require('path');
const adhan = require(path.join(process.env.HOME, 'athan-gitree/census/adhan-build/node_modules/adhan'));

const ROOT = path.join(__dirname, '..');
const TZ = 'America/Santiago';
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const FIT_COLS = ['sunrise', 'dhuhr'];

const FMT = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
});

function minutes(date) {
  const [h, m, sec] = FMT.format(date).split(':').map(Number);
  return h * 60 + m + sec / 60;
}

function params() {
  const p = adhan.CalculationMethod.Other();
  p.fajrAngle = 18;
  p.ishaAngle = 17;
  p.madhab = adhan.Madhab.Shafi;
  p.rounding = adhan.Rounding.None;
  return p;
}

function rawAt(coords, days) {
  const p = params();
  const out = {};
  for (const day of days) {
    const [y, m, d] = day.split('-').map(Number);
    const t = new adhan.PrayerTimes(new adhan.Coordinates(coords.lat, coords.lng), new Date(Date.UTC(y, m - 1, d, 12)), p);
    out[day] = { fajr: minutes(t.fajr), sunrise: minutes(t.sunrise), dhuhr: minutes(t.dhuhr), asr: minutes(t.asr), maghrib: minutes(t.maghrib), isha: minutes(t.isha) };
  }
  return out;
}

function printed(table, day, col) {
  const [h, m] = table[day][col].split(':').map(Number);
  return h * 60 + m;
}

function mae(table, raw, days, cols) {
  let sum = 0, n = 0;
  for (const day of days) {
    for (const c of cols) {
      sum += Math.abs(raw[day][c] - printed(table, day, c));
      n += 1;
    }
  }
  return sum / n;
}

function marginOf(table, raw, col) {
  const r = Object.keys(table).map((day) => printed(table, day, col) - raw[day][col]).sort((a, b) => a - b);
  return r[Math.floor(r.length / 2)];
}

function score(table, raw, margins) {
  const stat = {};
  COLS.forEach((c) => { stat[c] = { n: 0, e: 0, w1: 0, worst: 0 }; });
  for (const day of Object.keys(table)) {
    for (const c of COLS) {
      const diff = Math.abs(Math.round(raw[day][c] + margins[c]) - printed(table, day, c));
      const s = stat[c];
      s.n += 1;
      if (diff === 0) s.e += 1;
      if (diff <= 1) s.w1 += 1;
      if (diff > s.worst) s.worst = diff;
    }
  }
  const tot = COLS.reduce((a, c) => a + stat[c].n, 0);
  const e = COLS.reduce((a, c) => a + stat[c].e, 0);
  const w1 = COLS.reduce((a, c) => a + stat[c].w1, 0);
  return { exact: 100 * e / tot, within1: 100 * w1 / tot, worst: Math.max(...COLS.map((c) => stat[c].worst)) };
}

const CITIES = {
  Arica: [-18.4783, -70.3126], Iquique: [-20.2208, -70.1431], Antofagasta: [-23.6509, -70.3975],
  Calama: [-22.4567, -68.9237], Copiapo: [-27.3668, -70.3323], 'La Serena': [-29.9027, -71.2519],
  Valparaiso: [-33.0472, -71.6127], 'Vina del Mar': [-33.0245, -71.5518], Santiago: [-33.4489, -70.6693],
  Rancagua: [-34.1708, -70.7444], Talca: [-35.4264, -71.6554], Concepcion: [-36.8270, -73.0503],
  Temuco: [-38.7359, -72.5904], Valdivia: [-39.8142, -73.2459], Osorno: [-40.5739, -73.1335],
  'Puerto Montt': [-41.4693, -72.9424], Coyhaique: [-45.5752, -72.0662], 'Punta Arenas': [-53.1638, -70.9171],
};

const DATA_FILE = process.argv[2] || 'cl-2016-03.json';
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', DATA_FILE), 'utf8'));
const lines = [];
const summary = {};

for (const [code, table] of Object.entries(data)) {
  const days = Object.keys(table).sort();
  const sample = [days[0], days[Math.floor(days.length / 2)], days[days.length - 1]];
  let best = null;
  for (let lat = -56; lat <= -17; lat += 0.25) {
    for (let lng = -76; lng <= -66; lng += 0.25) {
      const raw = rawAt({ lat, lng }, sample);
      const m = mae(table, raw, sample, FIT_COLS);
      if (!best || m < best.mae) best = { lat, lng, mae: m };
    }
  }
  let fine = best;
  for (let lat = best.lat - 0.4; lat <= best.lat + 0.4; lat += 0.02) {
    for (let lng = best.lng - 0.4; lng <= best.lng + 0.4; lng += 0.02) {
      const raw = rawAt({ lat, lng }, days);
      const m = mae(table, raw, days, FIT_COLS);
      if (m < fine.mae) fine = { lat, lng, mae: m };
    }
  }
  const raw = rawAt({ lat: fine.lat, lng: fine.lng }, days);
  const margins = Object.fromEntries(COLS.map((c) => [c, marginOf(table, raw, c)]));
  const sc = score(table, raw, margins);
  let near = null;
  for (const [name, [clat, clng]] of Object.entries(CITIES)) {
    const d = Math.hypot((clat - fine.lat) * 111, (clng - fine.lng) * 111 * Math.cos(fine.lat * Math.PI / 180));
    if (!near || d < near.d) near = { name, d };
  }
  summary[code] = { point: [Number(fine.lat.toFixed(2)), Number(fine.lng.toFixed(2))], margins, nearest: near.name, km: Math.round(near.d), exact: Number(sc.exact.toFixed(1)), within1: Number(sc.within1.toFixed(1)), worst: sc.worst };
  lines.push(`${code} point ${fine.lat.toFixed(2)}/${fine.lng.toFixed(2)} geom-mae ${fine.mae.toFixed(2)} | nearest ${near.name} ${near.d.toFixed(0)} km | margins ${COLS.map((c) => c + ' ' + margins[c].toFixed(1)).join(' ')} | exact ${sc.exact.toFixed(0)} w1 ${sc.within1.toFixed(0)} worst ${sc.worst}`);
}

fs.writeFileSync(path.join(ROOT, 'data', DATA_FILE.replace('.json', '-fit.json')), JSON.stringify(summary, null, 2));
console.log(lines.join('\n'));
