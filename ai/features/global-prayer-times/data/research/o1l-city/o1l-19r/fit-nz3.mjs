import { PrayerTimes, Coordinates, CalculationMethod, Rounding } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js'
import fs from 'node:fs'
const d=JSON.parse(fs.readFileSync('data/nz-2006-ramadan-15cities.json','utf8'))
const zone='Pacific/Auckland'
const CITY={akl:['Auckland',-36.8485,174.7633],chc:['Christchurch',-43.5321,172.6362],dud:['Dunedin',-45.8788,170.5028],
gre:['Greymouth',-42.4500,171.2100],haw:['Hastings',-39.6381,176.8492],hlz:['Hamilton',-37.7870,175.2793],
ivc:['Invercargill',-46.4132,168.3538],npe:['Napier',-39.4928,176.9120],npl:['New Plymouth',-39.0556,174.0752],
nsn:['Nelson',-41.2706,173.2840],pmr:['Palmerston North',-40.3523,175.6082],rot:['Rotorua',-38.1368,176.2497],
trg:['Tauranga',-37.6878,176.1651],wlg:['Wellington',-41.2866,174.7756],zqn:['Queenstown',-45.0312,168.6626]}
const offMin=(iso)=>{const [y,m,dd]=iso.split('-').map(Number);const dt=new Date(Date.UTC(y,m-1,dd,4,0,0));
const dtf=new Intl.DateTimeFormat('en-US',{timeZone:zone,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
const p=Object.fromEntries(dtf.formatToParts(dt).map(x=>[x.type,x.value]));return Math.round((Date.UTC(+p.year,+p.month-1,+p.day,+p.hour%24,+p.minute)-dt.getTime())/60000)}
const hm=s=>{const[h,m]=s.split(':').map(Number);return h*60+m}
const COLS=['fajr','sunrise','dhuhr','asr','maghrib','isha']
const mk=(fa,ia)=>{const p=CalculationMethod.Other();p.fajrAngle=fa;p.ishaAngle=ia;p.rounding=Rounding.None;return p}
const pred=(fa,ia,lat,lon,iso)=>{const [y,m,dd]=iso.split('-').map(Number)
const pt=new PrayerTimes(new Coordinates(lat,lon),new Date(Date.UTC(y,m-1,dd,12,0,0)-offMin(iso)*60000),mk(fa,ia))
const f=t=>(t.getTime()-Date.UTC(y,m-1,dd,0,0,0))/60000;return {fajr:f(pt.fajr),sunrise:f(pt.sunrise),dhuhr:f(pt.dhuhr),asr:f(pt.asr),maghrib:f(pt.maghrib),isha:f(pt.isha)}}
const out=[]
for(const city of Object.keys(d).sort()){
  const [name,lat,lon]=CITY[city]
  const rows=d[city]; const dates=Object.keys(rows).sort()
  const obs=(iso,c)=>hm(rows[iso][c])-offMin(iso)
  let ba={e:1e9}
  const scan=(f0,f1,fi,i0,i1,ii)=>{let b={e:1e9}
    for(let fa=f0;fa<=f1+1e-9;fa+=fi)for(let ia=i0;ia<=i1+1e-9;ia+=ii){
      let e=0
      for(const iso of dates){const p=pred(fa,ia,lat,lon,iso);e+=Math.abs(p.fajr-obs(iso,'fajr'))+Math.abs(p.isha-obs(iso,'isha'))}
      if(e<b.e)b={e,fa:+fa.toFixed(2),ia:+ia.toFixed(2)}
    } return b}
  ba=scan(13,20,0.25,12,21,0.25)
  ba=scan(ba.fa-0.3,ba.fa+0.3,0.02,ba.ia-0.3,ba.ia+0.3,0.02)
  const r={};for(const c of COLS)r[c]=[]
  for(const iso of dates){const p=pred(ba.fa,ba.ia,lat,lon,iso);for(const c of COLS)r[c].push(p[c]-obs(iso,c))}
  const st={};for(const c of COLS){const a=r[c];st[c]=[+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2),+Math.min(...a).toFixed(1),+Math.max(...a).toFixed(1)]}
  const within1=COLS.reduce((a,c)=>a+r[c].filter(x=>Math.abs(x)<=1.01).length,0)/(dates.length*6)
  out.push({code:city,city:name,lat,lon,pair:[ba.fa,ba.ia],resid:st,within1:+within1.toFixed(3),days:dates.length})
}
for(const r of out) console.log(r.code,r.city.padEnd(16),'pair',r.pair.join('/'),'within1',(100*r.within1).toFixed(1)+'%',JSON.stringify(r.resid))
fs.writeFileSync('data/nz-2006-fit-fixedcoords.json',JSON.stringify(out,null,1))
