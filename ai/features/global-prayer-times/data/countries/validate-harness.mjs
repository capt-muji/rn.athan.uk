import {timeAtAngle, asrTime, midDay, invertRow, hm} from './solar-harness.mjs';
// Harness validation. Reproduces the Egyptian General Authority of Survey's own published
// Cairo row for 2026-09-30 (esa.gov.eg/praytimes.aspx, fetched 2026-09-30) from the
// 19.5 / 17.5 parameters with a standard Asr, and inverts it back.
const y=2026,m=9,d=30,lat=30.0444,lng=31.2357,tz=3;
const published={fajr:'05:21',sunrise:'06:48',dhuhr:'12:45',asr:'16:09',maghrib:'18:42',isha:'19:59'};
const computed={fajr:hm(timeAtAngle(y,m,d,lat,lng,tz,19.5,-1)),
  sunrise:hm(timeAtAngle(y,m,d,lat,lng,tz,0.833,-1)), dhuhr:hm(midDay(y,m,d,lng,tz)),
  asr:hm(asrTime(y,m,d,lat,lng,tz,1)), maghrib:hm(timeAtAngle(y,m,d,lat,lng,tz,0.833,1)),
  isha:hm(timeAtAngle(y,m,d,lat,lng,tz,17.5,1))};
let fail=0;
for (const k of Object.keys(published)){
  const ok = published[k]===computed[k];
  if(!ok) fail++;
  console.log(`${k.padEnd(8)} published ${published[k]}  computed ${computed[k]}  ${ok?'match':'MISMATCH'}`);
}
console.log('\ninverted from the published row:', invertRow({y,m,d,lat,lng,tz,...published}));
console.log(fail===0 ? '\nVALIDATED: all six times match to the minute.' : `\nFAILED: ${fail} mismatches.`);
process.exit(fail===0?0:1);
