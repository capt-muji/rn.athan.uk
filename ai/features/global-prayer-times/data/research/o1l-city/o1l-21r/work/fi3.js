const tab = require(process.env.HOME + '/athan-gitree/census/o1k-wide/europe/data/fi-helsinki-rukousaika-2026.json');
const LAT=60.1699, LNG=24.9384, TZ='Europe/Helsinki';
const rad=Math.PI/180;
function solarAlt(ms){const jd=ms/86400000+2440587.5;const n=jd-2451545.0;const L=(280.460+0.9856474*n)%360;const g=((357.528+0.9856003*n)%360)*rad;const lambda=(L+1.915*Math.sin(g)+0.020*Math.sin(2*g))*rad;const eps=(23.439-0.0000004*n)*rad;const dec=Math.asin(Math.sin(eps)*Math.sin(lambda));const ra=Math.atan2(Math.cos(eps)*Math.sin(lambda),Math.cos(lambda));const gmst=(18.697374558+24.06570982441908*n)%24;const ha=((gmst*15+LNG)-ra/rad+540)%360-180;const H=ha*rad;return Math.asin(Math.sin(LAT*rad)*Math.sin(dec)+Math.cos(LAT*rad)*Math.cos(dec)*Math.cos(H))/rad;}
function tzOff(ms){const s=new Date(ms).toLocaleString('en-GB',{timeZone:TZ,hour12:false});const [d,t]=s.split(', ');const [dd,mm,yy]=d.split('/').map(Number);const [h,mi,se]=t.split(':').map(Number);return Math.round((Date.UTC(yy,mm-1,dd,h,mi,se)-ms)/60000);}
function localToMs(iso,h,mi){const [y,m,d]=iso.split('-').map(Number);let ms=Date.UTC(y,m-1,d,h,mi,0);const off=tzOff(ms+12*3600000);return ms-off*60000;}
for(const iso of ['2026-05-15','2026-06-01','2026-06-21','2026-07-01','2026-07-15','2026-08-01','2026-08-15']){
  const r=tab[iso]; if(!r) continue;
  const [fh,fm]=r.fajr.split(':').map(Number), [ih,im]=r.isha.split(':').map(Number);
  const [mh,mm]=r.magrib.split(':').map(Number), [sh,sm]=r.sunrise.split(':').map(Number);
  const fa=solarAlt(localToMs(iso,fh,fm));
  const is=solarAlt(localToMs(iso,ih,im));
  console.log(iso,'fajr',r.fajr,'alt',fa.toFixed(2),'| isha',r.isha,'alt',is.toFixed(2),'| magrib',r.magrib,'sunrise',r.sunrise);
}
