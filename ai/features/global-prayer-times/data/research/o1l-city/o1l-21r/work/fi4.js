const tab = require(process.env.HOME + '/athan-gitree/census/o1k-wide/europe/data/fi-helsinki-rukousaika-2026.json');
const LAT=60.1699, LNG=24.9384, TZ='Europe/Helsinki';
const rad=Math.PI/180;
function solarAlt(ms){const jd=ms/86400000+2440587.5;const n=jd-2451545.0;const L=(280.460+0.9856474*n)%360;const g=((357.528+0.9856003*n)%360)*rad;const lambda=(L+1.915*Math.sin(g)+0.020*Math.sin(2*g))*rad;const eps=(23.439-0.0000004*n)*rad;const dec=Math.asin(Math.sin(eps)*Math.sin(lambda));const ra=Math.atan2(Math.cos(eps)*Math.sin(lambda),Math.cos(lambda));const gmst=(18.697374558+24.06570982441908*n)%24;const ha=((gmst*15+LNG)-ra/rad+540)%360-180;const H=ha*rad;return Math.asin(Math.sin(LAT*rad)*Math.sin(dec)+Math.cos(LAT*rad)*Math.cos(dec)*Math.cos(H))/rad;}
function tzOff(ms){const s=new Date(ms).toLocaleString('en-GB',{timeZone:TZ,hour12:false});const [d,t]=s.split(', ');const [dd,mm,yy]=d.split('/').map(Number);const [h,mi,se]=t.split(':').map(Number);return Math.round((Date.UTC(yy,mm-1,dd,h,mi,se)-ms)/60000);}
function tabMins(s){const [h,m]=s.split(':').map(Number);return h*60+m;}
function diff(a,b){let d=a-b;while(d>720)d-=1440;while(d<-720)d+=1440;return d;}
function crossing(base,angle,dir){let prev=null,hits=[];for(let m=0;m<=1440;m++){const alt=solarAlt(base+m*60000);if(prev!==null){if((prev+angle)*(alt+angle)<=0&&prev!==alt){hits.push(m-1+(-angle-prev)/(alt-prev));}}prev=alt;}if(!hits.length)return null;return dir<0?hits[0]:hits[hits.length-1];}
const rows=[];
for(const iso of Object.keys(tab)){
  const [y,m,d]=iso.split('-').map(Number);
  const base=Date.UTC(y,m-1,d,0,0,0);
  const off=tzOff(base+12*3600000);
  const r=tab[iso];
  const fa=crossing(base,18,-1), is=crossing(base,17,+1);
  const su=crossing(base,0.833,-1), ma=crossing(base,0.833,+1);
  const faL=fa===null?null:(fa+off)%1440, isL=is===null?null:(is+off)%1440;
  rows.push({iso,off,r,faL,isL,su:(su+off)%1440,ma:(ma+off)%1440,night:1440-((ma+off)%1440)+((su+off)%1440)});
}
const clean=rows.filter(x=>x.faL!==null&&x.isL!==null);
console.log('days',rows.length,'clean(18/17 reachable)',clean.length,'summer',rows.length-clean.length);
let fEx=0,fW=0,iEx=0,iW=0,fw=0,iw=0;
for(const x of clean){
  const tf=tabMins(x.r.fajr), ti=tabMins(x.r.isha);
  const rf=diff(tf,x.faL), ri=diff(ti,x.isL);
  if(Math.abs(rf)<0.5)fEx++; if(Math.abs(rf)<=1)fW++; if(Math.abs(rf)>Math.abs(fw))fw=rf;
  if(Math.abs(ri)<0.5)iEx++; if(Math.abs(ri)<=1)iW++; if(Math.abs(ri)>Math.abs(iw))iw=ri;
}
console.log('CLEAN fajr 18deg: exact',fEx,'within1',fW,'/',clean.length,'worst',fw.toFixed(0));
console.log('CLEAN isha 17deg: exact',iEx,'within1',iW,'/',clean.length,'worst',iw.toFixed(0));
// summer isha: maghrib + 85
let s85=0,sN=0,sw=0,sEx=0;
for(const x of rows){const ti=tabMins(x.r.isha);const pred=(tabMins(x.r.magrib)+85)%1440;const dd=diff(ti,pred);sN++;if(Math.abs(dd)<0.5)sEx++;if(Math.abs(dd)<=1)s85++;if(Math.abs(dd)>Math.abs(sw))sw=dd;}
console.log('ALL isha = maghrib+85: exact',sEx,'within1',s85,'/',sN,'worst',sw.toFixed(0));
// summer fajr candidates
for(const frac of [0.4,0.45,0.5]){
  let ok=0,n=0,w=0;
  for(const x of rows.filter(y=>y.faL===null)){const tf=tabMins(x.r.fajr);const pred=x.su-x.night*frac;const dd=diff(tf,pred);n++;if(Math.abs(dd)<=1)ok++;if(Math.abs(dd)>Math.abs(w))w=dd;}
  console.log('SUMMER fajr = sunrise -',frac,'x night: within1',ok,'/',n,'worst',w.toFixed(0));
}
// sunrise / maghrib / dhuhr pads
const acc={sun:[],mag:[],dhu:[]};
for(const x of rows){acc.sun.push(diff(tabMins(x.r.sunrise),x.su));acc.mag.push(diff(tabMins(x.r.magrib),x.ma));}
console.log('sunrise pad mean',(acc.sun.reduce((a,b)=>a+b,0)/acc.sun.length).toFixed(2),'range',Math.min(...acc.sun).toFixed(0),Math.max(...acc.sun).toFixed(0));
console.log('maghrib pad mean',(acc.mag.reduce((a,b)=>a+b,0)/acc.mag.length).toFixed(2),'range',Math.min(...acc.mag).toFixed(0),Math.max(...acc.mag).toFixed(0));
