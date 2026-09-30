// R12: break the Egypt tie. Three reports measured the Egyptian General Authority of
// Survey's own table and got three answers:
//   R1: Fajr 19.59 / Isha 17.43, from ONE Cairo row.
//   R5: Fajr 19.40 to 19.62 / Isha 17.40 to 17.55, across FIVE cities, one day.
//   R7: Fajr 19.51 / Isha 17.49, across TWENTY-TWO cities, one day.
//
// These are not measurements of different things: they are the same authority read at
// three sample widths. This script re-reads the authority's own page today and inverts
// every city row it serves for which a coordinate is known, to establish which figure the
// widest sample supports and how much of the spread is the authority's own one-minute
// rounding rather than a varying angle.
//
// Reuses R5's validated solar harness unchanged. No new astronomy.
import { angleAtTime, asrFactorAtTime, midDay, timeAtAngle } from '../countries/solar-harness.mjs';

// Egyptian city coordinates. The authority's page names cities in Arabic and publishes no
// coordinates, so these anchors come from R5's and R7's sets, extended by hand for the
// governorate capitals and named towns the page serves. An anchor error moves a measured
// angle, which is why the SPREAD across cities is reported beside the median.
const COORDS = {
  'القاهرة': ['Cairo', 30.0444, 31.2357],
  'الأسكندرية': ['Alexandria', 31.2001, 29.9187],
  'طنطا': ['Tanta', 30.7865, 31.0004],
  'المنصورة': ['Mansoura', 31.0409, 31.3785],
  'الزقازيق': ['Zagazig', 30.5877, 31.5020],
  'أسيوط': ['Asyut', 27.1783, 31.1859],
  'سوهاج': ['Sohag', 26.5591, 31.6957],
  'بنى سويف': ['Beni Suef', 29.0661, 31.0994],
  'المنيا': ['Minya', 28.1099, 30.7503],
  'قنا': ['Qena', 26.1551, 32.7160],
  'أسوان': ['Aswan', 24.0889, 32.8998],
  'مطروح': ['Marsa Matruh', 31.3543, 27.2373],
  'الغردقة': ['Hurghada', 27.2579, 33.8116],
  'الخارجة': ['Kharga', 25.4514, 30.5467],
  'الإسماعيلية': ['Ismailia', 30.5965, 32.2715],
  'دمياط': ['Damietta', 31.4165, 31.8133],
  'السلوم': ['Sallum', 31.5606, 25.1531],
  'نويبع': ['Nuweiba', 29.0333, 34.6667],
  'شرم الشيخ': ['Sharm el-Sheikh', 27.9158, 34.3300],
  'الفيوم': ['Fayoum', 29.3084, 30.8428],
  'كفر الشيخ': ['Kafr el-Sheikh', 31.1117, 30.9398],
  'طابا': ['Taba', 29.4900, 34.8900],
  'الطور': ['El Tor', 28.2417, 33.6222],
  'دهب': ['Dahab', 28.5000, 34.5167],
  'القصير': ['Quseer', 26.1044, 34.2780],
  'سفاجة': ['Safaga', 26.7333, 33.9333],
  'مرسى علم': ['Marsa Alam', 25.0757, 34.8900],
  'الضبعة': ['Dabaa', 31.0281, 28.4453],
  'العلمين': ['Alamein', 30.8333, 28.9500],
  'واحة سيوة': ['Siwa', 29.2041, 25.5195],
  'الفرافرة': ['Farafra', 27.0583, 27.9708],
  'المحلة الكبرى': ['Mahalla', 30.9764, 31.1670],
  'بورسعيد': ['Port Said', 31.2653, 32.3019],
  'السويس': ['Suez', 29.9668, 32.5498],
  'العريش': ['Arish', 31.1316, 33.8031],
  'دمنهور': ['Damanhour', 31.0341, 30.4682],
  'الأقصر': ['Luxor', 25.6872, 32.6396],
  'ادفو': ['Edfu', 24.9781, 32.8753],
  'اسنا': ['Esna', 25.2934, 32.5541],
  'نجع حمادى': ['Nag Hammadi', 26.0500, 32.2500],
  'رشيد الجديدة': ['Rosetta', 31.3990, 30.4165],
  'كاترين': ['Saint Catherine', 28.5559, 33.9455],
  'السادات': ['Sadat City', 30.3667, 30.5167],
  'بدر': ['Badr', 30.1500, 31.7167],
  'العبور': ['Obour', 30.2167, 31.4667],
  'سيدى برانى': ['Sidi Barrani', 31.6111, 25.9264],
  'راس غارب': ['Ras Gharib', 28.3592, 33.0794],
  'شلاتين': ['Shalateen', 23.1333, 35.5833],
  'برنيس': ['Berenice', 23.9083, 35.4750],
};

const TZ = 3; // Egypt observes UTC+3 under its summer arrangement; the table is local time.

const res = await fetch('https://www.esa.gov.eg/praytimes.aspx', { headers: { 'user-agent': 'Mozilla/5.0' } });
if (!res.ok) throw new Error(`esa.gov.eg: HTTP ${res.status}`);
const html = await res.text();

