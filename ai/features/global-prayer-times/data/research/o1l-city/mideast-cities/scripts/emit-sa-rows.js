const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),CAP=path.join(ROOT,'captures');
const COLS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const C={makkah:[21.4225,39.8262],riyadh:[24.7136,46.6753],medina:[24.4672,39.6111],jeddah:[21.4858,39.1925],abha:[18.2164,42.5053],tabuk:[28.3835,36.5662],dammam:[26.4207,50.0888],taif:[21.2703,40.4158],buraidah:[26.3260,43.9750],hail:[27.5114,41.7208]};
for(const n of Object.keys(C)){
  const rows={};
  for(const yh of [1448,1449]){
    const raw=JSON.parse(fs.readFileSync(path.join(CAP,`sa-${n}-${yh}.json`),'utf8'));
    for(const r of raw) if(r.hijriDate.year===yh) rows[r.date.slice(0,10)]=Object.fromEntries(COLS.map(k=>[k,r.prayerTimes[k]]));
  }
  fs.writeFileSync(path.join(ROOT,'data',`sa-${n}-rows.json`),JSON.stringify(rows,null,1));
  console.log(n,Object.keys(rows).length);
}
