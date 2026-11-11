// O1l Indonesia city-level fits. One recipe per publisher across everything held:
// Kemenag 20/18 +2.0 floor (ihtyati), KHGT 18/18 +1 ceil. Per-city per-year scores,
// the Kemenag-KHGT fajr gap per city, and the 21/19 highland check on every Papuan capital.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { loadAdhan, columns, tzOffsetMinutes, parseHHMM, evalFixed, stats } from './lib.mjs';

const ROOT = process.cwd();
const A = await loadAdhan();
const table = JSON.parse(readFileSync(ROOT + '/data/cities.json', 'utf8'));

const RECIPES = {
  sihat: { label: 'Kemenag SIHAT 20/18 +2.0 ihtyati, floor',
    fajr: { angle: 20, margin: 2, mode: 'floor' }, isha: { angle: 18, margin: 2, mode: 'floor' },
    sunrise: { margin: 0, mode: 'floor' }, dhuhr: { margin: 0, mode: 'floor' },
    asr: { margin: 0, mode: 'floor' }, maghrib: { margin: 0, mode: 'floor' } },
  khgt: { label: 'KHGT 18/18 +1.0, ceil',
    fajr: { angle: 18, margin: 1, mode: 'ceil' }, isha: { angle: 18, margin: 1, mode: 'ceil' },
    sunrise: { margin: 0, mode: 'ceil' }, dhuhr: { margin: 0, mode: 'ceil' },
    asr: { margin: 0, mode: 'ceil' }, maghrib: { margin: 0, mode: 'ceil' } },
};
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function shafiParams(rec) {
  const p = new A.CalculationParameters('Other', rec.fajr.angle, rec.isha.angle);
  p.method = 'Other';
  p.madhab = 'shafi';
  return p;
}

function modelMinutes(city, ds, p, tzOverride) {
  const [y, m, d] = ds.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 0));
  const utcNoon = new Date(Date.UTC(y, m - 1, d, 12));
  const cols = columns(A, { lat: city.lat, lng: city.lng }, date, p);
  const off = tzOffsetMinutes(tzOverride || city.tz, utcNoon);
  const out = {};
  for (const [k, sec] of Object.entries(cols)) out[k] = ((sec / 60 + off) % 1440 + 1440) % 1440;
  return out;
}

function scoreYear(rows, city, rec, tzOverride) {
  const p = shafiParams(rec);
  const dsList = Object.keys(rows).sort();
  const perCol = {};
  for (const k of COLS) perCol[k] = { model: [], printed: [] };
  for (const ds of dsList) {
    const mm = modelMinutes(city, ds, p, tzOverride);
    const r = rows[ds];
    perCol.fajr.model.push(mm.fajr); perCol.fajr.printed.push(parseHHMM(r.fajr));
    perCol.sunrise.model.push(mm.sunrise); perCol.sunrise.printed.push(parseHHMM(r.sunrise));
    perCol.dhuhr.model.push(mm.dhuhr); perCol.dhuhr.printed.push(parseHHMM(r.dhuhr));
    perCol.asr.model.push(mm.asr); perCol.asr.printed.push(parseHHMM(r.asr));
    perCol.maghrib.model.push(mm.maghrib); perCol.maghrib.printed.push(parseHHMM(r.maghrib ?? r.magrib));
    perCol.isha.model.push(mm.isha); perCol.isha.printed.push(parseHHMM(r.isha));
  }
  const scores = {};
  let allWithin1 = 0;
  for (let i = 0; i < dsList.length; i++) {
    let ok = true;
    for (const k of COLS) {
      const spec = rec[k];
      const v = spec.mode === 'floor' ? Math.floor(perCol[k].model[i] + spec.margin)
        : spec.mode === 'ceil' ? Math.ceil(perCol[k].model[i] + spec.margin)
        : Math.round(perCol[k].model[i] + spec.margin);
      const diff = Math.abs(v - perCol[k].printed[i]);
      if (diff <= 1) perCol[k]._w1 = (perCol[k]._w1 || 0) + 1;
      if (diff === 0) perCol[k]._ex = (perCol[k]._ex || 0) + 1;
      if (diff > (perCol[k]._worst || 0)) perCol[k]._worst = diff;
      if (diff > 1) ok = false;
    }
    if (ok) allWithin1++;
  }
  for (const k of COLS) {
    const spec = rec[k];
    scores[k] = { margin: spec.margin, mode: spec.mode, exact: perCol[k]._ex || 0,
      within1: perCol[k]._w1 || 0, worst: perCol[k]._worst || 0, n: dsList.length };
  }
  return { n: dsList.length, scores, allSixWithin1: allWithin1 };
}

// implied sun depression of a printed time, sea-level geometry (fit10 method)
function implied(st, lat, hours) {
  const rad = Math.PI / 180;
  const H = hours * 15 * rad;
  const d = st.solar.declination * rad, L = lat * rad;
  const sinAlt = Math.sin(L) * Math.sin(d) + Math.cos(L) * Math.cos(d) * Math.cos(H);
  return -Math.asin(Math.max(-1, Math.min(1, sinAlt))) / rad;
}