// Each city row is a nine-cell <tr>: Arabic name, Gregorian date, Hijri date, then the six
// times as `H:MM ص` (AM) or `H:MM م` (PM). The meridiem marker is what makes the afternoon
// values unambiguous, so it is read rather than inferred.
const AM = '\u0635', PM = '\u0645';
const rows = [];
for (const m of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
  const cells = [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)]
    .map((c) => c[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim());
  if (cells.length !== 9) continue;
  if (!/^\d{1,2}:\d{1,2}/.test(cells[3])) continue;
  const times = cells.slice(3, 9).map((s) => {
    const [, h, mi, mer] = s.match(/^(\d{1,2}):(\d{1,2})\s*(\S+)?$/) || [];
    if (h === undefined) return null;
    let hh = +h;
    if (mer === PM && hh !== 12) hh += 12;
    if (mer === AM && hh === 12) hh = 0;
    return hh + +mi / 60;
  });
  if (times.some((t) => t === null)) continue;
  rows.push({ name: cells[0], date: cells[1], times });
}

const date = rows[0]?.date ?? '';
const [y, mo, d] = date.split('-').map(Number);
console.log(`=== R12: Egyptian General Authority of Survey, its own table for ${date} ===`);
console.log(`city rows the authority served: ${rows.length}`);

const out = [], col = { fajr: [], isha: [], asr: [], dhuhr: [], maghrib: [], sunrise: [], gap: [] };
for (const r of rows) {
  const key = Object.keys(COORDS).find((k) => k.replace(/\s+/g, '') === r.name.replace(/\s+/g, ''));
  if (!key) continue;
  const [en, lat, lng] = COORDS[key];
  const [f, sr, dh, as, mg, is] = r.times;
  const noon = midDay(y, mo, d, lng, TZ);
  const rec = {
    city: en,
    fajrAngle: +angleAtTime(y, mo, d, lat, lng, TZ, f).toFixed(2),
    sunriseAngle: +angleAtTime(y, mo, d, lat, lng, TZ, sr).toFixed(2),
    dhuhrOffsetMin: +((dh - noon) * 60).toFixed(1),
    asrFactor: +asrFactorAtTime(y, mo, d, lat, lng, TZ, as).toFixed(3),
    maghribMinusSunsetMin: Math.round((mg - timeAtAngle(y, mo, d, lat, lng, TZ, 0.833, 1)) * 60),
    ishaAngle: +angleAtTime(y, mo, d, lat, lng, TZ, is).toFixed(2),
    ishaAfterMaghribMin: Math.round((is - mg) * 60),
  };
  // Coordinate sanity gate. Egypt puts Dhuhr at true noon with no offset, measured to
  // within half a minute on the cities whose coordinates are certain, so a Dhuhr residual
  // past 1 minute means THIS SCRIPT'S anchor is wrong for that city, not that the
  // authority used a different angle there. Such a row is excluded and named, because
  // keeping it would widen the measured angle spread with the anchor's own error.
  rec.anchorTrusted = Math.abs(rec.dhuhrOffsetMin) <= 1.0;
  out.push(rec);
  if (!rec.anchorTrusted) continue;
  col.fajr.push(rec.fajrAngle); col.isha.push(rec.ishaAngle); col.asr.push(rec.asrFactor);
  col.dhuhr.push(rec.dhuhrOffsetMin); col.maghrib.push(rec.maghribMinusSunsetMin);
  col.sunrise.push(rec.sunriseAngle); col.gap.push(rec.ishaAfterMaghribMin);
}

console.log(`cities matched to a coordinate: ${out.length}, of which ${col.fajr.length} pass the anchor gate\n`);
for (const r of out.sort((a, b) => a.city.localeCompare(b.city))) {
  console.log(`  ${r.anchorTrusted ? ' ' : 'x'} ${r.city.padEnd(18)} Fajr ${String(r.fajrAngle).padEnd(6)} Isha ${String(r.ishaAngle).padEnd(6)} Asr ${String(r.asrFactor).padEnd(6)} Dhuhr ${String(r.dhuhrOffsetMin).padEnd(5)} Maghrib ${String(r.maghribMinusSunsetMin).padEnd(3)} Isha-Maghrib ${r.ishaAfterMaghribMin}m`);
}
const dropped = out.filter((r) => !r.anchorTrusted);
if (dropped.length) console.log(`\nexcluded by the anchor gate (Dhuhr past 1 min from true noon): ${dropped.map((r) => r.city).join(', ')}`);

const stat = (a, label) => {
  const s = a.slice().sort((x, z) => x - z);
  const mean = a.reduce((t, v) => t + v, 0) / a.length;
  console.log(`${label.padEnd(28)} n=${s.length} min=${s[0]} median=${s[Math.floor(s.length / 2)]} max=${s[s.length - 1]} mean=${mean.toFixed(2)} spread=${(s[s.length - 1] - s[0]).toFixed(2)}`);
};
console.log('');
stat(col.fajr, 'Fajr angle');
stat(col.isha, 'Isha angle');
stat(col.asr, 'Asr shadow factor');
stat(col.dhuhr, 'Dhuhr offset, min');
stat(col.maghrib, 'Maghrib minus sunset, min');
stat(col.sunrise, 'sunrise angle');
stat(col.gap, 'Isha after Maghrib, min');
console.log('\nThe Isha-after-Maghrib spread discriminates an angle from an interval: a fixed');
console.log('interval is constant across cities, an angle is not.');
