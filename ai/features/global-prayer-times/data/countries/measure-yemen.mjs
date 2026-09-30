import {invertRow} from './solar-harness.mjs';
// General Authority of Awqaf & Guidance, Yemen, awqaf.gov.ye own embedded prayer JSON, 2026-09-30.
// Times are 12-hour with no am/pm in the payload; converted by prayer-of-day convention.
const rows=[
 {n:'Sanaa',    lat:15.3694,lng:44.1910,fajr:'04:42',sunrise:'05:53',dhuhr:'12:03',asr:'15:14',maghrib:'18:03',isha:'18:56'},
 {n:'Aden',     lat:12.7855,lng:45.0187,fajr:'04:38',sunrise:'05:49',dhuhr:'11:59',asr:'15:09',maghrib:'17:56',isha:'18:52'},
 {n:'Taiz',     lat:13.5795,lng:44.0178,fajr:'04:42',sunrise:'05:53',dhuhr:'12:03',asr:'15:13',maghrib:'18:01',isha:'18:56'},
 {n:'Hodeidah', lat:14.7978,lng:42.9545,fajr:'04:46',sunrise:'05:57',dhuhr:'12:07',asr:'15:18',maghrib:'18:07',isha:'19:00'},
];
const tz=3, y=2026, m=9, d=30;
for (const r of rows) console.log(r.n.padEnd(10), JSON.stringify(invertRow({y,m,d,lat:r.lat,lng:r.lng,tz,...r})));
