import fs from 'node:fs';
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36';
const provs=JSON.parse(fs.readFileSync('data/provinces.json','utf8'));
const out=[];
for(const [sid,name] of provs){
  const url=`https://namazvakitleri.diyanet.gov.tr/Tr-tr/home/GetDestinationUrl?CountryName=T%C3%9CRK%C4%B0YE&StateName=${encodeURIComponent(name)}&StateRegionName=&Culture=tr-TR`;
  const r=await fetch(url,{headers:{'User-Agent':UA,'X-Requested-With':'XMLHttpRequest'}});
  const j=await r.json().catch(()=>null);
  out.push({sid,name,ilce:j?.IlceId??null,url:j?.Url??null});
  console.log(sid,name,j?.IlceId,j?.Result);
  await new Promise(r=>setTimeout(r,120));
}
fs.writeFileSync('data/province-ilce.json',JSON.stringify(out,null,1));
