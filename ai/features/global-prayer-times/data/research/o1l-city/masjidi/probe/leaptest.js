const L=require('./fitlib');
const D2R=Math.PI/180,R2D=180/Math.PI;
function sun(jd){const D=jd-2451545.0;const g=(357.529+0.98560028*D)*D2R;const q=280.459+0.98564736*D;
const Ls=(q+1.915*Math.sin(g)+0.020*Math.sin(2*g))*D2R;const e=(23.439-0.00000036*D)*D2R;
const dec=Math.asin(Math.sin(e)*Math.sin(Ls))*R2D;let ra=Math.atan2(Math.cos(e)*Math.sin(Ls),Math.cos(Ls))*R2D;
ra=((ra%360)+360)%360;let eqt=q-ra;eqt=(((eqt+180)%360)+360)%360-180;return{dec,eqt:eqt*4};}
const jd0=d=>d.getTime()/86400000+2440587.5;
function run(file,leap,off){
 const t=L.parseTable(file);
 const dates=Array.from({length:t.length},(_,i)=>L.doyDate(i,leap,leap?2028:2027));
 const dec=dates.map(d=>sun(jd0(d)).dec), eqt=dates.map(d=>sun(jd0(d)).eqt);
 let best={rms:1e9};
 for(let p=5;p<=62;p+=0.25){
  let sum=0; for(let i=0;i<t.length;i++) sum+=((t[i].Sunrise+t[i].Maghrib)/2)-(720-eqt[i]);
  const lon=-(sum/t.length)/4+off/4;
  for(let h0=-2.2;h0<=0;h0+=0.05){
   const r=[];
   for(let i=0;i<t.length;i++){const pp=p*D2R,dd=dec[i]*D2R;
    const ch=(Math.sin(h0*D2R)-Math.sin(pp)*Math.sin(dd))/(Math.cos(pp)*Math.cos(dd));
    if(ch>1||ch<-1){r.push(99);continue;}
    const H=Math.acos(ch)*R2D/15; const noon=720-eqt[i]-4*(lon-off/4);
    r.push((noon-H*60)-t[i].Sunrise,(noon+H*60)-t[i].Maghrib);}
   const v=L.rms(r); if(v<best.rms) best={rms:v,p,lon,h0};
  }
 }
 return best;
}
for(const f of process.argv.slice(2)){
 const a=run(f,true,120),b=run(f,false,120);
 console.log(f.split('/').pop(), 'leap', a.rms.toFixed(3), 'nonleap', b.rms.toFixed(3));
}
