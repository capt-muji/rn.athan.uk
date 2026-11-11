const adhan = require('/tmp/opensrc/repos/github.com/batoulapps/adhan-js/4.4.6/lib/cjs/Adhan.js');
const fs = require('fs');
const rows = JSON.parse(fs.readFileSync('data/bh-bahrain-calendar-1448.json'));
const DIL = new adhan.Coordinates(26.27, 50.68);   // fajr + sunrise site
const SAL = new adhan.Coordinates(26.22, 50.44);   // dhuhr/asr/maghrib/isha site
const TZ = 'Asia/Bahrain';
const fmt = new Intl.DateTimeFormat('en-GB',{timeZone:TZ,hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
const wallMin = d => { const p=fmt.formatToParts(d).reduce((a,x)=>(a[x.type]=x.value,a),{}); return (+p.hour%24)*60+(+p.minute)+(+p.second)/60; };
const pm = s => { const [h,m]=s.split(':').map(Number); return h*60+m; };
const dates = Object.keys(rows).sort();
function pt(coords,y,m,d,aF,aI,asrMadhab){
  const params = new adhan.CalculationParameters('Other',aF,aI);
  params.madhab = asrMadhab || adhan.Madhab.Shafi;
  return new adhan.PrayerTimes(coords,new Date(Date.UTC(y,m-1,d,12)),params);
}
// --- fajr angle sweep at Dilmunia
function score(angle, margin){
  let exact=0, within1=0, sum=0;
  for(const ds of dates){
    const [y,m,d]=ds.split('-').map(Number);
    const c=wallMin(pt(DIL,y,m,d,angle,18).fajr)+margin;
    const p=pm(rows[ds].fajr); const dev=Math.abs(c-p);
    if(dev<0.5) exact++; if(dev<=1.0) within1++; sum+=dev;
  }
  return {angle,margin,exact,within1,mae:+(sum/dates.length).toFixed(3),n:dates.length};
}
const sweep=[];
for(let a=14;a<=20.0001;a+=0.05){
  for(const mg of [0,1]) sweep.push(score(+a.toFixed(2),mg));
}
sweep.sort((x,y)=> y.within1-x.within1 || y.exact-x.exact || x.mae-y.mae);
console.log('FAJR top 10:'); sweep.slice(0,10).forEach(s=>console.log(JSON.stringify(s)));
// --- other prayers at Salman, margins 0..2
function otherStats(key,which,margin,madhab){
  let exact=0,within1=0,sum=0;
  for(const ds of dates){
    const [y,m,d]=ds.split('-').map(Number);
    const pt2=pt(SAL,y,m,d,18,18,madhab);
    const c=wallMin(pt2[which])+margin;
    const p=pm(rows[ds][key]); const dev=Math.abs(c-p);
    if(dev<0.5) exact++; if(dev<=1.0) within1++; sum+=dev;
  }
  return {key,which,margin,madhab:madhab===adhan.Madhab.Hanafi?'hanafi':'shafi',exact,within1,mae:+(sum/dates.length).toFixed(3)};
}
const best=[];
for(const [key,which] of [['sunrise','sunrise'],['dhuhr','dhuhr'],['asr','asr'],['magrib','maghrib'],['isha','isha']]){
  for(let mg=-1;mg<=2;mg++){
    const madhabs = which==='asr' ? [adhan.Madhab.Shafi, adhan.Madhab.Hanafi] : [adhan.Madhab.Shafi];
    for(const md of madhabs) best.push(otherStats(key,which,mg,md));
  }
}
for(const k of ['sunrise','dhuhr','asr','magrib','isha']){
  const arr=best.filter(b=>b.key===k).sort((x,y)=> y.within1-x.within1 || y.exact-x.exact || x.mae-y.mae);
  console.log(k, JSON.stringify(arr.slice(0,3)));
}
