const adhan=require('/Users/muji/repos/rn.athan.uk/node_modules/adhan');
const {solar}=require('/tmp/solar.js');
const d2r=Math.PI/180,r2d=180/Math.PI,norm=a=>((a%360)+360)%360;
const src=require('fs').readFileSync('/tmp/pubapi2.js','utf8');
eval(src.slice(src.indexOf('function publicSolar'), src.indexOf('console.log(\'=== PUBLIC')));
console.log('=== Is the public route\'s error a SINGULARITY or a general weakness? ===\n');
// Singapore lat 1.35 is nearly equatorial: cos(phi)~1, and the declination solve
// is ill-conditioned because H0 barely changes with dec.
for(const [nm,lat] of [['Singapore',1.35],['Lagos',6.52],['Jakarta',-6.21],['Karachi',24.86],['London',51.51]]){
  const phi=lat*d2r,h0=-50/60*d2r;
  const H=(dec)=>{const dm=dec*d2r;
    return Math.acos(Math.max(-1,Math.min(1,(Math.sin(h0)-Math.sin(phi)*Math.sin(dm))/(Math.cos(phi)*Math.cos(dm)))))*r2d;};
  const span=Math.abs(H(23.44)-H(-23.44));
  console.log(`${nm.padEnd(11)} lat ${String(lat).padStart(6)}  H0 spans ${span.toFixed(2)} deg across the whole year`);
}
console.log('\nA tiny span means minutes of sunrise/sunset rounding map to LARGE dec error.');
console.log('adhan rounds prayer times to the MINUTE, so near the equator the solve is');
console.log('reading declination out of noise. That is a real singularity, not a bug.\n');
console.log('=== How much does 1 minute of rounding cost, by latitude? ===');
for(const [nm,lat] of [['Singapore',1.35],['Lagos',6.52],['Karachi',24.86],['London',51.51]]){
  const phi=lat*d2r,h0=-50/60*d2r;
  const decOf=(H0deg)=>{const H0=H0deg*d2r;
    const f=(d)=>{const dm=d*d2r;
      return Math.acos(Math.max(-1,Math.min(1,(Math.sin(h0)-Math.sin(phi)*Math.sin(dm))/(Math.cos(phi)*Math.cos(dm)))))-H0;};
    let lo=-23.5,hi=23.5,prev=f(lo),pd=lo,found=false;
    for(let d=-23.4;d<=23.5;d+=0.05){const v=f(d); if(Math.sign(v)!==Math.sign(prev)){lo=pd;hi=d;found=true;break;} prev=v;pd=d;}
    if(!found) return null;
    for(let i=0;i<60;i++){const m=(lo+hi)/2; if(Math.sign(f(m))===Math.sign(f(lo))) lo=m; else hi=m;}
    return (lo+hi)/2;};
  // half-day of 6h05 vs 6h06 = 0.25 deg of H0
  const a=decOf(91.0), b=decOf(91.25);
  console.log(`${nm.padEnd(11)} 1 min of rounding -> ${(a!==null&&b!==null)?Math.abs(a-b).toFixed(2)+' deg of declination error':'n/a'}`);
}
