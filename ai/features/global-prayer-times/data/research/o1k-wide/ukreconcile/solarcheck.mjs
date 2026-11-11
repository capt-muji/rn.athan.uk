import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const AD = '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs';
const SolarTime = require(`${AD}/SolarTime.js`).default;
const TimeComponents = require(`${AD}/TimeComponents.js`).default;
const { Coordinates } = require(`${AD}/Adhan.js`);
const ROOT = '$HOME/athan-gitree/census/o1k-wide';
const TZ = process.env.TZ || 'Europe/London';
const fmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
const wallMin = (d) => { const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value])); return (Number(p.hour) % 24) * 60 + Number(p.minute) + Number(p.second) / 60; };
const inst = (date, hours) => new TimeComponents(hours).utcDate(date.getFullYear(), date.getMonth(), date.getDate());
const ALIASES = { fajr: ['fajr','fajr_begins','subh_sadiq'], sunrise: ['sunrise'], dhuhr: ['dhuhr','zuhr','zuhr_begins','noon'], asr: ['asr','asr1','asr_mithl_1'], maghrib: ['magrib','maghrib','maghrib_begins'], isha: ['isha','isha_begins','esha'] };
function pmFlag(p, vals){ if(p==='fajr'||p==='sunrise')return false; for(const v of vals){const m=/^(\d{1,2}):/.exec(v||''); if(m&&+m[1]<=9)return true;} return false; }
function parseCol(v,p,isPm){let h=+v.slice(0,v.indexOf(':')),m=+v.slice(-2); if(isPm){if(p==='dhuhr'?h<=9:h<12)h+=12;} return h*60+m;}
const TOWNS = JSON.parse(fs.readFileSync(path.join(ROOT,'ukreconcile/towns.json'),'utf8'));
const out = {};
for (const t of TOWNS) {
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, t.src), 'utf8'));
  const keys = Object.keys(d).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k) && d[k]).sort();
  const cols = {}; for (const [p, names] of Object.entries(ALIASES)) { const n = keys.length && names.find((x) => d[keys[0]][x] != null); if (n) cols[p] = n; }
  if (!cols.sunrise) { out[t.tag] = { noSunrise: true }; continue; }
  const raw = keys.map((k) => String(d[k][cols.sunrise]).trim());
  const isPm = pmFlag('sunrise', raw);
  const sv = [], mv = [];
  const coords = new Coordinates(t.lat, t.lng);
  for (let i = 0; i < keys.length; i++) {
    const [y, m, dd] = keys[i].split('-').map(Number);
    const date = new Date(y, m - 1, dd);
    const st = new SolarTime(date, coords);
    const sr = wallMin(inst(date, st.sunrise)), ss = wallMin(inst(date, st.sunset));
    sv.push(parseCol(raw[i], 'sunrise', isPm) - sr);
    if (cols.maghrib) mv.push(parseCol(String(d[keys[i]][cols.maghrib]).trim(), 'maghrib', pmFlag('maghrib', keys.map((k) => String(d[k][cols.maghrib]).trim()))) - ss);
  }
  const med = (a) => { const s=[...a].sort((x,y)=>x-y); return s.length? +(s[Math.floor(s.length/2)]).toFixed(1):null; };
  out[t.tag] = { n: keys.length, sunriseBias: med(sv), sunriseBiasMin: Math.min(...sv), sunriseBiasMax: Math.max(...sv), maghribBias: mv.length ? med(mv) : null };
}
fs.writeFileSync(path.join(ROOT,'ukreconcile/solarcheck.json'), JSON.stringify(out,null,1));
for (const [k,v] of Object.entries(out)) console.log(k.padEnd(22), v.noSunrise ? 'no sunrise column' : `sunrise ${v.sunriseBias} [${v.sunriseBiasMin},${v.sunriseBiasMax}]  maghrib ${v.maghribBias}`);
