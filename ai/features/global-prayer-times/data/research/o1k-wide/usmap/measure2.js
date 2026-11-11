// Measure the configured parameters of tonight's North American captures with C47's own
// method: latitude from the daylight curve plus the asr interval, longitude from the printed
// solar noon, fajr and isha as the sun depression each printed column implies, measured from
// the horizon crossing so a margin on sunrise cannot leak into the angle.
//
// The angle is measured from gaps, so it is independent of the timezone field and of the
// platform's clock. A constant depression is a configured angle; a constant gap is a fixed
// interval; anything else is a hand-entered or seasonal table.
//
// Corrections are the four defects the captures carry, each applied from its own fault model
// and each printed in corrections.json so the report can state what was moved.
import fs from 'node:fs';
import { median, rms } from '../../c47-practicemap/lib.js';
import { solarDay, hourAngle, asrAltitude } from '../../c47-practicemap/solar.js';

const W = process.env.HOME + '/athan-gitree/census/o1k-wide/';
const RAD = Math.PI / 180, DEG = 180 / Math.PI;
const SIN_HORIZON = Math.sin(-0.833 * RAD);
const CANON = [12, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5, 18, 18.2, 18.5, 19, 19.5, 20];
const rad = d => d * RAD, deg = r => r * DEG;
const KEY = { fajr: 'fajr', sunrise: 'sr', dhuhr: 'zuhr', asr: 'asr', maghrib: 'mg', isha: 'isha' };
const ALL = Object.keys(KEY);

function clockToMin(t) {
  const s = String(t).trim().toUpperCase();
  const pm = s.endsWith('PM'), am = s.endsWith('AM');
  const core = pm || am ? s.slice(0, -2) : s;
  const [h, m] = core.split(':').map(Number);
  if (!pm && !am) return h * 60 + m;
  let hh = h % 12;
  if (pm) hh += 12;
  return hh * 60 + m;
}

const order = v => [v.fajr, v.sunrise, v.dhuhr, v.asr, v.magrib ?? v.maghrib, v.isha].map(clockToMin);

// Two shapes: date -> {fajr, sunrise, ...} and the raw Masjidal payload with its salah list.
function days(path) {
  const raw = JSON.parse(fs.readFileSync(W + path, 'utf8'));
  const table = new Map();
  const salah = raw?.data?.salah;
  if (Array.isArray(salah)) {
    for (const r of salah) {
      const d = new Date(r.date.slice(r.date.indexOf(', ') + 2) + ' 12:00:00Z');
      table.set(d.toISOString().slice(0, 10), [r.fajr, r.sunrise, r.zuhr, r.asr, r.maghrib, r.isha].map(clockToMin));
    }
  } else {
    const src = raw.athan && typeof raw.athan === 'object' && !Array.isArray(raw.athan) ? raw.athan : raw;
    for (const [date, v] of Object.entries(src)) {
      if (Array.isArray(v) && v.length >= 6) table.set(date, v.slice(0, 6).map(clockToMin));
      else if (v && v.fajr) table.set(date, order(v));
    }
  }
  const out = [];
  for (const [date, v] of [...table.entries()].sort()) {
    const [fajr, sr, zuhr, asr, mg, isha0] = v;
    if (![fajr, sr, zuhr, asr, mg, isha0].every(Number.isFinite)) continue;
    const isha = isha0 < mg ? isha0 + 1440 : isha0;
    const [Y, M, D] = date.split('-').map(Number);
    const { dec, eotMin } = solarDay(Y, M, D);
    out.push({ date, month: M, dec, eotMin, fajr, sr, zuhr, asr, mg, isha });
  }
  return out;
}

const inWin = (date, from, to) => date >= from && date <= to;

