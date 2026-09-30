const adhan=require('/Users/muji/repos/rn.athan.uk/node_modules/adhan');
const {solar}=require('/tmp/solar.js');
const d2r=Math.PI/180,r2d=180/Math.PI,norm=a=>((a%360)+360)%360;
// FIX: f(dec) is monotone but its DIRECTION depends on sign(phi). Scan instead of
// assuming, so it is hemisphere-safe and equator-safe.
function publicSolar(date,lat,lon){
  const c=new adhan.Coordinates(lat,lon);
  const p=new adhan.PrayerTimes(c,date,adhan.CalculationMethod.MuslimWorldLeague());
  if(!p.sunrise||!p.sunset||isNaN(p.sunrise)||isNaN(p.sunset)) return null;
  const H0=((p.sunset-p.sunrise)/2/3600000)*15*d2r;
  const phi=lat*d2r,h0=-50/60*d2r;
  const f=(decDeg)=>{const dm=decDeg*d2r;
    const c0=(Math.sin(h0)-Math.sin(phi)*Math.sin(dm))/(Math.cos(phi)*Math.cos(dm));
    return Math.acos(Math.max(-1,Math.min(1,c0)))-H0;};
  // coarse scan for the sign change, then bisect inside that bracket
  let lo=null,hi=null,prev=f(-23.5),pd=-23.5;
  for(let d=-23.4;d<=23.5;d+=0.1){const v=f(d);
    if(Math.sign(v)!==Math.sign(prev)){lo=pd;hi=d;break;} prev=v;pd=d;}
  if(lo===null) return null;
  for(let i=0;i<60;i++){const m=(lo+hi)/2;
    if(Math.sign(f(m))===Math.sign(f(lo))) lo=m; else hi=m;}
  const dec=(lo+hi)/2*d2r;
  const H=((date-p.dhuhr)/3600000)*15*d2r;
  return {az:norm(Math.atan2(Math.sin(H),Math.cos(H)*Math.sin(phi)-Math.tan(dec)*Math.cos(phi))*r2d+180),
          dec:dec*r2d};
}
console.log('=== PUBLIC-API route, hemisphere-safe. Wide sweep. ===\n');
const places=[['London',51.5074,-0.1278],['NYC',40.71,-74.01],['Jakarta',-6.21,106.85],
  ['Cairo',30.04,31.24],['Sydney',-33.87,151.21],['Singapore',1.35,103.82],
  ['Makkah',21.42,39.83],['Reykjavik',64.15,-21.94],['Lagos',6.52,3.38],['Karachi',24.86,67.0]];
let worst=0,sum=0,n=0,worstCase=null;
for(const [nm,lat,lon] of places) for(let mo=0;mo<12;mo++) for(const hh of [6,8,10,12,14,16,18]){
  const d=new Date(Date.UTC(2026,mo,15,hh,0,0));
  const a=solar(d,lat,lon), b=publicSolar(d,lat,lon);
  if(!b||a.alt<5||a.alt>65) continue;
  let diff=Math.abs(norm(a.az-b.az)); if(diff>180)diff=360-diff;
  sum+=diff;n++; if(diff>worst){worst=diff;worstCase=`${nm} m${mo+1} ${hh}:00`;}
}
console.log(`samples in the 5-65 gate: ${n}  (10 cities, all 12 months)`);
console.log(`mean  : ${(sum/n).toFixed(3)} deg`);
console.log(`worst : ${worst.toFixed(3)} deg   at ${worstCase}`);
console.log(worst<1.0
 ? '\nVERDICT: the PUBLIC API is enough. No deep import, no Metro/Jest/tsc risk.'
 : '\nVERDICT: still lossy at the worst case; weigh against the deep import.');
