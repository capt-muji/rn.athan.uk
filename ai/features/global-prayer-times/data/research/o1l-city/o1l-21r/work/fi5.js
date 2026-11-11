const tab = require(process.env.HOME + '/athan-gitree/census/o1k-wide/europe/data/fi-helsinki-rukousaika-2026.json');
const LAT=60.1699, LNG=24.9384, TZ='Europe/Helsinki';
const rad=Math.PI/180;
function solarAlt(ms){const jd=ms/86400000+2440587.5;const n=jd-2451545.0;const L=(280.460+0.9856474*n)%360;const g=((357.528+0.9856003*n)%360)*rad;const lambda=(L+1.915*Math.sin(g)+0.020*Math.sin(2*g))*rad;const eps=(23.439-0.0000004*n)*rad;const dec=Math.asin(Math.sin(eps)*Math.sin(lambda));const ra=Math.atan2(Math.cos(eps)*Math.sin(lambda),Math.cos(lambda));const gmst=(18.697374558+24.06570982441908*n)%24;const ha=((gmst*15+LNG)-ra/rad+540)%360-180;const H=ha*rad;return Math.asin(Math.sin(LAT*rad)*Math.sin(dec)+Math.cos(LAT*rad)*Math.cos(dec)*Math.cos(H))/rad;}
function tzOff(ms){const s=new Date(ms).toLocaleString('en-GB',{timeZone:TZ,hour12:false});const [d,t]=s.split(', ');const [dd,mm,yy]=d.split('/').map(Number);const [h,mi,se]=t.split(':').map(Number);return Math.round((Date.UTC(yy,mm-1,dd,h,mi,se)-ms)/60000);}
function tabMins(s){const [h,m]=s.split(':').map(Number);return h*60+m;}
function diff(a,b){let d=a-b;while(d>720)d-=1440;while(d<-720)d+=1440;return d;}
function crossing(base,angle,dir){let prev=null,hits=[];for(let m=0;m<=1440;m++){const alt=solarAlt(base+m*60000);if(prev!==null){if((prev+angle)*(alt+angle)<=0&&prev!==alt){hits.push(m-1+(-angle-prev)/(alt-prev));}}prev=alt;}if(!hits.length)return null;return dir<0?hits[0]:hits[hits.length-1];}
function minAlt(base){let mn=99;for(let m=0;m<=1440;m++){const a=solarAlt(base+m*60000);if(a<mn)mn=a;}return mn;}
let cleanF=0,fW=0,fEx=0,fworst=0,cleanI=0,iW=0,iEx=0,iworst=0,summer=0,s85=0,s85w=0;
for(const iso of Object.keys(tab)){
  const [y,m,d]=iso.split('-').map(Number);
  const base=Date.UTC(y,m-1,d,0,0,0);
  const off=tzOff(base+12*3600000);
  const r=tab[iso];
  const mn=minAlt(base);
  const fa=crossing(base,18,-1), is=crossing(base,17,+1);
  if(fa!==null&&mn<-18.2&&(fa+off)%1440<((crossing(base,0.833,-1)+off)%1440)-20){const pred=(fa+off)%1440;const rf=diff(tabMins(r.fajr),pred);cleanF++;if(Math.abs(rf)<0.5)fEx++;if(Math.abs(rf)<=1)fW++;if(Math.abs(rf)>Math.abs(fworst))fworst=rf;}
  if(is!==null&&mn<-17.2&&(is+off)%1440>((crossing(base,0.833,1)+off)%1440)+20){const pred=(is+off)%1440;const ri=diff(tabMins(r.isha),pred);cleanI++;if(Math.abs(ri)<0.5)iEx++;if(Math.abs(ri)<=1)iW++;if(Math.abs(ri)>Math.abs(iworst))iworst=ri;}
  if(mn>-17.2){summer++;const dd=diff(tabMins(r.isha),(tabMins(r.magrib)+85)%1440);if(Math.abs(dd)<=1)s85++;if(Math.abs(dd)>Math.abs(s85w))s85w=dd;}
}
console.log('fajr 18 clean days',cleanF,'exact',fEx,'within1',fW,'worst',fworst.toFixed(0));
console.log('isha 17 clean days',cleanI,'exact',iEx,'within1',iW,'worst',iworst.toFixed(0));
console.log('summer days (min alt > -17.2)',summer,'isha=maghrib+85 within1',s85,'worst',s85w.toFixed(0));
// list fajr outliers on clean days
{
 const out=[];
 for(const iso of Object.keys(tab)){
  const [y,m,d]=iso.split('-').map(Number);const base=Date.UTC(y,m-1,d,0,0,0);const off=tzOff(base+12*3600000);const r=tab[iso];
  const mn=minAlt(base);const fa=crossing(base,18,-1);
  if(fa!==null&&mn<-18.2&&(fa+off)%1440<((crossing(base,0.833,-1)+off)%1440)-20){
    const rf=diff(tabMins(r.fajr),(fa+off)%1440); if(Math.abs(rf)>1) out.push(iso+':'+rf.toFixed(0)+'@min'+mn.toFixed(1));
  }}
 console.log('fajr outliers',out.length, out.slice(0,12).join(' '));
}