function correct(d, cfg) {
  const applied = [];
  for (const s of cfg.shift || []) {
    const cols = s.cols || ALL;
    let n = 0;
    for (const x of d) {
      if (!inWin(x.date, s.from, s.to)) continue;
      for (const c of cols) x[KEY[c]] += s.by;
      if (x.isha < x.mg) x.isha += 1440;
      n++;
    }
    applied.push({ shift: s.by, from: s.from, to: s.to, cols: cols.join(','), rows: n });
  }
  for (const w of cfg.dropWindows || []) {
    const before = d.length;
    d = d.filter(x => !inWin(x.date, w.from, w.to));
    applied.push({ dropWindow: `${w.from}..${w.to}`, rows: before - d.length });
  }
  if (cfg.drop?.length) {
    const before = d.length;
    d = d.filter(x => !cfg.drop.includes(x.date));
    applied.push({ dropDates: cfg.drop, rows: before - d.length });
  }
  return { d, applied };
}

const daylightScore = (d, lat) => {
  const sl = Math.sin(rad(lat)), cl = Math.cos(rad(lat)), res = [];
  for (const x of d) {
    const cosH = (SIN_HORIZON - sl * Math.sin(rad(x.dec))) / (cl * Math.cos(rad(x.dec)));
    if (cosH < -1 || cosH > 1) continue;
    res.push((x.mg - x.sr) - 8 * deg(Math.acos(cosH)));
  }
  if (res.length < Math.max(90, d.length * 0.6)) return Infinity;
  const m = median(res);
  return rms(res.map(v => v - m));
};

const asrScore = (d, lat, factor) => {
  const res = [];
  for (const x of d) {
    const h = hourAngle(asrAltitude(factor, lat, x.dec), lat, x.dec);
    if (h === null) continue;
    res.push((x.asr - (x.sr + x.mg) / 2) - 4 * h);
  }
  if (res.length < Math.max(90, d.length * 0.6)) return { score: Infinity, margin: null };
  const m = median(res);
  return { score: rms(res.map(v => v - m)), margin: m };
};

function fitLatitude(d, lat0) {
  let best = null;
  const sweep = (from, to, step) => {
    for (let lat = from; lat <= to + 1e-9; lat += step) {
      const daylight = daylightScore(d, lat);
      if (!Number.isFinite(daylight)) continue;
      const a1 = asrScore(d, lat, 1), a2 = asrScore(d, lat, 2);
      const a = a2.score < a1.score ? a2 : a1;
      const total = daylight + a.score;
      if (!best || total < best.total) best = { lat, total, daylight, score: a.score, margin: a.margin, factor: a === a2 ? 2 : 1 };
    }
  };
  sweep(lat0 - 4, lat0 + 4, 0.05);
  if (!best) { sweep(18, 60, 0.1); }
  sweep(best.lat - 0.06, best.lat + 0.06, 0.005);
  return best;
}

const impliedAngle = (lat, dec, gapMin) => {
  const sl = Math.sin(rad(lat)), cl = Math.cos(rad(lat));
  const sd = Math.sin(rad(dec)), cd = Math.cos(rad(dec));
  const cosHsr = (SIN_HORIZON - sl * sd) / (cl * cd);
  if (cosHsr < -1 || cosHsr > 1) return null;
  const h = deg(Math.acos(cosHsr)) + gapMin / 4;
  if (h > 180) return null;
  const alpha = -deg(Math.asin(sl * sd + cl * cd * Math.cos(rad(h))));
  return { alpha, sensitivity: 4 * Math.cos(rad(alpha)) / (cl * cd * Math.sin(rad(h))) };
};

const gapAtAngle = (lat, dec, alpha) => {
  const sl = Math.sin(rad(lat)), cl = Math.cos(rad(lat));
  const sd = Math.sin(rad(dec)), cd = Math.cos(rad(dec));
  const cosHsr = (SIN_HORIZON - sl * sd) / (cl * cd);
  const cosH = (Math.sin(rad(-alpha)) - sl * sd) / (cl * cd);
  if (cosH < -1 || cosH > 1 || cosHsr < -1 || cosHsr > 1) return null;
  return 4 * (deg(Math.acos(cosH)) - deg(Math.acos(cosHsr)));
};

