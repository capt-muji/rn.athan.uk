// What is the felagmuslima asr column? Invert the printed minute to the sun
// altitude, then to the shadow length the generator must have used.
import fs from 'node:fs';
import path from 'node:path';
import { init, solarDay, parseHHMM, round2, fmtSec } from './lib.mjs';

const TZ = 'Atlantic/Reykjavik';
const files = {
  'reykjavik-2025': [path.join(process.env.HOME, 'athan-gitree/census/o1k-wide/europe/data/is-reykjavik-2025.json'), 64.1466, -21.9426],
  'akureyri-2025': [path.join(process.env.HOME, 'athan-gitree/census/o1k-wide/europe/data/is-akureyri-2025.json'), 65.6835, -18.1002],
  'reykjavik-2027': [path.join(process.env.HOME, 'athan-gitree/census/o1k-wide/nordics2/data/is-felagmuslima-reykjavik-2027.json'), 64.1466, -21.9426],
  'akureyri-2027': [path.join(process.env.HOME, 'athan-gitree/census/o1k-wide/nordics2/data/is-felagmuslima-akureyri-2027.json'), 65.6835, -18.1002],
};
const A = await init();
const { SolarTime, Coordinates } = A;

const RAD = Math.PI / 180, DEG = 180 / Math.PI;

function solar(lat, lng, iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new SolarTime(new Date(Date.UTC(y, m - 1, d, 12)), new Coordinates(lat, lng));
}
// altitude of the sun at a given local second, from the spherical relation
function altitudeAt(lat, iso, transitSec, atSec) {
  const st = solar(lat, -0, iso);
  const dec = st.solar.declination * RAD;
  const H = ((atSec - transitSec) / 3600) * 15 * RAD;
  const sinAlt = Math.sin(lat * RAD) * Math.sin(dec) + Math.cos(lat * RAD) * Math.cos(dec) * Math.cos(H);
  return Math.asin(Math.max(-1, Math.min(1, sinAlt))) * DEG;
}

for (const [name, [file, lat, lng]] of Object.entries(files)) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const days = Object.keys(raw).sort();
  const rows = [];
  for (const iso of days) {
    const printed = parseHHMM(raw[iso].asr);
    const st = solar(lat, lng, iso);
    const dec = st.solar.declination;
    const transitSec = (st.transit % 24) * 3600;
    const alt = altitudeAt(lat, iso, transitSec, printed * 60);
    const shadow = 1 / Math.tan(alt * RAD) - Math.tan(Math.abs(lat - dec) * RAD);
    const shafiAlt = Math.atan(1 / (1 + Math.tan(Math.abs(lat - dec) * RAD))) * DEG;
    rows.push({ iso, printed, dec: round2(dec), alt: round2(alt), shadow: round2(shadow), shafiAlt: round2(shafiAlt) });
  }
  const sh = rows.map((r) => r.shadow);
  const byMonth = {};
  for (const r of rows) {
    const m = r.iso.slice(0, 7);
    (byMonth[m] ||= []).push(r.shadow);
  }
  console.log('\n==', name, 'rows', rows.length);
  console.log('implied shadow length: min', Math.min(...sh), 'max', Math.max(...sh),
    'median', round2(sh.slice().sort((a, b) => a - b)[Math.floor(sh.length / 2)]));
  const head = Object.keys(byMonth).sort();
  console.log(head.map((m) => `${m.slice(5)}:${round2(byMonth[m].reduce((a, b) => a + b, 0) / byMonth[m].length)}`).join(' '));
  console.log('first 3', JSON.stringify(rows.slice(0, 3)));
  console.log('mid-year', JSON.stringify(rows.filter((r) => r.iso.endsWith('-06-21') || r.iso.endsWith('-12-21'))));
}
