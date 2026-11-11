process.env.TZ = 'Europe/Istanbul';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { CalculationMethod, Coordinates, PrayerTimes, Rounding } = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan');

const CITIES = {
  izmir:      { ilce: 9560, lat: 38.4237, lon: 27.1428, name: 'İzmir' },
  bursa:      { ilce: 9335, lat: 40.1885, lon: 29.0610, name: 'Bursa' },
  adana:      { ilce: 9146, lat: 37.0000, lon: 35.3213, name: 'Adana' },
  konya:      { ilce: 9676, lat: 37.8746, lon: 32.4932, name: 'Konya' },
  antalya:    { ilce: 9225, lat: 36.8969, lon: 30.7133, name: 'Antalya' },
  trabzon:    { ilce: 9905, lat: 41.0027, lon: 39.7168, name: 'Trabzon' },
  diyarbakir: { ilce: 9402, lat: 37.9144, lon: 40.2306, name: 'Diyarbakır' },
  erzurum:    { ilce: 9451, lat: 39.9043, lon: 41.2679, name: 'Erzurum' },
  samsun:     { ilce: 9819, lat: 41.2867, lon: 36.3300, name: 'Samsun' },
  kayseri:    { ilce: 9620, lat: 38.7312, lon: 35.4787, name: 'Kayseri' },
  eskisehir:  { ilce: 9470, lat: 39.7767, lon: 30.5206, name: 'Eskişehir' },
  malatya:    { ilce: 9703, lat: 38.3552, lon: 38.3095, name: 'Malatya' },
  van:        { ilce: 9930, lat: 38.4891, lon: 43.4089, name: 'Van' },
  sanliurfa:  { ilce: 9831, lat: 37.1591, lon: 38.7969, name: 'Şanlıurfa' },
  denizli:    { ilce: 9392, lat: 37.7765, lon: 29.0864, name: 'Denizli' },
};

const COLS = ['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const params = CalculationMethod.Turkey();
params.rounding = Rounding.None;

function fmt(d){
  const s = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(d);
  return s;
}
function toMin(hhmm){const [h,m]=hhmm.split(':').map(Number);return h*60+m;}
function nearestMin(hms){
  const [h,m,s]=hms.split(':').map(Number);
  let total=h*60+m+(s>=30?1:0);
  return total;
}
function compute(lat,lon,dateStr){
  const [y,m,d]=dateStr.split('-').map(Number);
  const pt=new PrayerTimes(new Coordinates(lat,lon), new Date(y,m-1,d,12,0,0), params);
  const out={};
  for(const c of COLS) out[c]=nearestMin(fmt(pt[c]));
  return out;
}

function score(city, lat, lon, rows, step=1){
  const err={}; for(const c of COLS) err[c]=[];
  let abs=0, n=0;
  const entries=Object.entries(rows);
  for(let i=0;i<entries.length;i+=step){
    const [date,row]=entries[i];
    const calc=compute(lat,lon,date);
    for(const c of COLS){
      const e=calc[c]-toMin(row[c]);
      err[c].push(e); abs+=Math.abs(e); n++;
    }
  }
  return {mae:abs/n, err};
}

const report={};
for(const [slug,meta] of Object.entries(CITIES)){
  const rows=JSON.parse(fs.readFileSync(`data/tr-2026-${slug}.json`,'utf8')).rows;
  const base=score(meta,meta.lat,meta.lon,rows);
  // anchor recovery: coarse grid around city centre
  let best={mae:Infinity,lat:meta.lat,lon:meta.lon};
  for(let dlat=-0.30;dlat<=0.30001;dlat+=0.02){
    for(let dlon=-0.40;dlon<=0.40001;dlon+=0.02){
      const s=score(meta,meta.lat+dlat,meta.lon+dlon,rows,10);
      if(s.mae<best.mae) best={mae:s.mae,lat:+(meta.lat+dlat).toFixed(4),lon:+(meta.lon+dlon).toFixed(4)};
    }
  }
  report[slug]={city:meta.name,ilce:meta.ilce,coords:[meta.lat,meta.lon],baseMae:+base.mae.toFixed(3),anchor:best};
  console.log(slug, 'base MAE', base.mae.toFixed(3), '| anchor', best.lat, best.lon, 'MAE', best.mae.toFixed(3));
}
fs.writeFileSync('data/anchor-search.json',JSON.stringify(report,null,1));