const q = (s, p) => { const i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };

function measure(lat, d, gapFn, dropFn) {
  const series = [];
  for (const x of d) {
    if (dropFn && dropFn(x)) continue;
    const gap = gapFn(x);
    if (gap < 0) continue;
    const imp = impliedAngle(lat, x.dec, gap);
    if (!imp || !(imp.sensitivity >= 1)) continue;
    series.push({ month: x.month, dec: x.dec, alpha: imp.alpha, gap });
  }
  if (series.length < 30) return { kind: 'unmeasurable', n: series.length, measured: series.length };
  const dark = [11, 12, 1, 2];
  const all = series.map(x => x.alpha).sort((a, b) => a - b);
  const gaps = series.map(x => x.gap).sort((a, b) => a - b);
  const darkA = series.filter(x => dark.includes(x.month)).map(x => x.alpha).sort((a, b) => a - b);
  const angle = median(all), winter = median(darkA);
  const darkIqr = q(darkA, 0.75) - q(darkA, 0.25);
  const iqrGap = q(gaps, 0.75) - q(gaps, 0.25);
  const near = CANON.reduce((a, b) => (Math.abs(b - angle) < Math.abs(a - angle) ? b : a));

  let kind = 'table';
  if (darkIqr <= 0.3) kind = 'angle';
  else if (iqrGap <= 1.0) kind = 'interval';

  const resid = { all: [], dark: [] };
  for (const x of series) {
    const p = gapAtAngle(lat, x.dec, angle);
    if (p === null) continue;
    resid.all.push(x.gap - p);
    if (dark.includes(x.month)) resid.dark.push(x.gap - p);
  }
  const am = median(resid.dark.length ? resid.dark : resid.all);
  return {
    kind, measured: series.length, angle: +angle.toFixed(2), winter: +winter.toFixed(2),
    darkIqr: +darkIqr.toFixed(2), iqrGap: +iqrGap.toFixed(2), gapMedian: +median(gaps).toFixed(1),
    gapMin: gaps[0], gapMax: gaps[gaps.length - 1], near,
    angleMargin: +am.toFixed(1),
    darkRms: resid.dark.length ? +rms(resid.dark.map(v => v - am)).toFixed(2) : null,
    allRms: +rms(resid.all.map(v => v - median(resid.all))).toFixed(2),
  };
}

const cache = new Map();
function tzOff(tz, date) {
  const k = tz + date;
  if (cache.has(k)) return cache.get(k);
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(new Date(date + 'T12:00:00Z'));
  const n = parts.find(p => p.type === 'timeZoneName').value;
  const m = n.match(/GMT([+-])(\d{2}):(\d{2})/);
  const v = m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) + Number(m[3]) / 60) : 0;
  cache.set(k, v);
  return v;
}

const M = (country, name, path, tz, lat0, cfg = {}) => ({ country, name, path, tz, lat0, cfg });
const MJ = (id, y) => `americas2/captures/masjidal_${id}_${y}.json`;

