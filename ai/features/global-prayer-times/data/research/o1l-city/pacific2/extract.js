const fs=require('fs');
function cap(confPath){
  const o=JSON.parse(fs.readFileSync(confPath,'utf8'));
  const cal=o.calendar; const out={};
  const Y=2026;
  for(let m=0;m<12;m++){
    const days=Object.keys(cal[m]).map(Number).sort((a,b)=>a-b);
    for(const d of days){
      const v=cal[m][String(d)];
      const ds=`${Y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      out[ds]={fajr:v[0],sunrise:v[1],dhuhr:v[2],asr:v[3],maghrib:v[4],isha:v[5]};
    }
  }
  return {o,out};
}
module.exports={cap};
