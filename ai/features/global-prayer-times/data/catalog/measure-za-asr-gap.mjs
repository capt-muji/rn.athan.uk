// R12: price the South African conflict. R9 measured the Muslim Judicial Council's own
// published Cape Town month at Fajr 17.96 / Isha 16.99 with a STANDARD Asr (factor 0.989)
// and Maghrib at plain sunset. The Jamiatul Ulama KZN fatwa tells users to configure
// Karachi 18/18 with a HANAFI Asr and Maghrib +3.
//
// Both are tier A in their own terms, they are the two largest ulama voices in one country,
// and they disagree. This script computes what a user loses by following the wrong one, on
// each of the six times, at both Cape Town and Durban, across a year.
//
// Reuses R5's validated solar harness unchanged. No new astronomy.
import { asrTime, timeAtAngle, midDay, hm } from '../countries/solar-harness.mjs';

const CITIES = [
  { name: 'Cape Town (MJC home)', lat: -33.9249, lng: 18.4241 },
  { name: 'Durban (KZN Jamiat home)', lat: -29.8587, lng: 31.0218 },
];
const TZ = 2; // Africa/Johannesburg, no DST.
const DATES = [[1, 15], [3, 15], [6, 15], [9, 15], [12, 15]];

const MJC = { fajr: 17.96, isha: 16.99, asrFactor: 1, maghribOffset: 0 };
const KZN = { fajr: 18, isha: 18, asrFactor: 2, maghribOffset: 3 };

console.log('=== R12: the South African split, priced in minutes ===');
console.log('MJC published table (measured by R9): Fajr 17.96, Isha 16.99, std Asr, Maghrib +0');
console.log('KZN Jamiat fatwa (cited): Karachi 18/18, Hanafi Asr, Maghrib +3\n');

const gaps = { fajr: [], asr: [], maghrib: [], isha: [] };
for (const c of CITIES) {
  console.log(`--- ${c.name} ---`);
  console.log('  date    Fajr MJC/KZN        Asr MJC/KZN         Maghrib MJC/KZN     Isha MJC/KZN        deltas F/A/M/I');
  for (const [m, d] of DATES) {
    const y = 2026;
    const f1 = timeAtAngle(y, m, d, c.lat, c.lng, TZ, MJC.fajr, -1);
    const f2 = timeAtAngle(y, m, d, c.lat, c.lng, TZ, KZN.fajr, -1);
    const a1 = asrTime(y, m, d, c.lat, c.lng, TZ, MJC.asrFactor);
    const a2 = asrTime(y, m, d, c.lat, c.lng, TZ, KZN.asrFactor);
    const sunset = timeAtAngle(y, m, d, c.lat, c.lng, TZ, 0.833, 1);
    const g1 = sunset + MJC.maghribOffset / 60;
    const g2 = sunset + KZN.maghribOffset / 60;
    const i1 = timeAtAngle(y, m, d, c.lat, c.lng, TZ, MJC.isha, 1);
    const i2 = timeAtAngle(y, m, d, c.lat, c.lng, TZ, KZN.isha, 1);
    const dF = Math.round((f2 - f1) * 60), dA = Math.round((a2 - a1) * 60);
    const dM = Math.round((g2 - g1) * 60), dI = Math.round((i2 - i1) * 60);
    gaps.fajr.push(dF); gaps.asr.push(dA); gaps.maghrib.push(dM); gaps.isha.push(dI);
    console.log(`  ${String(m).padStart(2, '0')}-${d}   ${hm(f1)} / ${hm(f2)}      ${hm(a1)} / ${hm(a2)}       ${hm(g1)} / ${hm(g2)}       ${hm(i1)} / ${hm(i2)}       ${String(dF).padStart(3)} ${String(dA).padStart(4)} ${String(dM).padStart(3)} ${String(dI).padStart(4)}`);
  }
  console.log('');
}

const range = (a) => `${Math.min(...a)} to ${Math.max(...a)} min`;
console.log('=== what following the wrong South African body costs ===');
console.log(`Fajr:    ${range(gaps.fajr)}`);
console.log(`Asr:     ${range(gaps.asr)}     <- the decisive one`);
console.log(`Maghrib: ${range(gaps.maghrib)}`);
console.log(`Isha:    ${range(gaps.isha)}`);
