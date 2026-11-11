const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const tab = require(process.env.HOME + '/athan-gitree/census/o1k-wide/europe/data/fi-helsinki-rukousaika-2026.json');
const TZ='Europe/Helsinki';
function mins(d){if(!d)return null;const s=d.toLocaleTimeString('en-GB',{timeZone:TZ,hour12:false});const [h,m]=s.split(':').map(Number);return h*60+m;}
const p=new adhan.CalculationParameters();p.method=adhan.CalculationMethod.Other;p.fajrAngle=18;p.ishaAngle=17;p.madhab=adhan.Madhab.Shafi;p.rounding=adhan.Rounding.None;
for(const iso of ['2026-01-01','2026-03-20','2026-06-21','2026-09-23','2026-12-21']){
  const [y,m,d]=iso.split('-').map(Number);
  const t=new adhan.PrayerTimes(new adhan.Coordinates(60.1699,24.9384),new Date(Date.UTC(y,m-1,d,10,0,0)),p);
  console.log(iso,'calc',mins(t.fajr),mins(t.sunrise),mins(t.dhuhr),mins(t.asr),mins(t.maghrib),mins(t.isha),'| table',JSON.stringify(tab[iso]));
}
