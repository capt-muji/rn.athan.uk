import * as Adhan from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';
export { Adhan };
const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dhaka',hour:'2-digit',minute:'2-digit',hour12:false});
export function hm(date){const p=fmt.formatToParts(date);const h=p.find(x=>x.type==='hour').value,m=p.find(x=>x.type==='minute').value;return `${h==='24'?'00':h}:${m}`;}
export function toMin(s){const[h,m]=s.split(':').map(Number);return h*60+m;}
export function templateDates(year,leap){
  const lens=[31,29,31,30,31,30,31,31,30,31,30,31];const out=[];
  for(let mo=0;mo<12;mo++)for(let day=1;day<=lens[mo];day++){
    if(!leap&&mo===1&&day===29)continue;
    out.push([year,mo+1,day]);
  }
  return out;
}
export function loadCal(file,fs){
  const t=fs.readFileSync('captures/'+file,'utf8');
  const d=JSON.parse(t.match(/let confData = (\{[\s\S]*?\});/)[1]);
  const seq=[];
  for(const mo of d.calendar) for(const day of Object.keys(mo).sort((a,b)=>a-b)) seq.push(mo[day]);
  return {d,seq};
}
