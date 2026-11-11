import fs from 'node:fs';
const fit=JSON.parse(fs.readFileSync('data/fit-districts.json','utf8'));
const dev=JSON.parse(fs.readFileSync('data/deviation.json','utf8'));
const rows=[];
for(const [prov,po] of Object.entries(fit)){
  const cap=po.capital.coord;
  for(const [name,r] of Object.entries(po.districts)){
    const d=dev[prov].districts[name];
    const dlat=(r.coord[0]-cap.lat)*111.32;
    const dlon=(r.coord[1]-cap.lon)*111.32*Math.cos(cap.lat*Math.PI/180);
    rows.push({province:prov,district:name,ilce:r.ilce,coord:r.coord,
      km:+Math.hypot(dlat,dlon).toFixed(1),
      devMae:d.mae,devWorst:d.worst,
      fitMae:r.mae,fitW1:r.w1Pct,fitExact:r.exactPct,fitWorst:r.worst,
      anchor:r.anchor,anchorMae:r.anchorMae,anchorW1:r.anchorW1,
      resid:r.diffResidualMae,residWorst:r.diffResidualWorst,
      perPrayer:r.perPrayer});
  }
}
fs.writeFileSync('data/analysis.json',JSON.stringify(rows,null,1));
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
const med=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)];};
const corr=(x,y)=>{const mx=mean(x),my=mean(y);let n=0,dx=0,dy=0;
  for(let i=0;i<x.length;i++){n+=(x[i]-mx)*(y[i]-my);dx+=(x[i]-mx)**2;dy+=(y[i]-my)**2;}return n/Math.sqrt(dx*dy);};
console.log('districts',rows.length);
console.log('distance km: min',Math.min(...rows.map(r=>r.km)),'med',med(rows.map(r=>r.km)),'max',Math.max(...rows.map(r=>r.km)));
console.log('corr(devMae, km)',corr(rows.map(r=>r.devMae),rows.map(r=>r.km)).toFixed(3));
console.log('corr(devMae, abs(dlat))',corr(rows.map(r=>r.devMae),rows.map(r=>Math.abs(r.coord[0]-fit[r.province].capital.coord.lat))).toFixed(3));
console.log('corr(devMae, abs(dlon))',corr(rows.map(r=>r.devMae),rows.map(r=>Math.abs(r.coord[1]-fit[r.province].capital.coord.lon))).toFixed(3));
const resid=rows.map(r=>r.resid);
console.log('\nPURE-REFINEMENT RESIDUAL (table diff minus model diff), min:');
console.log('  min',Math.min(...resid).toFixed(3),'median',med(resid).toFixed(3),'mean',mean(resid).toFixed(3),'max',Math.max(...resid).toFixed(3));
const buckets=[[0,0.25],[0.25,0.5],[0.5,1],[1,1.5],[1.5,2],[2,3],[3,99]];
for(const [lo,hi] of buckets) console.log(`  ${lo}-${hi}: ${resid.filter(v=>v>=lo&&v<hi).length}`);
console.log('\nFIT AT OWN POINT: w1 distribution');
const w1=rows.map(r=>r.fitW1).sort((a,b)=>a-b);
console.log('  min',w1[0],'p10',w1[Math.floor(0.1*w1.length)],'median',med(w1),'max',w1.at(-1));
console.log('  districts at >=95pc:',w1.filter(v=>v>=95).length,'of',w1.length);
console.log('  districts at >=90pc:',w1.filter(v=>v>=90).length);
console.log('  districts below 85pc:',w1.filter(v=>v<85).length);
console.log('\nFIT worst-cell distribution', [...new Set(rows.map(r=>r.fitWorst))].sort((a,b)=>a-b).join(','));
console.log('\nANCHORED:',rows.filter(r=>r.anchor).length,'districts; median anchor improvement',med(rows.filter(r=>r.anchor).map(r=>r.fitMae-r.anchorMae)).toFixed(2));
console.log('\nper-province summary');
for(const p of Object.keys(fit)){
  const rs=rows.filter(r=>r.province===p);
  console.log(` ${p.padEnd(11)} n=${String(rs.length).padStart(2)} devMae med ${med(rs.map(r=>r.devMae)).toFixed(2)} | fit w1 med ${med(rs.map(r=>r.fitW1)).toFixed(1)} min ${Math.min(...rs.map(r=>r.fitW1)).toFixed(1)} | resid med ${med(rs.map(r=>r.resid)).toFixed(2)} max ${Math.max(...rs.map(r=>r.resid)).toFixed(2)}`);
}
console.log('\nlargest residuals');
for(const r of [...rows].sort((a,b)=>b.resid-a.resid).slice(0,8))
  console.log(` ${r.province} ${r.district} resid ${r.resid} worst ${r.residWorst} km ${r.km} fitW1 ${r.fitW1}`);
console.log('\nsmallest residuals');
for(const r of [...rows].sort((a,b)=>a.resid-b.resid).slice(0,6))
  console.log(` ${r.province} ${r.district} resid ${r.resid} km ${r.km} fitW1 ${r.fitW1}`);
