const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const c = new adhan.Coordinates(34.0151,71.5249);
const p = new adhan.CalculationParameters(); p.method=adhan.CalculationMethod.Other; p.fajrAngle=18; p.ishaAngle=18; p.madhab=adhan.Madhab.Hanafi;
const f=d=>d.toLocaleTimeString('en-GB',{timeZone:'Asia/Karachi',hour12:false});
for(let m=1;m<=12;m++){
  const d=new Date(Date.UTC(2026,m-1,1,6,0,0));
  const pt=new adhan.PrayerTimes(c,d,p);
  console.log('2026-%02d-01'.replace('%02d',String(m).padStart(2,'0')), f(pt.fajr), f(pt.sunrise), f(pt.dhuhr), f(pt.asr), f(pt.maghrib), f(pt.isha));
}
