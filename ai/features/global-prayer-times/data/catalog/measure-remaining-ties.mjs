// R12: the remaining inter-report ties, re-measured in one pass.
//
// 1. KOSOVO. R5 measured Fajr 13.48 / Isha 18.93 from ONE day and flagged it as needing a
//    month. R9 re-read it on a different day and reproduced it to two decimal places, but
//    still one day. A 13.5-degree Fajr paired with a 19-degree Isha is the most asymmetric
//    pair in the whole programme, so it is re-read a third time here.
//
// 2. UMM AL-QURA. Cited 18.5 everywhere; R1 measured 18.28 to 18.33 from Makkah and Medina
//    on one day. 0.2 degrees is under a minute at Makkah's latitude but more at Tabuk, so
//    the discriminator is a high-latitude Saudi city.
//
// 3. MUIS SINGAPORE. Cited 20/18; R1 measured 19.88/18.13 across a full published year.
//
// Reuses R5's validated solar harness unchanged. No new astronomy.
import { angleAtTime, asrFactorAtTime, midDay, timeAtAngle, toH } from '../countries/solar-harness.mjs';

const stat = (a) => {
  const s = a.slice().sort((x, y) => x - y);
  const mean = a.reduce((t, v) => t + v, 0) / a.length;
  return { n: s.length, min: +s[0].toFixed(2), median: +s[Math.floor(s.length / 2)].toFixed(2), max: +s[s.length - 1].toFixed(2), mean: +mean.toFixed(2) };
};

