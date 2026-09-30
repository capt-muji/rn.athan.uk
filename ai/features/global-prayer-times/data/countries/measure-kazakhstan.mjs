import {timeAtAngle, asrTime, midDay, hm, toH, angleAtTime, asrFactorAtTime} from './solar-harness.mjs';
// Kazakhstan: the Spiritual Administration of Muslims of Kazakhstan publishes its method
// in the page source of muftyat.kz itself (read 2026-09-30, agent-browser). Its own script:
//   prayTimes.setMethod('ISNA')            -> Fajr 15, Isha 15
//   prayTimes.adjust({asr:'Hanafi'})       -> shadow factor 2
//   prayTimes.adjust({highLats:'AngleBased'})
//   lat < 48 : sunrise -3 min, Dhuhr/Asr/Maghrib +3 min
//   lat >= 48: sunrise -5 min, Dhuhr/Asr/Maghrib +5 min   (Fajr and Isha get no offset)
const y=2026,m=9,d=30;
const cities=[{n:'Astana',lat:51.133333,lng:71.433333,tz:5},{n:'Almaty',lat:43.238293,lng:76.945465,tz:5}];
for (const c of cities){
  const o = c.lat>=48 ? 5 : 3;
  const noon=midDay(y,m,d,c.lng,c.tz);
  const t={fajr:timeAtAngle(y,m,d,c.lat,c.lng,c.tz,15,-1),
    sunrise:timeAtAngle(y,m,d,c.lat,c.lng,c.tz,0.833,-1)-o/60,
    dhuhr:noon+o/60, asr:asrTime(y,m,d,c.lat,c.lng,c.tz,2)+o/60,
    maghrib:timeAtAngle(y,m,d,c.lat,c.lng,c.tz,0.833,1)+o/60,
    isha:timeAtAngle(y,m,d,c.lat,c.lng,c.tz,15,1)};
  console.log(c.n, 'offset +/-'+o, Object.fromEntries(Object.entries(t).map(([k,v])=>[k,hm(v)])));
}
// Published on muftyat.kz for Astana on load, 2026-09-30 (agent-browser):
console.log('Astana published: fajr 05:41 sunrise 07:08 dhuhr 13:09 asr 17:05 maghrib 19:00 isha 20:26');
const c=cities[0];
console.log('inverted from published:', {
  fajrAngle:+angleAtTime(y,m,d,c.lat,c.lng,c.tz,toH('05:41')).toFixed(2),
  ishaAngle:+angleAtTime(y,m,d,c.lat,c.lng,c.tz,toH('20:26')).toFixed(2),
  asrFactor:+asrFactorAtTime(y,m,d,c.lat,c.lng,c.tz,toH('17:05')).toFixed(3),
  dhuhrOffsetMin:+((toH('13:09')-midDay(y,m,d,c.lng,c.tz))*60).toFixed(1)});
