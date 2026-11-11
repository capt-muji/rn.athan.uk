// Generic solar solver: fit (lat, lon, horizon) to a table's sunrise/maghrib.
const L = require('./fitlib');
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const YEAR = 2028;

function sun(jd) {
  const D = jd - 2451545.0;
  const g = (357.529 + 0.98560028 * D) * D2R;
  const q = 280.459 + 0.98564736 * D;
  const Ls = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * D2R;
  const e = (23.439 - 0.00000036 * D) * D2R;
  const dec = Math.asin(Math.sin(e) * Math.sin(Ls)) * R2D;
  let ra = Math.atan2(Math.cos(e) * Math.sin(Ls), Math.cos(Ls)) * R2D;
  ra = ((ra % 360) + 360) % 360;
  let eqt = q - ra;
  eqt = (((eqt + 180) % 360) + 360) % 360 - 180;
  return { dec, eqt: eqt * 4 };
}
function jdOf(date, frac) { return date.getTime() / 86400000 + 2440587.5 + (frac || 0.5); }

// sunrise/sunset in clock minutes given offset, h0 in degrees
function solar(lat, lon, date, offsetMin, h0) {
  const s = sun(jdOf(date));
  const p = lat * D2R, d = s.dec * D2R;
  const ch = (Math.sin(h0 * D2R) - Math.sin(p) * Math.sin(d)) / (Math.cos(p) * Math.cos(d));
  if (ch > 1 || ch < -1) return null;
  const H = Math.acos(ch) * R2D / 15; // hours
  const noon = 12 - s.eqt / 60 - (lon - offsetMin / 4) / 15; // clock hours
  return { sunrise: (noon - H) * 60, maghrib: (noon + H) * 60, noon: noon * 60 };
}

function cost(table, dates, lat, lon, off, h0) {
  const r = [];
  for (let i = 0; i < table.length; i++) {
    const c = solar(lat, lon, dates[i], off, h0);
    if (!c) return 1e9;
    r.push(c.sunrise - table[i].Sunrise, c.maghrib - table[i].Maghrib);
  }
  return L.rms(r);
}

function fit(table, off) {
  const dates = Array.from({ length: table.length }, (_, i) => L.doyDate(i, true, YEAR));
  let best = { lat: 0, lon: 0, h0: -0.833, cost: 1e9 };
  for (let lat = 5; lat <= 62; lat += 1)
    for (let h0 = -2.4; h0 <= 0.2; h0 += 0.1) {
      // lon from mean noon residual (analytic): minimise dnoon
      let sum = 0;
      for (let i = 0; i < table.length; i++) {
        const c = solar(lat, 0, dates[i], off, h0);
        if (c) sum += ((table[i].Sunrise + table[i].Maghrib) / 2) - c.noon;
      }
      const lon = -sum / table.length / 4; // 1 min = 0.25 deg
      const v = cost(table, dates, lat, lon, off, h0);
      if (v < best.cost) best = { lat, lon, h0, cost: v };
    }
  let step = 0.5;
  while (step > 0.002) {
    let moved = false;
    for (const [a, b, c2] of [[step, 0, 0], [-step, 0, 0], [0, step, 0], [0, -step, 0], [0, 0, step], [0, 0, -step]]) {
      const v = cost(table, dates, best.lat + a, best.lon + b, off, best.h0 + c2);
      if (v < best.cost) { best = { lat: best.lat + a, lon: best.lon + b, h0: best.h0 + c2, cost: v }; moved = true; }
    }
    if (!moved) step /= 2;
  }
  return { best, dates };
}

const files = process.argv.slice(2);
for (const f of files) {
  const table = L.parseTable(f);
  const off = 120;
  const { best, dates } = fit(table, off);
  const resid = [];
  const monthly = [];
  for (let i = 0; i < table.length; i++) {
    const c = solar(best.lat, best.lon, dates[i], off, best.h0);
    resid.push(c.sunrise - table[i].Sunrise, c.maghrib - table[i].Maghrib);
    if (i % 30 === 0) monthly.push(+((c.maghrib - table[i].Maghrib)).toFixed(1));
  }
  console.log(JSON.stringify({ f: f.split('/').pop(), lat: +best.lat.toFixed(2), lon: +best.lon.toFixed(3), h0: +best.h0.toFixed(2), rms: +best.cost.toFixed(3), sample30: monthly }));
}