const report = { job: 'O1l-3 Indonesia city-level: 38 provincial capitals, Kemenag SIHAT + Muhammadiyah KHGT',
  engine: 'adhan 4.4.6, second resolution, explicit rounding per column', cities: {} };

for (const c of table.capitals) {
  const slug = c.city.toLowerCase().replace('kota ', '').replace('kab. ', '').replace(' ', '-');
  const entry = { province: c.province, city: c.city, lat: c.lat, lng: c.lng, elevation: c.elevation, tz: c.tz };

  const sp = `${ROOT}/data/sihat-2026-${slug}.json`;
  if (existsSync(sp)) {
    const sj = JSON.parse(readFileSync(sp, 'utf8'));
    entry.sihat = { file: `data/sihat-2026-${slug}.json`, rows: Object.keys(sj.rows).length, recipe: RECIPES.sihat.label };
    if (Object.keys(sj.rows).length) {
      entry.sihat.fit2026 = scoreYear(sj.rows, c, RECIPES.sihat);
      const rf = Object.values(sj.rows).map(r => parseHHMM(r.fajr));
      const ri = Object.values(sj.rows).map(r => parseHHMM(r.isha));
      entry.sihat.amplitude = { fajrSpanMin: Math.max(...rf) - Math.min(...rf), ishaSpanMin: Math.max(...ri) - Math.min(...ri),
        fajrJan1: sj.rows['2026-01-01']?.fajr, fajrJul1: sj.rows['2026-07-01']?.fajr };
    }
  } else entry.sihat = { file: null, rows: 0 };

  const kh = {};
  for (const y of [2026, 2027]) {
    const kp = `${ROOT}/data/khgt-${y}-${slug}.json`;
    if (existsSync(kp)) kh[y] = JSON.parse(readFileSync(kp, 'utf8'));
  }
  if (Object.keys(kh).length) {
    entry.khgt = { years: {} };
    for (const [y, kj] of Object.entries(kh)) {
      const yk = { rows: Object.keys(kj.rows).length, recipe: RECIPES.khgt.label, tzMeta: kj.timezone ?? null };
      if (Object.keys(kj.rows).length) {
        const tzOverride = kj.timezone ? `Etc/GMT-${kj.timezone}` : null;
        yk.fit = scoreYear(kj.rows, c, RECIPES.khgt, tzOverride);
      }
      entry.khgt.years[y] = yk;
    }
  } else entry.khgt = null;

  const kjFile = `${ROOT}/data/khgt-2026-${slug}.json`;
  if (existsSync(sp) && existsSync(kjFile)) {
    const srows = JSON.parse(readFileSync(sp, 'utf8')).rows;
    const krows = JSON.parse(readFileSync(kjFile, 'utf8')).rows;
    const gaps = { fajr: [], isha: [], maghrib: [] };
    for (const ds of Object.keys(srows).sort()) {
      if (!krows[ds]) continue;
      gaps.fajr.push(parseHHMM(krows[ds].fajr) - parseHHMM(srows[ds].fajr));
      gaps.isha.push(parseHHMM(krows[ds].isha) - parseHHMM(srows[ds].isha));
      gaps.maghrib.push(parseHHMM(krows[ds].maghrib) - parseHHMM(srows[ds].magrib));
    }
    if (gaps.fajr.length) entry.gap = { n: gaps.fajr.length,
      fajr: stats(gaps.fajr), isha: stats(gaps.isha), maghrib: stats(gaps.maghrib) };
  }

  if (c.province.startsWith('PAPUA') && existsSync(sp)) {
    const srows = JSON.parse(readFileSync(sp, 'utf8')).rows;
    const checks = [];
    for (const ds of ['2026-01-15', '2026-04-15', '2026-07-15', '2026-10-15']) {
      if (!srows[ds]) continue;
      const [y, m, d] = ds.split('-').map(Number);
      const st = new A.SolarTime(new Date(Date.UTC(y, m - 1, d, 0)), new A.Coordinates(c.lat, c.lng));
      const off = tzOffsetMinutes(c.tz, new Date(Date.UTC(y, m - 1, d, 12)));
      const transpMin = st.transit * 60 + off;
      checks.push({ date: ds,
        fajrDepth: implied(st, c.lat, (parseHHMM(srows[ds].fajr) - transpMin) / 60),
        ishaDepth: implied(st, c.lat, (parseHHMM(srows[ds].isha) - transpMin) / 60) });
    }
    entry.highlandCheck = { elevation: c.elevation, checks,
      class: checks.length && stats(checks.map(x => x.fajrDepth)).med > 20.5 ? '21/19' : '20/18' };
  }

  report.cities[c.city] = entry;
  process.stdout.write(c.city + ' ');
}

writeFileSync(ROOT + '/data/fits.json', JSON.stringify(report, null, 1));
console.log('\nfits written');
