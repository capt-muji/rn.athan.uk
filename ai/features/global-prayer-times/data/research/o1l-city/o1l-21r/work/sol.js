const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
function times(lat,lng,date,params){
  const c = new adhan.Coordinates(lat,lng);
  const p = new adhan.CalculationParameters();
  p.method = adhan.CalculationMethod.Other;
  p.fajrAngle = params.fajr; p.ishaAngle = params.isha;
  p.madhab = params.hanafi ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  p.adjustments = {fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:0,isha:0};
  const pt = new adhan.PrayerTimes(c, date, p);
  const f = d => d ? d.toLocaleTimeString('en-GB',{timeZone:'Asia/Karachi',hour12:false}) : null;
  return {fajr:f(pt.fajr),sunrise:f(pt.sunrise),dhuhr:f(pt.dhuhr),asr:f(pt.asr),maghrib:f(pt.maghrib),isha:f(pt.isha)};
}
const lat=+process.argv[2], lng=+process.argv[3], iso=process.argv[4];
console.log('18/18 hanafi', times(lat,lng,new Date(iso+'T06:00:00Z'),{fajr:18,isha:18,hanafi:true}));
console.log('18.5/18.5 hanafi', times(lat,lng,new Date(iso+'T06:00:00Z'),{fajr:18.5,isha:18.5,hanafi:true}));
console.log('18/18 shafi', times(lat,lng,new Date(iso+'T06:00:00Z'),{fajr:18,isha:18,hanafi:false}));
