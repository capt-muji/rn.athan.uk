// The printed sunrise offset, exactly: sunriseOff = 4H - (maghrib - sunrise)/2,
// because the platform's own transit is the midpoint of the two printed columns.
// C47 reads its 14.75 bucket as 15.0 through a sunrise printed one minute early.
// Test that on tonight's sample: is the fajr angle correlated with this offset?
import fs from 'node:fs';
import { median } from '../../c47-practicemap/lib.js';
import { solarDay, hourAngle } from '../../c47-practicemap/solar.js';

const W = process.env.HOME + '/athan-gitree/census/o1k-wide/';
const toMin = t => { const [h, m] = String(t).split(':').map(Number); return h * 60 + m; };
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
    const [fajr, sr, , , mg] = v;
    const [Y, M, D] = date.split('-').map(Number);
    out.push({ fajr, sr, mg, ...solarDay(Y, M, D) });
  }
  return out;
}
const measured = JSON.parse(fs.readFileSync(W + 'usmap/measure.json', 'utf8'));
const lat = Object.fromEntries(measured.map(m => [m.mosque, m.lat]));
const PATHS = {
  'Dar al-Hijrah (Falls Church VA)': 'americas/data/us_daralhijrah_falls_church_va_2026.json',
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
  'Brandon Islamic Centre': 'americas/data/ca_brandon_islamic_centre_2026.json',
  'Saskatoon Mosque': 'americas/data/ca_saskatoon_2026.json',
  'Islamic Institute of Toronto': 'americas/data/ca_islamic_institute_toronto_2026.json',
  'Masjid Toronto (MAC)': 'americas/data/ca_masjid_toronto_2026.json',
};
const out = [];
for (const [name, p] of Object.entries(PATHS)) {
  if (!lat[name]) continue;
  const offs = [];
  for (const x of rows(p)) {
    const h = hourAngle(-0.833, lat[name], x.dec);
    if (h === null) continue;
    offs.push(4 * h - (x.mg - x.sr) / 2);
  }
  const o = median(offs);
  const a = measured.find(m => m.mosque === name).fajrAngle;
  out.push({ mosque: name, fajrAngle: a, sunriseOff: +o.toFixed(2) });
  console.log([name, a, o.toFixed(2)].join(' | '));
}
// Least-squares slope of angle on the sunrise offset.
const xs = out.map(r => r.sunriseOff), ys = out.map(r => r.fajrAngle);
const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
const slope = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / xs.reduce((s, x) => s + (x - mx) ** 2, 0);
console.log('\nn', out.length, 'slope (deg per minute of sunrise offset)', slope.toFixed(3), '| predicted 0.20 by C47');
fs.writeFileSync(W + 'usmap/sunrise.json', JSON.stringify(out, null, 1));
