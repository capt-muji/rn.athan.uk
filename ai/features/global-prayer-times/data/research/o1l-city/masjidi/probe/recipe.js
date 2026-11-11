// Full per-table recipe fit for every masjidi regional table.
// Recipe: lat, lon, rise-set depression h0, fajr depression, isha depression (or
// maghrib interval), asr shadow factor, dhuhr offset. Solar position from a precise
// series. Scored at the table's integer-minute resolution.
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

// times in clock minutes
function times(lat, lon, off, dec, eqt, p) {
  const P = lat * D2R, d = dec * D2R;
  const noon = 720 - eqt - 4 * (lon - off / 4);
  function hourAngle(alt) {
    const ch = (Math.sin(alt * D2R) - Math.sin(P) * Math.sin(d)) / (Math.cos(P) * Math.cos(d));
    if (ch > 1 || ch < -1) return null;
    return Math.acos(ch) * R2D / 15 * 60;
  }
  const Hs = hourAngle(p.h0);
  const Hf = hourAngle(p.fajr);
  let Hi = p.ishaInt ? null : hourAngle(p.isha);
  const altAsr = Math.atan(1 / (p.asrF + Math.tan(Math.abs(lat - dec) * D2R))) * R2D;
  const Ha = hourAngle(altAsr);
  if (Hs == null || Hf == null || Ha == null) return null;
  const out = { Sunrise: noon - Hs, Dhuhr: noon + p.dhuhrOff, Asr: noon + Ha, Maghrib: noon + Hs, Fajr: noon - Hf };
  out.Isha = p.ishaInt ? out.Maghrib + p.ishaInt : noon + Hi;
  return out;
}

const COLS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const meta = JSON.parse(fs.readFileSync(__dirname + '/../data/table_meta.json', 'utf8'));
const files = process.argv.slice(2);
const results = [];

