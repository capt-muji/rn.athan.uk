// Recover the LATITUDE a publisher's solar columns imply, from the seasonal shape
// of sunrise/sunset/asr with the constant temkin removed per column. Longitude is
// degenerate with the dhuhr temkin (both shift every column by one constant), so
// it is not recovered here; the fit uses the standard city point.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const ADHAN = process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/';
const mod = await import(pathToFileURL(ADHAN + 'Adhan.js'));
const { default: SolarTime } = await import(pathToFileURL(ADHAN + 'SolarTime.js'));
const { default: TimeComponents } = await import(pathToFileURL(ADHAN + 'TimeComponents.js'));

const secOf = (dt) => dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds();
const parse = (v) => { const [h, m] = v.split(':').map(Number); return h * 3600 + m * 60; };
const inst = (d, hours) => new TimeComponents(hours).utcDate(d.getFullYear(), d.getMonth(), d.getDate());

function load(file) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  return Object.keys(data).sort().map((k) => {
    const [y, m, d] = k.split('-').map(Number);
    const r = data[k];
    return { date: new Date(y, m - 1, d), dhuhr: parse(r.dhuhr), sunrise: parse(r.sunrise), maghrib: parse(r.maghrib), asr: parse(r.asr) };
  });
}

const rms = (vals) => { let s = 0, m = 0; for (const v of vals) m += v; m /= vals.length; for (const v of vals) s += (v - m) ** 2; return { rms: Math.sqrt(s / vals.length), offset: m }; };

function solar(lat, rows, idx) {
  const coords = new mod.Coordinates(lat, 0);
  const out = { transit: [], sunrise: [], sunset: [], asr: [] };
  for (const i of idx) {
    const r = rows[i], st = new SolarTime(r.date, coords);
    out.transit.push(secOf(inst(r.date, st.transit)));
    out.sunrise.push(secOf(inst(r.date, st.sunrise)));
    out.sunset.push(secOf(inst(r.date, st.sunset)));
    out.asr.push(secOf(inst(r.date, st.afternoon(1))));
  }
  return out;
}

function latScore(lat, rows, idx) {
  const s = solar(lat, rows, idx);
  const r = rms(s.sunrise.map((v, j) => v - rows[idx[j]].sunrise));
  const m = rms(s.sunset.map((v, j) => v - rows[idx[j]].maghrib));
  const a = rms(s.asr.map((v, j) => v - rows[idx[j]].asr));
  return r.rms ** 2 + m.rms ** 2 + a.rms ** 2;
}

const files = process.argv.slice(2);
const out = {};
for (const f of files) {
  const tag = f.split('de-diyanet-')[1].replace('-2026.json', '');
  const rows = load(f);
  const all = rows.map((_, i) => i);
  const sample = all.filter((i) => i % 5 === 0);
  let best = null;
  for (let lat = 46; lat <= 56.001; lat += 0.02) {
    const s = latScore(lat, rows, sample);
    if (!best || s < best.s) best = { lat, s };
  }
  let fine = { lat: best.lat, s: best.s };
  for (let lat = best.lat - 0.04; lat <= best.lat + 0.0401; lat += 0.002) {
    const s = latScore(+lat.toFixed(4), rows, all);
    if (s < fine.s) fine = { lat: +lat.toFixed(4), s };
  }
  const s = solar(fine.lat, rows, all);
  const r = rms(s.sunrise.map((v, i) => v - rows[i].sunrise));
  const m = rms(s.sunset.map((v, i) => v - rows[i].maghrib));
  const a = rms(s.asr.map((v, i) => v - rows[i].asr));
  const f2 = (x) => (x / 60).toFixed(2);
  out[tag] = { lat: fine.lat, rms_min: { sunrise: f2(r.rms), maghrib: f2(m.rms), asr: f2(a.rms) } };
  console.log(`${tag.padEnd(12)} lat ${fine.lat.toFixed(3)}  rms sunrise ${f2(r.rms)} maghrib ${f2(m.rms)} asr ${f2(a.rms)}`);
  fs.writeFileSync('fit/recovered-lat.json', JSON.stringify(out, null, 1));
}
