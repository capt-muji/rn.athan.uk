import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { PrayEngine } = require(process.env.HOME + '/athan-gitree/census/o1f-london/praytimes.cjs');

const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const TZOFF = {
  'Africa/Douala': 1, 'Africa/Ndjamena': 1, 'Africa/Bangui': 1, 'Africa/Lubumbashi': 2,
  'Africa/Brazzaville': 1, 'Africa/Libreville': 1, 'Africa/Malabo': 1, 'Africa/Kinshasa': 1,
};
const ROUND = {
  nearest: (x) => Math.round(x),
  floor: (x) => Math.floor(x),
  ceil: (x) => Math.ceil(x),
};

function compute(eng, date, p) {
  const [y, m, d] = date.split('-').map(Number);
  const t = eng.times(y, m, d, p);
  return { fajr: t.fajr * 60, sunrise: t.sunrise * 60, dhuhr: t.dhuhr * 60, asr: t.asr * 60, maghrib: t.maghrib * 60, isha: t.isha * 60 };
}

function sweep(rows, eng, key, values, apply, conv) {
  let best = null;
  for (const v of values) {
    let se = 0, ex = 0, w1 = 0;
    for (const r of rows) {
      const c = compute(eng, r.date, apply(v));
      let pred = ROUND[conv](c[key]);
      let e = toMin(r[key]) - pred;
      if (e > 720) e -= 1440; if (e < -720) e += 1440;
      se += Math.abs(e); if (e === 0) ex++; if (Math.abs(e) <= 1) w1++;
    }
    const mae = se / rows.length;
    if (!best || mae < best.mae) best = { value: v, mae: +mae.toFixed(3), exact: ex, within1: w1 };
  }
  return best;
}

const range = (a, b, s) => { const o = []; for (let x = a; x <= b + 1e-9; x += s) o.push(+x.toFixed(3)); return o; };

const out = [];
for (const f of process.argv.slice(2)) {
  const src = JSON.parse(fs.readFileSync(f, 'utf8'));
  const tzOff = TZOFF[src.timezone];
  if (tzOff === undefined) throw new Error('tz ' + src.timezone);
  const eng = new PrayEngine(src.latitude, src.longitude, tzOff);
  const rows = src.rows;

  const baseP = (o = {}) => ({ fajr: 18, ishaAngle: 17, asrFactor: 1, ...o });
  // rounding convention: pick from sunrise (angle 0.833, no free parameter)
  let conv = 'nearest', bestSr = null;
  for (const c of ['nearest', 'floor', 'ceil']) {
    let ex = 0, se = 0;
    for (const r of rows) {
      const v = compute(eng, r.date, baseP());
      const pred = ROUND[c](v.sunrise);
      let e = toMin(r.sunrise) - pred; if (e > 720) e -= 1440; if (e < -720) e += 1440;
      if (e === 0) ex++; se += Math.abs(e);
    }
    const mae = se / rows.length;
    if (!bestSr || mae < bestSr.mae) { bestSr = { c, mae: +mae.toFixed(3), exact: ex }; conv = c; }
  }

  const fajr = sweep(rows, eng, 'fajr', range(10, 22, 0.01), (v) => baseP({ fajr: v }), conv);
  const isha = sweep(rows, eng, 'isha', range(10, 22, 0.01), (v) => baseP({ ishaAngle: v }), conv);
  const asr = sweep(rows, eng, 'asr', range(0.9, 1.1, 0.005), (v) => baseP({ asrFactor: v }), conv);

  const P = baseP({ fajr: fajr.value, ishaAngle: isha.value, asrFactor: asr.value });
  const off = {};
  for (const k of ['sunrise', 'dhuhr', 'maghrib']) {
    const d = rows.map((r) => { const v = compute(eng, r.date, P); let e = toMin(r[k]) - ROUND[conv](v[k]); if (e > 720) e -= 1440; if (e < -720) e += 1440; return e; }).sort((a, b) => a - b);
    off[k] = { min: d[0], median: d[Math.floor(d.length / 2)], max: d[d.length - 1] };
  }

  const model = (r) => {
    const v = compute(eng, r.date, P);
    return {
      fajr: ROUND[conv](v.fajr),
      sunrise: ROUND[conv](v.sunrise) + off.sunrise.median,
      dhuhr: ROUND[conv](v.dhuhr) + off.dhuhr.median,
      asr: ROUND[conv](v.asr),
      maghrib: ROUND[conv](v.maghrib) + off.maghrib.median,
      isha: ROUND[conv](v.isha),
    };
  };
  const scores = {};
  for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    let ex = 0, w1 = 0, worst = 0, se = 0;
    for (const r of rows) {
      let e = toMin(r[k]) - model(r)[k];
      if (e > 720) e -= 1440; if (e < -720) e += 1440;
      if (e === 0) ex++; if (Math.abs(e) <= 1) w1++;
      if (Math.abs(e) > Math.abs(worst)) worst = e;
      se += Math.abs(e);
    }
    scores[k] = { exact: ex, within1: w1, worst, mae: +(se / rows.length).toFixed(2), n: rows.length };
  }
  const jan = rows.filter((r) => r.date.slice(5, 7) === '01').map((r) => toMin(r.fajr));
  const jul = rows.filter((r) => r.date.slice(5, 7) === '07').map((r) => toMin(r.fajr));
  out.push({
    file: path.basename(f), source: src.source, lat: src.latitude, lon: src.longitude, tz: src.timezone, tz_offset: tzOff,
    rows: rows.length, gate: src.live_page_gate,
    engine: 'PrayTimes-v2 family (o1f-london/praytimes.cjs)',
    rounding: conv, sunrise_mae: bestSr.mae,
    recipe: { fajr_angle: fajr.value, isha_angle: isha.value, asr_factor: asr.value, dhuhr_offset_min: off.dhuhr.median, maghrib_offset_min: off.maghrib.median, sunrise_offset_min: off.sunrise.median },
    offset_ranges: off,
    scores,
    amplitude_fajr_min: Math.max(...jan) - Math.min(...jul),
  });
}
fs.writeFileSync(process.env.OUT || 'fit-pt.json', JSON.stringify(out, null, 1));
for (const r of out) console.log(`${r.file} | fajr ${r.recipe.fajr_angle} isha ${r.recipe.isha_angle} asr ${r.recipe.asr_factor} dh+${r.recipe.dhuhr_offset_min} mg+${r.recipe.maghrib_offset_min} | ${r.rounding} | ` + Object.entries(r.scores).map(([k, v]) => `${k} ${v.exact}/${v.within1}/${v.worst}`).join(' '));
