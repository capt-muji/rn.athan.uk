import {invertRow} from './solar-harness.mjs';
// Kuwait: al-Anba newspaper's "مواقيت الصلاة لدولة الكويت" page, 2026-09-30, tier C not A
// (a national newspaper reprinting the state table, not the Awqaf ministry's own site).
// Bahrain: R1 could not source it; not measured here.
const y=2026,m=9,d=30,tz=3;
console.log('Kuwait City (al-Anba, tier C)',
 JSON.stringify(invertRow({y,m,d,lat:29.3759,lng:47.9774,tz,
  fajr:'04:21',sunrise:'05:40',dhuhr:'11:38',asr:'15:03',maghrib:'17:36',isha:'18:53'})));
