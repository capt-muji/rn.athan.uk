import fs from 'node:fs';
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36';
const admin=JSON.parse(fs.readFileSync('data/admin-districts.json','utf8'));
const lines=[]; const out={};
async function resolve(prov,district){
  const url='https://namazvakitleri.diyanet.gov.tr/Tr-tr/home/GetDestinationUrl'
    +`?CountryName=${encodeURIComponent('TÜRKİYE')}`
    +`&StateName=${encodeURIComponent(prov)}`
    +`&StateRegionName=${encodeURIComponent(district)}`
    +'&Culture=tr-TR';
  for(let attempt=0;attempt<4;attempt++){
    const r=await fetch(url,{headers:{'User-Agent':UA,'X-Requested-With':'XMLHttpRequest'}});
    const text=await r.text();
    if(r.status===200){
      let j=null; try{j=JSON.parse(text);}catch{}
      if(j?.IlceId) return {status:r.status,text,j};
    }
    await new Promise(r=>setTimeout(r,1200*(attempt+1)));
  }
  return {status:0,text:'FAILED',j:null};
}
for(const [prov,districts] of Object.entries(admin)){
  out[prov]=[];
  for(const d of districts){
    const res=await resolve(prov,d);
    const rec={district:d,ilce:res.j?.IlceId?Number(res.j.IlceId):null,result:res.j?.Result??null};
    lines.push(`${prov}|${d}|${res.status}|${res.text.trim()}`);
    out[prov].push(rec);
    console.log(prov, d, rec.ilce);
    await new Promise(r=>setTimeout(r,450));
  }
}
fs.writeFileSync('captures/ilce-resolve.txt',lines.join('\n')+'\n');
fs.writeFileSync('data/resolver-admin.json',JSON.stringify(out,null,1));
const miss=Object.values(out).flat().filter(x=>!x.ilce);
console.log('unresolved',miss.length,miss.map(m=>m.district));
