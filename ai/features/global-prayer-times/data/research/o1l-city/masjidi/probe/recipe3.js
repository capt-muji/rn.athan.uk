// Per-table recipe fit for every masjidi regional table.
// Solar: lat, lon, rise-set depression h0 (noon = midpoint of the table's own
// sunrise/maghrib). Columns: dhuhr offset, fajr depression, isha as a maghrib
// interval or a depression, asr shadow factor with its own offset.
const L = require('./fitlib');
const fs = require('fs');
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
const jd0 = d => d.getTime() / 86400000 + 2440587.5;
const med = a => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };

function hourAngle(alt, lat, dec) {
  const P = lat * D2R, d = dec * D2R;
  const ch = (Math.sin(alt * D2R) - Math.sin(P) * Math.sin(d)) / (Math.cos(P) * Math.cos(d));
  if (ch > 1 || ch < -1) return null;
  return Math.acos(ch) * R2D / 15 * 60;
}
function altitudeAt(hMinutes, lat, dec) {
  const H = (hMinutes / 4) * D2R, P = lat * D2R, d = dec * D2R;
  const v = Math.sin(P) * Math.sin(d) + Math.cos(P) * Math.cos(d) * Math.cos(H);
  return Math.asin(Math.max(-1, Math.min(1, v))) * R2D;
}

const COLS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const meta = JSON.parse(fs.readFileSync(__dirname + '/../data/table_meta.json', 'utf8'));
const results = [];

