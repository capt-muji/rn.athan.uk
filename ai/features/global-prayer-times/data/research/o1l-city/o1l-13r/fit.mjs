import {Adhan,hm,toMin} from './lib.mjs';

export function rows2026(d){
  const lens=[31,28,31,30,31,30,31,31,30,31,30,31];
  const rows=[]; let i=0;
  for(let mo=0;mo<12;mo++)for(let day=1;day<=lens[mo];day++){
    if(i===59) i++;
    rows.push({date:`2026-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`,t:d.calendar[mo][String(day)]});
    i++;
  }
  return rows;
}
function series(coords,days,setup){
  const p=new Adhan.CalculationParameters('Other');
  p.fajrAngle=18;p.ishaAngle=17;p.ishaInterval=0;p.madhab=Adhan.Madhab.Shafi;
  setup(p);
  return days.map(dt=>{
    const pt=new Adhan.PrayerTimes(coords,dt,p);
    return {fajr:toMin(hm(pt.fajr)),sunrise:toMin(hm(pt.sunrise)),dhuhr:toMin(hm(pt.dhuhr)),
      asr:toMin(hm(pt.asr)),maghrib:toMin(hm(pt.maghrib)),isha:toMin(hm(pt.isha))};
  });
}
function bestColumn(pred,obs,margins){
  let best=null;
  for(const m of margins){
    let ex=0,w1=0,ae=0;
    for(let i=0;i<pred.length;i++){
      const d=Math.abs(pred[i]+m-obs[i]);
      ae+=d; if(d<0.5)ex++; if(d<=1.0)w1++;
    }
    const s=w1/pred.length;
    if(!best||s>best.s||(s===best.s&&ae<best.ae)) best={m,s,ex,w1,ae,n:pred.length};
  }
  return best;
}
export function fit({lat,lon,rows,asrMadhab='shafi'}){
  const coords=new Adhan.Coordinates(lat,lon);
  const days=rows.map(r=>{const [y,mo,da]=r.date.split('-').map(Number);return new Date(Date.UTC(y,mo-1,da,6,0,0));});
  const obs={fajr:rows.map(r=>toMin(r.t[0])),sunrise:rows.map(r=>toMin(r.t[1])),dhuhr:rows.map(r=>toMin(r.t[2])),
    asr:rows.map(r=>toMin(r.t[3])),maghrib:rows.map(r=>toMin(r.t[4])),isha:rows.map(r=>toMin(r.t[5]))};
  const mad=asrMadhab==='hanafi'?Adhan.Madhab.Hanafi:Adhan.Madhab.Shafi;
  const margins=[];for(let m=-30;m<=30;m+=0.5)margins.push(m);
  // fajr angle scan
  let bf=null;
  for(let fa=14;fa<=20.001;fa+=0.05){
    const pr=series(coords,days,p=>{p.fajrAngle=fa}).map(x=>x.fajr);
    const b=bestColumn(pr,obs.fajr,margins);
    if(!bf||b.s>bf.s||(b.s===bf.s&&b.ae<bf.ae)) bf={fa,...b};
  }
  // isha: angle scan and interval scan
  let bi=null;
  for(let ia=14;ia<=20.001;ia+=0.05){
    const pr=series(coords,days,p=>{p.ishaAngle=ia}).map(x=>x.isha);
    const b=bestColumn(pr,obs.isha,margins);
    if(!bi||b.s>bi.s||(b.s===bi.s&&b.ae<bi.ae)) bi={ia,...b};
  }
  // isha as interval after maghrib
  const mgr=series(coords,days,p=>{}).map(x=>x.maghrib);
  for(let iv=30;iv<=150;iv+=1){
    const pr=mgr.map(v=>v+iv);
    const b=bestColumn(pr,obs.isha,margins);
    if(b.s>bi.s||(b.s===bi.s&&b.ae<bi.ae)) bi={interval:iv,...b};
  }
  const base=series(coords,days,p=>{p.madhab=mad});
  const out={fajr:bf,isha:bi};
  for(const c of ['sunrise','dhuhr','asr','maghrib']){
    const pr=base.map(x=>x[c]);
    out[c]=bestColumn(pr,obs[c],margins);
    // variability of residual after best margin
    const res=pr.map((v,i)=>obs[c][i]-v-out[c].m);
    const mean=res.reduce((a,b)=>a+b,0)/res.length;
    out[c].sd=Math.sqrt(res.reduce((a,b)=>a+(b-mean)**2,0)/res.length);
  }
  return out;
}