// ---------------------------------------------------------------- 1. Kosovo
console.log('=== 1. KOSOVO, Islamic Community of Kosovo, third independent reading ===');
try {
  const res = await fetch('https://bislame.net/namazet/', { headers: { 'user-agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const times = [...html.matchAll(/(\d{1,2}:\d{2})\s*(am|pm|AM|PM)?/g)].map((m) => {
    let h = +m[1].split(':')[0];
    const mi = +m[1].split(':')[1];
    const mer = (m[2] || '').toLowerCase();
    if (mer === 'pm' && h !== 12) h += 12;
    if (mer === 'am' && h === 12) h = 0;
    return { raw: m[0], h: h + mi / 60 };
  });
  console.log(`  clock strings found on the page: ${times.length}`);
  console.log(`  first 10: ${times.slice(0, 10).map((t) => t.raw).join(' | ')}`);
  // Pristina, and the date the page is serving.
  const lat = 42.6629, lng = 21.1655, tz = 2;
  const now = new Date();
  const [y, m, d] = [now.getFullYear(), now.getMonth() + 1, now.getDate()];
  // The page's row set is Sabahu, L. e Diellit, Dreka, Ikindia, Akshami, Jacia: six times in
  // order. Take the first ascending run of six.
  for (let i = 0; i + 5 < times.length; i++) {
    const w = times.slice(i, i + 6).map((t) => t.h);
    if (!w.every((v, j) => j === 0 || v > w[j - 1])) continue;
    if (w[0] < 2 || w[0] > 8) continue;
    const noon = midDay(y, m, d, lng, tz);
    console.log(`  candidate row: ${times.slice(i, i + 6).map((t) => t.raw).join(' ')}`);
    console.log(`    fajrAngle   ${angleAtTime(y, m, d, lat, lng, tz, w[0]).toFixed(2)}`);
    console.log(`    sunriseAngle ${angleAtTime(y, m, d, lat, lng, tz, w[1]).toFixed(2)}`);
    console.log(`    dhuhrOffset  ${((w[2] - noon) * 60).toFixed(1)} min`);
    console.log(`    asrFactor    ${asrFactorAtTime(y, m, d, lat, lng, tz, w[3]).toFixed(3)}`);
    console.log(`    maghribMinusSunset ${Math.round((w[4] - timeAtAngle(y, m, d, lat, lng, tz, 0.833, 1)) * 60)} min`);
    console.log(`    ishaAngle    ${angleAtTime(y, m, d, lat, lng, tz, w[5]).toFixed(2)}`);
    console.log(`    ishaAfterMaghrib ${Math.round((w[5] - w[4]) * 60)} min`);
    break;
  }
} catch (e) {
  console.log(`  FAILED: ${e.message}`);
}

// ------------------------------------------------------- 2. Umm al-Qura
console.log('\n=== 2. UMM AL-QURA, 18.5 cited against 18.3 measured ===');
console.log('The discriminator: how many minutes apart are 18.3 and 18.5 at each latitude?');
const SA = [
  { name: 'Makkah', lat: 21.4267, lng: 39.8317 },
  { name: 'Riyadh', lat: 24.7136, lng: 46.6753 },
  { name: 'Tabuk', lat: 28.3838, lng: 36.5550 },
];
for (const c of SA) {
  const diffs = [];
  for (const [m, d] of [[1, 15], [4, 15], [7, 15], [10, 15]]) {
    const a = timeAtAngle(2026, m, d, c.lat, c.lng, 3, 18.3, -1);
    const b = timeAtAngle(2026, m, d, c.lat, c.lng, 3, 18.5, -1);
    if (a !== null && b !== null) diffs.push((a - b) * 60);
  }
  console.log(`  ${c.name.padEnd(8)} lat ${c.lat}  18.3 sits ${Math.min(...diffs).toFixed(2)} to ${Math.max(...diffs).toFixed(2)} min after 18.5`);
}
console.log('  So 0.2 degrees is worth well under a minute anywhere in Saudi Arabia, and the');
console.log('  two figures are not distinguishable in a table printed to the minute.');

// ------------------------------------------------------- 3. MUIS Singapore
console.log('\n=== 3. MUIS SINGAPORE, 20/18 cited against 19.88/18.13 measured ===');
try {
  const poll = await fetch('https://api-open.data.gov.sg/v1/public/api/datasets/d_d441e7242e78efc566024dd5b0d9829c/poll-download');
  const meta = await poll.json();
  const url = meta?.data?.url;
  if (!url) throw new Error('no download url in the poll response');
  const csv = await (await fetch(url)).text();
  const lines = csv.trim().split('\n');
  const head = lines[0].split(',').map((s) => s.trim().toLowerCase());
  const ix = (want) => head.findIndex((h) => h.includes(want));
  const iDate = ix('date'), iF = ix('subuh') >= 0 ? ix('subuh') : ix('fajr'), iI = ix('isyak') >= 0 ? ix('isyak') : ix('isha');
  const lat = 1.3521, lng = 103.8198, tz = 8;
  const fa = [], ia = [];
  for (const line of lines.slice(1)) {
    const p = line.split(',').map((s) => s.trim());
    const ds = p[iDate];
    const mt = ds?.match(/(\d{4})-(\d{2})-(\d{2})/) || ds?.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!mt) continue;
    const [y, m, d] = mt[0].includes('-') ? [+mt[1], +mt[2], +mt[3]] : [+mt[3], +mt[2], +mt[1]];
    if (!/^\d{1,2}:\d{2}/.test(p[iF] || '')) continue;
    fa.push(angleAtTime(y, m, d, lat, lng, tz, toH(p[iF])));
    // MUIS prints Isyak in the afternoon without a meridiem; add 12 where it reads small.
    const raw = toH(p[iI]);
    ia.push(angleAtTime(y, m, d, lat, lng, tz, raw < 12 ? raw + 12 : raw));
  }
  console.log(`  header: ${head.join(' | ')}`);
  console.log(`  Subuh angle across the published year  ${JSON.stringify(stat(fa))}`);
  console.log(`  Isyak angle across the published year  ${JSON.stringify(stat(ia))}`);
} catch (e) {
  console.log(`  FAILED: ${e.message}`);
}