for (const f of files) {
  const id = f.match(/region_(\d+)\.json/)[1];
  const m = meta[id] || {};
  const off = m.off == null ? 120 : m.off;
  const table = L.parseTable(f);
  const dates = Array.from({ length: table.length }, (_, i) => L.doyDate(i, true, YEAR));
  const dec = dates.map(d => sun(jd0(d)).dec);
  const eqt = dates.map(d => sun(jd0(d)).eqt);

  function score(p) {
    let s = 0, n = 0;
    for (let i = 0; i < table.length; i++) {
      const c = times(p.lat, p.lon, off, dec[i], eqt[i], p);
      if (!c) return 1e9;
      for (const k of COLS) { const e = c[k] - table[i][k]; s += e * e; n++; }
    }
    return Math.sqrt(s / n);
  }
  function solarScore(p) {
    let s = 0, n = 0;
    for (let i = 0; i < table.length; i++) {
      const c = times(p.lat, p.lon, off, dec[i], eqt[i], p);
      if (!c) return 1e9;
      s += (c.Sunrise - table[i].Sunrise) ** 2 + (c.Maghrib - table[i].Maghrib) ** 2; n += 2;
    }
    return Math.sqrt(s / n);
  }

  // 1. latitude: scan; longitude from mean noon residual; h0 from mean half-day residual
  let best = { lat: 20, h0: -0.833, rms: 1e9 };
  for (let lat = -55; lat <= 60; lat += 0.25) {
    const p = { lat, lon: 0, off, h0: -0.833, fajr: 18, isha: 18, asrF: 1, dhuhrOff: 0 };
    // lon: minimise mean noon
    let sum = 0;
    for (let i = 0; i < table.length; i++) sum += ((table[i].Sunrise + table[i].Maghrib) / 2) - (720 - eqt[i]);
    p.lon = -(sum / table.length) / 4 + off / 4;
    // h0: from mean half-day at this lat
    let hsum = 0, hn = 0;
    for (let i = 0; i < table.length; i++) {
      const half = (table[i].Maghrib - table[i].Sunrise) / 2 / 4 * D2R;
      const P = lat * D2R, d = dec[i] * D2R;
      const v = Math.sin(P) * Math.sin(d) + Math.cos(P) * Math.cos(d) * Math.cos(half);
      hsum += Math.asin(Math.max(-1, Math.min(1, v))) * R2D; hn++;
    }
    p.h0 = hsum / hn;
    const v = solarScore(p);
    if (v < best.rms) best = { lat, h0: p.h0, rms: v, lon: p.lon };
  }
  // refine lat/h0/lon
  let step = 0.1;
  while (step > 0.002) {
    let moved = false;
    for (const [a, b, c] of [[step, 0, 0], [-step, 0, 0], [0, step, 0], [0, -step, 0], [0, 0, step], [0, 0, -step]]) {
      const p = { lat: best.lat + a, lon: best.lon + b, h0: best.h0 + c, fajr: 18, isha: 18, asrF: 1, dhuhrOff: 0 };
      const v = solarScore(p);
      if (v < best.rms) { best = { lat: p.lat, lon: p.lon, h0: p.h0, rms: v }; moved = true; }
    }
    if (!moved) step /= 2;
  }

  // 2. angles from the table given the solar recipe
  const fajrAngles = [], ishaAngles = [], ishaInts = [], asrScores = { 1: [], 2: [] };
  for (let i = 0; i < table.length; i++) {
    const noon = (table[i].Sunrise + table[i].Maghrib) / 2;
    const P = best.lat * D2R, d = dec[i] * D2R;
    const ang = t => {
      const H = ((noon - t) / 4) * D2R;
      const v = Math.sin(P) * Math.sin(d) + Math.cos(P) * Math.cos(d) * Math.cos(H);
      return Math.asin(Math.max(-1, Math.min(1, v))) * R2D;
    };
    fajrAngles.push(ang(table[i].Fajr));
    ishaAngles.push(ang(table[i].Isha));
    ishaInts.push(table[i].Isha - table[i].Maghrib);
    const dH = table[i].Asr - table[i].Dhuhr;
    for (const f2 of [1, 2]) {
      const altAsr = Math.atan(1 / (f2 + Math.tan(Math.abs(best.lat - dec[i]) * D2R))) * R2D;
      const ch = (Math.sin(altAsr * D2R) - Math.sin(P) * Math.sin(d)) / (Math.cos(P) * Math.cos(d));
      const H = Math.acos(Math.max(-1, Math.min(1, ch))) * R2D / 15 * 60;
      asrScores[f2].push(H - dH);
    }
  }
  const med = a => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
  const ishaIntMed = med(ishaInts);
  const ishaIntSd = L.rms(ishaInts.map(x => x - ishaIntMed));
  const asrF = L.rms(asrScores[1]) < L.rms(asrScores[2]) ? 1 : 2;

  const p = { lat: best.lat, lon: best.lon, h0: best.h0, fajr: med(fajrAngles), isha: med(ishaAngles), asrF, dhuhrOff: 0, ishaInt: 0 };
  // isha: interval if the interval is more stable than the angle
  const ishaAngleSd = L.rms(ishaAngles.map(x => x - med(ishaAngles)));
  if (ishaIntSd < ishaAngleSd * 2 && ishaIntMed > 30) p.ishaInt = Math.round(ishaIntMed);

  // dhuhr offset
  const dOffs = [];
  for (let i = 0; i < table.length; i++) {
    const c = times(best.lat, best.lon, off, dec[i], eqt[i], p);
    if (c) dOffs.push(table[i].Dhuhr - c.Dhuhr);
  }
  p.dhuhrOff = med(dOffs);

  // final per-column residual
  const res = {}; for (const k of COLS) res[k] = [];
  for (let i = 0; i < table.length; i++) {
    const c = times(p.lat, p.lon, off, dec[i], eqt[i], p);
    for (const k of COLS) res[k].push(c[k] - table[i][k]);
  }
  const out = {
    id: +id, country: m.country || '?', off, tenants: m.tenants || 0,
    lat: +p.lat.toFixed(2), lon: +p.lon.toFixed(2), h0: +p.h0.toFixed(2),
    fajr: +p.fajr.toFixed(2), isha: p.ishaInt ? 'M+' + p.ishaInt : +p.isha.toFixed(2),
    asr: asrF === 2 ? 'Hanafi' : 'Shafi', dhuhrOff: +p.dhuhrOff.toFixed(1),
    solarRms: +best.rms.toFixed(2),
    rms: {}, within1: {}, mean: {},
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
  results.push(out);
  console.log(JSON.stringify(out));
}
fs.writeFileSync(__dirname + '/../out/recipes.json', JSON.stringify(results, null, 1));
