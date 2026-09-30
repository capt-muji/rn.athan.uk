import {invertRow} from './solar-harness.mjs';
// Balkans, all fetched 2026-09-30.
// Bosnia: vaktija.ba, the Islamic Community in BiH's own Sarajevo vaktija.
// Kosovo:  bislame.net/namazet, the Islamic Community of Kosovo (Bashkesia Islame e Kosoves).
const y=2026,m=9,d=30,tz=2;
const rows=[
 {n:'Sarajevo (vaktija.ba, IZ u BiH)', lat:43.8563,lng:18.4131,
  fajr:'05:05',sunrise:'06:35',dhuhr:'12:38',asr:'15:55',maghrib:'18:38',isha:'19:57'},
 {n:'Pristina (bislame.net, BIK)', lat:42.6629,lng:21.1655,
  fajr:'05:22',sunrise:'06:23',dhuhr:'12:29',asr:'15:48',maghrib:'18:27',isha:'19:58'},
];
for (const r of rows) console.log(r.n, JSON.stringify(invertRow({y,m,d,lat:r.lat,lng:r.lng,tz,...r})));
