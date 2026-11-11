// The angle measured against the printed solar noon, not against the printed sunrise.
//
// C47 read the fajr gap from the printed sunrise, so a sunrise printed a minute early lowers
// the implied angle by about 0.2 degrees and creates the 14.75 bucket. Here the reference is
// the midpoint of the printed sunrise and maghrib, which is the platform's own transit, so the
// sunrise column's quantisation cannot enter. If the 14.75 readings collapse onto 15.00, the
// bucket was the sunrise column and not a configuration.
import fs from 'node:fs';
import { median, rms } from '../../c47-practicemap/lib.js';
import { solarDay } from '../../c47-practicemap/solar.js';

const W = process.env.HOME + '/athan-gitree/census/o1k-wide/';
const RAD = Math.PI / 180, DEG = 180 / Math.PI;
const toMin = t => {
  const s = String(t).trim().toUpperCase();
  const pm = s.endsWith('PM'), am = s.endsWith('AM');
  const core = pm || am ? s.slice(0, -2) : s;
  const [h, m] = core.split(':').map(Number);
  if (!pm && !am) return h * 60 + m;
  return (h % 12 + (pm ? 12 : 0)) * 60 + m;
};

function rows(p) {
  const raw = JSON.parse(fs.readFileSync(W + p, 'utf8'));
  const table = new Map();
  if (Array.isArray(raw?.data?.salah)) {
    for (const r of raw.data.salah) {
      const d = new Date(r.date.slice(r.date.indexOf(', ') + 2) + ' 12:00:00Z');
      table.set(d.toISOString().slice(0, 10), [r.fajr, r.sunrise, r.zuhr, r.asr, r.maghrib, r.isha].map(toMin));
    }
  } else {
    const src = raw.athan && typeof raw.athan === 'object' && !Array.isArray(raw.athan) ? raw.athan : raw;
    for (const [date, v] of Object.entries(src)) {
      if (Array.isArray(v)) table.set(date, v.slice(0, 6).map(toMin));
      else if (v?.fajr) table.set(date, [v.fajr, v.sunrise, v.dhuhr, v.asr, v.magrib ?? v.maghrib, v.isha].map(toMin));
    }
  }
  const out = [];
  for (const [date, v] of [...table.entries()].sort()) {
    const [fajr, sr, , , mg, isha] = v;
    const [Y, M, D] = date.split('-').map(Number);
    out.push({ date, fajr, sr, mg, isha, ...solarDay(Y, M, D) });
  }
  return out;
}

const altitude = (lat, dec, minutesFromNoon) => {
  const H = minutesFromNoon / 4 * RAD;
  const phi = lat * RAD, d = dec * RAD;
  return DEG * Math.asin(Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(H));
};

const PATHS = {
  'Dar al-Hijrah (Falls Church VA)': 'americas/data/us_daralhijrah_falls_church_va_2026.json',
  'Islamic Center of Greater Toledo (2025)': 'americas2/data/us_icgt_toledo.json',
  'Muslim Center of San Antonio': 'americas2/data/us_mcsamasjid_san_antonio.json',
  'Islamic Association of North Texas (widget)': 'americas2/data/rows_us_iant_richardson_tx.json',
  'Memphis Islamic Center': 'americas2/data/rows_us_memphis_islamic_center.json',
  'Richmond Islamic Community Center TX': 'americas2/data/rows_us_richmond_iccc_tx.json',
  'MAS Tarbiyah Center (Livonia MI)': 'americas2/data/rows_us_mas_tarbiyah_livonia_mi.json',
  'Ethiopian Muslim Association (SeaTac WA)': 'americas2/data/rows_us_ema_seatac_wa.json',
  'Islamic Center of Tennessee': 'americas2/data/rows_us_islamic_center_of_tennessee.json',
  'Islamic Center of South Bay (Lomita)': 'americas2/data/rows_us_icsouthbay_lomita_ca.json',
  'Jamaica Muslim Center (NY)': 'americas2/data/rows_us_jamaica_muslim_center_queens_ny.json',
  'Ummah Masjid (Halifax, 2025)': 'americas2/data/ca_ummah_masjid_halifax.json',
  'Centre Culturel Islamique de Quebec': 'americas2/data/ca_cciq_quebec_2026.json',
  'Mosquee de la Capitale (Quebec)': 'americas2/data/ca_mosquee_capitale_quebec_2026.json',
  'Kitchener Masjid (MAC)': 'americas2/data/ca_kitchener_masjid.json',
  'Bilal Centre (Winnipeg)': 'americas2/data/ca_bilal_centre_winnipeg.json',
  'Manitoba Islamic Association (Winnipeg)': 'americas2/data/ca_mia_winnipeg.json',
  'Brandon Islamic Centre': 'americas/../americas/data/ca_brandon_islamic_centre_2026.json',
  'Saskatoon Mosque': 'americas/data/ca_saskatoon_2026.json',
  'Islamic Institute of Toronto': 'americas/data/ca_islamic_institute_toronto_2026.json',
  'Masjid Toronto (MAC)': 'americas/data/ca_masjid_toronto_2026.json',
};

const measured = JSON.parse(fs.readFileSync(W + 'usmap/measure.json', 'utf8'));
const lat = Object.fromEntries(measured.map(m => [m.mosque, m.lat]));
const out = [];
console.log('mosque | C47-style (gap to sunrise) | against printed noon | n');
for (const [name, p] of Object.entries(PATHS)) {
  if (!lat[name]) continue;
  const d = rows(p).filter(x => Number.isFinite(x.fajr) && Number.isFinite(x.sr) && Number.isFinite(x.mg));
  // Reject a defect row by its distance from the year's own median, never by an absolute bound.
  const offsets = d.map(x => x.fajr - (x.sr + x.mg) / 2);
  const centre = median(offsets);
  const alphas = [];
  for (let i = 0; i < d.length; i++) {
    if (Math.abs(offsets[i] - centre) > 90) continue;
    alphas.push(-altitude(lat[name], d[i].dec, offsets[i]));
  }
  if (alphas.length < 30) continue;
  const s = [...alphas].sort((a, b) => a - b);
  const q = p2 => s[Math.floor((s.length - 1) * p2)];
  const med = median(alphas);
  const spread = q(0.9) - q(0.1);
  const ref = measured.find(m => m.mosque === name).fajrAngle;
  out.push({ mosque: name, c47Style: ref, fromNoon: +med.toFixed(2), iqr: +spread.toFixed(2), n: alphas.length });
  console.log([name, ref, med.toFixed(2), spread.toFixed(2), alphas.length].join(' | '));
}
fs.writeFileSync(W + 'usmap/noon.json', JSON.stringify(out, null, 1));