const MOSQUES = [
  M('US', 'Dar al-Hijrah (Falls Church VA)', 'americas/data/us_daralhijrah_falls_church_va_2026.json', 'America/New_York', 38.9),
  M('US', 'Islamic Center of Greater Toledo (2025)', 'americas2/data/us_icgt_toledo.json', 'America/New_York', 41.7,
    { dropWindows: [{ from: '2025-03-09', to: '2025-11-01' }] }),
  M('US', 'Muslim Center of San Antonio', 'americas2/data/us_mcsamasjid_san_antonio.json', 'America/Chicago', 29.4,
    { drop: ['2026-03-09', '2026-11-01', '2026-11-02'] }),
  M('US', 'Islamic Association of North Texas (widget)', 'americas2/data/rows_us_iant_richardson_tx.json', 'America/Chicago', 32.9),
  M('US', 'Memphis Islamic Center', 'americas2/data/rows_us_memphis_islamic_center.json', 'America/Chicago', 35.1),
  M('US', 'Richmond Islamic Community Center TX', 'americas2/data/rows_us_richmond_iccc_tx.json', 'America/Chicago', 29.6),
  M('US', 'MAS Tarbiyah Center (Livonia MI)', 'americas2/data/rows_us_mas_tarbiyah_livonia_mi.json', 'America/Detroit', 42.4),
  M('US', 'Ethiopian Muslim Association (SeaTac WA)', 'americas2/data/rows_us_ema_seatac_wa.json', 'America/Los_Angeles', 47.4),
  M('US', 'Islamic Center of Tennessee', 'americas2/data/rows_us_islamic_center_of_tennessee.json', 'America/Chicago', 36.0),
  M('US', 'Islamic Center of South Bay (Lomita)', 'americas2/data/rows_us_icsouthbay_lomita_ca.json', 'America/Los_Angeles', 33.8),
  M('US', 'Jamaica Muslim Center (NY)', 'americas2/data/rows_us_jamaica_muslim_center_queens_ny.json', 'America/New_York', 40.7),
  M('CA', 'Islamic Institute of Toronto', 'americas/data/ca_islamic_institute_toronto_2026.json', 'America/Toronto', 43.8),
  M('CA', 'Masjid Toronto (MAC)', 'americas/data/ca_masjid_toronto_2026.json', 'America/Toronto', 43.7),
  M('CA', 'Kitchener Masjid (MAC)', 'americas2/data/ca_kitchener_masjid.json', 'America/Toronto', 43.4),
  M('CA', 'Ummah Masjid (Halifax, 2025)', 'americas2/data/ca_ummah_masjid_halifax.json', 'America/Halifax', 44.7),
  M('CA', 'Bilal Centre (Winnipeg)', 'americas2/data/ca_bilal_centre_winnipeg.json', 'America/Winnipeg', 49.9,
    { shift: [{ from: '2026-11-01', to: '2026-11-30', by: -60 }] }),
  M('CA', 'Manitoba Islamic Association (Winnipeg)', 'americas2/data/ca_mia_winnipeg.json', 'America/Winnipeg', 49.9,
    { shift: [{ from: '2026-11-01', to: '2026-11-30', by: -60 }] }),
  M('CA', 'Centre Culturel Islamique de Quebec', 'americas2/data/ca_cciq_quebec_2026.json', 'America/Toronto', 46.8),
  M('CA', 'Mosquee de la Capitale (Quebec)', 'americas2/data/ca_mosquee_capitale_quebec_2026.json', 'America/Toronto', 46.8),
  M('CA', 'Saskatoon Mosque', 'americas/data/ca_saskatoon_2026.json', 'America/Regina', 52.2),
  M('CA', 'Brandon Islamic Centre', 'americas/data/ca_brandon_islamic_centre_2026.json', 'America/Winnipeg', 49.9,
    { shift: [{ from: '2026-11-01', to: '2026-11-30', by: -60 }] }),
  M('CA', 'Markaz Ul Islam (Edmonton)', MJ('VrdRkwKG', 2026), 'America/Edmonton', 53.5,
    { shift: [{ from: '2026-11-01', to: '2026-12-31', by: -60 }] }),
  M('CA', 'Masjid Al-Fatima (Edmonton)', MJ('M0dYkvL6', 2026), 'America/Edmonton', 53.5,
    { shift: [{ from: '2026-11-01', to: '2026-12-31', by: -60 }] }),
  M('CA', 'Masjid At-Taqwa (Edmonton)', MJ('pVdwyVLe', 2026), 'America/Edmonton', 53.5,
    { shift: [{ from: '2026-11-01', to: '2026-11-30', by: -60 }] }),
];

