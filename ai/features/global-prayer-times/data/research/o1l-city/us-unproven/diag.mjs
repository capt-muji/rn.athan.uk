import fs from 'fs';
import adhan from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js';
const d=JSON.parse(fs.readFileSync('data/Flint-E5Avv2AX-athanplus.json','utf8'));
const lat=43.0119211,lng=-83.7838324,tz='America/Detroit';
const f=new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour:'2-digit',minute:'2-digit',hour12:false});
const lm=dt=>{const p=Object.fromEntries(f.formatToParts(dt).map(x=>[x.type,x.value]));return (+p.hour%24)*60+(+p.minute);};
const hm=s=>{const[a,b]=s.split(':').map(Number);return a*60+b;};
for (const [fa,ia,hl] of [[15,15,'TwilightAngle'],[15,15,'MiddleOfTheNight'],[15,15,'SeventhOfTheNight']]) {
  const p=new adhan.CalculationParameters('Other',fa,ia,0);
  p.madhab=adhan.Madhab.Shafi; p.highLatitudeRule=adhan.HighLatitudeRule[hl]; p.rounding=adhan.Rounding.None;
  const c=new adhan.Coordinates(lat,lng);
  const by={};
  for(const [date,v] of Object.entries(d.days)){
    const [y,m,dd]=date.split('-').map(Number);
    const t=new adhan.PrayerTimes(c,new Date(Date.UTC(y,m-1,dd,18,0)),p);
    const k=date.slice(0,7);
    by[k]=by[k]||{f:[],i:[],s:[],a:[]};
    by[k].f.push(hm(v.fajr_athan)-lm(t.fajr));
    by[k].i.push(hm(v.isha_athan)-lm(t.isha));
    by[k].s.push(hm(v.sunrise)-lm(t.sunrise));
    by[k].a.push(hm(v.asr_athan)-lm(t.asr));
  }
  console.log('==',fa,ia,hl);
  for(const k of Object.keys(by).sort().filter(x=>x.startsWith('2026'))){
    const med=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)];};
    console.log(k,'fajr',med(by[k].f),'isha',med(by[k].i),'sunrise',med(by[k].s),'asr',med(by[k].a));
  }
}
