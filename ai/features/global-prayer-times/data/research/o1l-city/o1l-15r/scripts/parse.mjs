import fs from 'node:fs';
import path from 'node:path';

const MONTHS = {Ocak:1,Şubat:2,Mart:3,Nisan:4,Mayıs:5,Haziran:6,Temmuz:7,Ağustos:8,Eylül:9,Ekim:10,Kasım:11,Aralık:12};

function strip(s){
  const decoded = s.replace(/<[^>]*>/g,'')
    .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
    .replace(/&nbsp;/g,' ')
    .replace(/&amp;/g,'&');
  return decoded.trim();
}

function parse(file){
  const html = fs.readFileSync(file,'utf8');
  const start = html.indexOf('id="yourTable"');
  if(start<0) throw new Error('no yourTable in '+file);
  const tbl = html.slice(start);
  const end = tbl.indexOf('</table>');
  const body = tbl.slice(0,end);
  const rows = [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(m=>m[1]);
  const out = {};
  for(const r of rows){
    const cells = [...r.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(m=>strip(m[1]));
    if(cells.length<8) continue;
    const dm = cells[0].match(/^(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)\s+(\d{4})/);
    if(!dm) continue;
    const mon = MONTHS[dm[2]];
    if(!mon) throw new Error('month '+dm[2]+' in '+file);
    const date = `${dm[3]}-${String(mon).padStart(2,'0')}-${String(dm[1]).padStart(2,'0')}`;
    const [imsak,gunes,ogle,ikindi,aksam,yatsi] = cells.slice(2,8);
    out[date] = {fajr:imsak, sunrise:gunes, dhuhr:ogle, asr:ikindi, maghrib:aksam, isha:yatsi};
  }
  return out;
}

const dir='captures';
const files = fs.readdirSync(dir).filter(f=>/^tr-2026-.*\.html$/.test(f));
const manifest = {};
for(const f of files){
  const m = f.match(/^tr-2026-(.+)-(\d+)\.html$/);
  const slug=m[1], id=m[2];
  const rows = parse(path.join(dir,f));
  const dates = Object.keys(rows).sort();
  manifest[slug] = {ilceId:Number(id), file:f, days:dates.length, first:dates[0], last:dates.at(-1)};
  fs.writeFileSync(`data/tr-2026-${slug}.json`, JSON.stringify({_source:`Diyanet namazvakitleri.diyanet.gov.tr/tr-TR/${id}`, _captured:'2026-11-11', _ilce:Number(id), rows},null,1));
  console.log(slug, id, dates.length, dates[0], dates.at(-1));
}
fs.writeFileSync('data/manifest.json', JSON.stringify(manifest,null,1));