// Three-year stability for the six clean US Masjidal profiles.
const SIX = [
  ['Memphis Islamic Center', '1QL0gbKZ', 35.1],
  ['Richmond Islamic Community Center TX', 'keLQn7AM', 29.6],
  ['Islamic Center of South Bay (Lomita)', 'XEdoEvL7', 33.8],
  ['MAS Tarbiyah Center (Livonia MI)', 'nL1JggAa', 42.4],
  ['Jamaica Muslim Center (NY)', 'z0AW66Lj', 40.7],
  ['Ethiopian Muslim Association (SeaTac WA)', '6adJ5qAk', 47.4],
];
for (const [name, id, lat0] of SIX) {
  for (const y of [2024, 2025]) {
    MOSQUES.push(M('US', `${name} (${y})`, MJ(id, y), id === '6adJ5qAk' ? 'America/Los_Angeles' : id === 'XEdoEvL7' ? 'America/Los_Angeles' : id === 'keLQn7AM' ? 'America/Chicago' : id === 'z0AW66Lj' ? 'America/New_York' : 'America/Chicago', lat0));
  }
}

const out = [], corrections = [];
for (const m of MOSQUES) {
  const rawDays = days(m.path);
  if (rawDays.length < 30) { console.error('skip (rows)', m.name, rawDays.length); continue; }
  const { d, applied } = correct(rawDays, m.cfg);
  const fit = fitLatitude(d, m.lat0);
  if (!fit) { console.error('no latitude', m.name); continue; }
  const lat = fit.lat;
  const lons = d.map(x => (720 + tzOff(m.tz, x.date) * 60 - x.eotMin - (x.sr + x.mg) / 2) / 4);
  const lon = median(lons);
  const fajr = measure(lat, d, x => x.sr - x.fajr);
  // Kitchener's isha is capped for 89 days; the angle is measured on the days it governs.
  const isha = measure(lat, d, x => x.isha - x.mg, m.name.startsWith('Kitchener') ? x => x.isha === 22 * 60 + 10 : null);
  const rec = {
    country: m.country, mosque: m.name, days: d.length, lat: +lat.toFixed(2), lon: +lon.toFixed(2),
    lonSpread: +rms(lons.map(v => v - lon)).toFixed(2), daylightRms: +fit.daylight.toFixed(2),
    asr: fit.factor === 2 ? 'Hanafi' : 'Shafi', asrRms: +fit.score.toFixed(2),
    zuhrOff: +median(d.map(x => x.zuhr - (x.sr + x.mg) / 2)).toFixed(1),
    fajrKind: fajr.kind, fajrAngle: fajr.angle ?? null, fajrNear: fajr.near ?? null,
    fajrMargin: fajr.angleMargin ?? null, fajrDarkRms: fajr.darkRms ?? null,
    fajrAllRms: fajr.allRms ?? null, fajrN: fajr.measured,
    ishaKind: isha.kind, ishaAngle: isha.angle ?? null, ishaNear: isha.near ?? null,
    ishaInterval: isha.kind === 'interval' ? isha.gapMedian : null,
    ishaGapIqr: isha.iqrGap ?? null, ishaMargin: isha.angleMargin ?? null,
    ishaDarkRms: isha.darkRms ?? null, ishaAllRms: isha.allRms ?? null, ishaN: isha.measured,
  };
  out.push(rec);
  if (applied.length) corrections.push({ mosque: m.name, applied });
  console.log([rec.country, rec.mosque, rec.days, rec.lat, rec.lon,
    rec.fajrKind, rec.fajrAngle, rec.fajrDarkRms,
    rec.ishaKind, rec.ishaAngle ?? (rec.ishaInterval !== null ? '+' + rec.ishaInterval + 'min' : '-'),
    rec.ishaDarkRms, rec.asr, rec.daylightRms, rec.zuhrOff].join(' | '));
}

fs.writeFileSync(W + 'usmap/measure.json', JSON.stringify(out, null, 1));
fs.writeFileSync(W + 'usmap/corrections.json', JSON.stringify(corrections, null, 1));
console.log('\nmosque-years', out.length, 'corrections', corrections.length);
