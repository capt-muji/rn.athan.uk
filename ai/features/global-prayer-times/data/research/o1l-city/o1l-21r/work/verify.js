const adhan=require(process.env.HOME+'/athan-gitree/census/adhan-build/node_modules/adhan');
function mins(d){const s=d.toLocaleTimeString('en-GB',{timeZone:'Asia/Karachi',hour12:false});const [h,m]=s.split(':').map(Number);return h*60+m;}
function pm(s,c){const [h,m]=s.split(':').map(Number);let v=h*60+m;return (c==='asr'||c==='maghrib'||c==='isha')?((v<720)?v+720:v):v;}
function run(file,lat,lng,FA,IA,marg,label){
  const tab=require(file);const COLS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
  const ex={},w1={},n={};COLS.forEach(c=>{ex[c]=0;w1[c]=0;n[c]=0;});
  for(const iso of Object.keys(tab)){
    const [y,m,d]=iso.split('-').map(Number);
    const p=new adhan.CalculationParameters();p.method=adhan.CalculationMethod.Other;p.fajrAngle=FA;p.ishaAngle=IA;p.madhab=adhan.Madhab.Hanafi;p.rounding=adhan.Rounding.None;p.adjustments={fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:0,isha:0};
    const t=new adhan.PrayerTimes(new adhan.Coordinates(lat,lng),new Date(Date.UTC(y,m-1,d,6,0,0)),p);
    const ct={fajr:mins(t.fajr),sunrise:mins(t.sunrise),dhuhr:mins(t.dhuhr),asr:mins(t.asr),maghrib:mins(t.maghrib),isha:mins(t.isha)};
    for(const c of COLS){const v=pm(tab[iso][c],c);const r=v-(ct[c]+marg[c]);n[c]++;if(r===0)ex[c]++;if(Math.abs(r)<=1)w1[c]++;}
  }
  console.log(label,COLS.map(c=>`${c} ${w1[c]}/${n[c]}`).join(' | '));
}
run('../data/pk-peshawar-chart-2026.json',34.0151,71.5249,18,18,{fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:1,isha:1},'PESHAWAR');
run('../data/pk-quetta-chart-2026.json',30.1841,66.9966,18.2,18,{fajr:0,sunrise:0,dhuhr:1,asr:0,maghrib:2,isha:2},'QUETTA  ');