for (const f of process.argv.slice(2)) {
  const id = f.match(/region_(\d+)\.json/)[1];
  const m = meta[id] || {};
  const off = m.off == null ? 120 : m.off;
  const table = L.parseTable(f);
  const dates = Array.from({ length: table.length }, (_, i) => L.doyDate(i, true, YEAR));
  const dec = dates.map(d => sun(jd0(d)).dec);
  const eqt = dates.map(d => sun(jd0(d)).eqt);

  // ---- solar: lat / lon / h0
  const solar = (lat, lon, h0) => {
    let s = 0, n = 0;
    for (let i = 0; i < table.length; i++) {
      const noon = 720 - eqt[i] - 4 * (lon - off / 4);
      const Hs = hourAngle(h0, lat, dec[i]);
      if (Hs == null) return 1e9;
      s += (noon - Hs - table[i].Sunrise) ** 2 + (noon + Hs - table[i].Maghrib) ** 2; n += 2;
    }
    return Math.sqrt(s / n);
  };
  let best = { lat: 20, lon: 0, h0: -0.833, rms: 1e9 };
  for (let lat = -55; lat <= 60; lat += 0.25) {
    let sum = 0;
    for (let i = 0; i < table.length; i++) sum += ((table[i].Sunrise + table[i].Maghrib) / 2) - (720 - eqt[i]);
    const lon = off / 4 - (sum / table.length) / 4;
    let hsum = 0;
    for (let i = 0; i < table.length; i++) {
      const half = (table[i].Maghrib - table[i].Sunrise) / 2;
      hsum += altitudeAt(half, lat, dec[i]);
    }
    const h0 = hsum / table.length;
    const v = solar(lat, lon, h0);
    if (v < best.rms) best = { lat, lon, h0, rms: v };
  }
  let step = 0.1;
  while (step > 0.002) {
    let moved = false;
    for (const [a, b, c] of [[step, 0, 0], [-step, 0, 0], [0, step, 0], [0, -step, 0], [0, 0, step], [0, 0, -step]]) {
      const v = solar(best.lat + a, best.lon + b, best.h0 + c);
      if (v < best.rms) { best = { lat: best.lat + a, lon: best.lon + b, h0: best.h0 + c, rms: v }; moved = true; }
    }
    if (!moved) step /= 2;
  }

  // ---- columns
  const noonOf = i => 720 - eqt[i] - 4 * (best.lon - off / 4);
  const fajrAng = [], ishaAng = [], ishaInt = [], dOff = [], asr1 = [], asr2 = [];
  for (let i = 0; i < table.length; i++) {
    const n = noonOf(i);
    fajrAng.push(altitudeAt(n - table[i].Fajr, best.lat, dec[i]));
    ishaAng.push(altitudeAt(table[i].Isha - n, best.lat, dec[i]));
    ishaInt.push(table[i].Isha - table[i].Maghrib);
    dOff.push(table[i].Dhuhr - n);
    for (const f2 of [1, 2]) {
      const altAsr = Math.atan(1 / (f2 + Math.tan(Math.abs(best.lat - dec[i]) * D2R))) * R2D;
      const H = hourAngle(altAsr, best.lat, dec[i]);
      (f2 === 1 ? asr1 : asr2).push(H == null ? 1e9 : H - (table[i].Asr - n));
    }
  }
  const asrF = L.rms(asr1) <= L.rms(asr2) ? 1 : 2;
  const asrRaw = asrF === 1 ? asr1 : asr2;
  const asrOff = med(asrRaw.filter(x => Math.abs(x) < 1e8));
  const fajr = med(fajrAng);
  const fajrInt = med(table.map(r => r.Sunrise - r.Fajr));
  const ishaA = med(ishaAng);
  const ishaI = med(ishaInt);

  // isha: pick interval or angle by rms
  const predIshaI = [], predIshaA = [];
  for (let i = 0; i < table.length; i++) {
    predIshaI.push(table[i].Maghrib + ishaI);
    predIshaA.push(noonOf(i) + hourAngle(ishaA, best.lat, dec[i]));
  }
  const rI = L.rms(predIshaI.map((p, i) => p - table[i].Isha));
  const rA = L.rms(predIshaA.map((p, i) => p - table[i].Isha));
  const useInterval = rI <= rA;
  const rFajrA = L.rms(table.map((r, i) => (noonOf(i) - hourAngle(fajr, best.lat, dec[i])) - r.Fajr));
  const rFajrI = L.rms(table.map(r => (r.Sunrise - fajrInt) - r.Fajr));
  const fajrIsInterval = rFajrI < rFajrA;

  const dOffM = med(dOff);
  const res = {}; for (const k of COLS) res[k] = [];
  for (let i = 0; i < table.length; i++) {
    const n = noonOf(i);
    const Hs = hourAngle(best.h0, best.lat, dec[i]);
    const altAsr = Math.atan(1 / (asrF + Math.tan(Math.abs(best.lat - dec[i]) * D2R))) * R2D;
    const Ha = hourAngle(altAsr, best.lat, dec[i]);
    const c = {
      Fajr: fajrIsInterval ? table[i].Sunrise - fajrInt : n - hourAngle(fajr, best.lat, dec[i]),
      Sunrise: n - Hs,
      Dhuhr: n + dOffM,
      Asr: n + Ha + asrOff,
      Maghrib: n + Hs,
      Isha: useInterval ? n + Hs + ishaI : n + hourAngle(ishaA, best.lat, dec[i]),
    };
    for (const k of COLS) res[k].push(c[k] - table[i][k]);
  }
  const out = {
    id: +id, country: m.country || '?', off, tenants: m.tenants || 0,
    lat: +best.lat.toFixed(2), lon: +best.lon.toFixed(2), h0: +(-best.h0).toFixed(2),
    fajr: fajrIsInterval ? `S-${fajrInt}` : +(-fajr).toFixed(2),
    fajrModel: fajrIsInterval ? 'interval' : 'angle',
    isha: useInterval ? `M+${ishaI}` : +(-ishaA).toFixed(2),
    ishaModel: useInterval ? 'interval' : 'angle',
    asr: asrF === 2 ? 'Hanafi' : 'Shafi', asrOff: +asrOff.toFixed(1),
    dhuhrOff: +dOffM.toFixed(1),
    solarRms: +best.rms.toFixed(2), rms: {}, within1: {}, mean: {},
  };
  let all = [];
  for (const k of COLS) {
    out.rms[k] = +L.rms(res[k]).toFixed(2);
    out.within1[k] = Math.round(100 * res[k].filter(x => Math.abs(x) <= 1).length / res[k].length);
    out.mean[k] = +L.mean(res[k]).toFixed(2);
    all = all.concat(res[k]);
  }
  out.rmsAll = +L.rms(all).toFixed(2);
  out.within1All = Math.round(100 * all.filter(x => Math.abs(x) <= 1).length / all.length);
  out.ishaIntMin = Math.min(...ishaInt); out.ishaIntMax = Math.max(...ishaInt);
  results.push(out);
}
results.sort((a, b) => a.id - b.id);
fs.writeFileSync(__dirname + '/../out/recipes.json', JSON.stringify(results, null, 1));
console.log('tables', results.length);
console.log('within1All median', med(results.map(r => r.within1All)));
console.log('rmsAll median', med(results.map(r => r.rmsAll)));
console.log('h0 range', Math.min(...results.map(r => r.h0)), Math.max(...results.map(r => r.h0)));
