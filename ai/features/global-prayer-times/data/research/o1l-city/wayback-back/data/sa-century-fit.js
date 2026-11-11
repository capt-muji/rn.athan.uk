// O1l-B1 Saudi century fit: s1's exact recipe replicated, TZ=Asia/Riyadh (run with TZ env).
// Recipe: fajr 18.5, isha = maghrib + 90 (+120 in Hijri month 9), offsets +1 0 +1 +1 +1 +1,
// sunrise floor(raw), prayers floor(raw+1) [and ceil scored for the single-formulation check].
const fs = require('fs');
const path = require('path');
const A = require(path.join(process.env.HOME, 'athan-gitree/census/adhan-build/node_modules/adhan'));

const CAP = path.join(__dirname, '..', 'captures');
const DEEP1 = path.join(process.env.HOME, 'athan-gitree/census/o1k-wide/deep1/captures');
const S1 = path.join(process.env.HOME, 'athan-gitree/census/s1-saudi');

const CITIES = {
  makkah: { lat: 21.4225, lng: 39.8262 },
  medina: { lat: 24.4672, lng: 39.6111 },
};

function tmin(s) { const [h, m] = s.split(':').map(Number); return h * 60 + m; }

function raws(lat, lng, y, m, d, ishaInterval) {
  const p = new A.CalculationParameters('Other', 18.5, 18, ishaInterval);
  p.rounding = A.Rounding.None;
  p.madhab = A.Madhab.Shafi;
  p.highLatitudeRule = A.HighLatitudeRule.MiddleOfTheNight;
  const pt = new A.PrayerTimes(new A.Coordinates(lat, lng), new Date(y, m - 1, d), p);
  const o = {};
  for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    const s = Math.round(pt[k].getTime() / 1000);
    o[k] = ((((s % 86400) + 86400) % 86400) / 60 + 180) % 1440;
  }
  return o;
}

function predict(lat, lng, y, m, d, ramadan, mode) {
  const iv = ramadan ? 120 : 90;
  const r = raws(lat, lng, y, m, d, iv);
  const ceil = (x) => Math.ceil(x - 1e-9);
  const floor = (x) => Math.floor(x + 1e-9);
  const R = mode === 'floor' ? floor : ceil;
  return {
    fajr: R(r.fajr + 1),
    sunrise: floor(r.sunrise),
    dhuhr: R(r.dhuhr + 1),
    asr: R(r.asr + 1),
    maghrib: R(r.maghrib + 1),
    isha: R(r.isha + 1),
  };
}

function fitFile(file, city, label) {
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { lat, lng } = city;
  let gaps = 0;
  for (let i = 1; i < rows.length; i++) {
    if ((new Date(rows[i].date) - new Date(rows[i - 1].date)) !== 86400000) gaps++;
  }
  const out = { label, rows: rows.length, gaps, ivBreaks: [] };
  const modes = { floor: { exact: 0, w1: 0, worst: 0, n: 0 }, ceil: { exact: 0, w1: 0, worst: 0, n: 0 } };
  let fajrMin = 1e9, fajrMax = -1e9, ishaMidnight = 0;
  let offSwitch = 0, offViol = 0;
  for (const r of rows) {
    const [Y, Mo, D] = r.date.slice(0, 10).split('-').map(Number);
    const ram = r.hijriDate.month === 9;
    const iv = (tmin(r.prayerTimes.isha) - tmin(r.prayerTimes.maghrib) + 1440) % 1440;
    if (ram && iv !== 120) offViol++;
    if (!ram && iv !== 90) offViol++;
    if (iv !== 90 && iv !== 120) out.ivBreaks.push(`${r.date.slice(0, 10)} iv=${iv}`);
    const p = predict(lat, lng, Y, Mo, D, ram, 'floor');
    const c = predict(lat, lng, Y, Mo, D, ram, 'ceil');
    const got = { fajr: tmin(r.prayerTimes.fajr), sunrise: tmin(r.prayerTimes.sunrise), dhuhr: tmin(r.prayerTimes.dhuhr), asr: tmin(r.prayerTimes.asr), maghrib: tmin(r.prayerTimes.maghrib), isha: tmin(r.prayerTimes.isha) };
    for (const k of Object.keys(got)) {
      const df = Math.abs(got[k] - p[k]);
      const dc = Math.abs(got[k] - c[k]);
      modes.floor.n++;
      if (df === 0) modes.floor.exact++;
      if (df <= 1) modes.floor.w1++;
      if (df > modes.floor.worst) modes.floor.worst = df;
      modes.ceil.n++;
      if (dc === 0) modes.ceil.exact++;
      if (dc <= 1) modes.ceil.w1++;
      if (dc > modes.ceil.worst) modes.ceil.worst = dc;
    }
    if (got.fajr < fajrMin) fajrMin = got.fajr;
    if (got.fajr > fajrMax) fajrMax = got.fajr;
    if (got.isha >= 1440) ishaMidnight++;
  }
  const pc = (x, n) => (100 * x / n).toFixed(1);
  console.log(`${label} n=${rows.length} gaps=${gaps} | floor exact ${pc(modes.floor.exact, modes.floor.n)} w1 ${pc(modes.floor.w1, modes.floor.n)} worst ${modes.floor.worst} | ceil exact ${pc(modes.ceil.exact, modes.ceil.n)} w1 ${pc(modes.ceil.w1, modes.ceil.n)} worst ${modes.ceil.worst} | ivViol ${offViol} ivBreaks ${out.ivBreaks.length} | fajr span ${(fajrMax - fajrMin).toFixed(0)}min`);
  if (out.ivBreaks.length) console.log('  breaks:', out.ivBreaks.slice(0, 5).join(', '));
}

const jobs = [];
for (const f of fs.readdirSync(CAP).filter(f => /^sa-(makkah|medina)-hijri-\d+\.json$/.test(f))) {
  const m = f.match(/sa-(\w+)-hijri-(\d+)/);
  jobs.push([path.join(CAP, f), CITIES[m[1]], `${m[1]} ${m[2]}H (B1 new)`]);
}
for (const f of fs.readdirSync(DEEP1).filter(f => /^sa-hijri-\d+\.json$/.test(f))) {
  const yh = f.match(/sa-hijri-(\d+)/)[1];
  jobs.push([path.join(DEEP1, f), CITIES.makkah, `makkah ${yh}H (deep1 fwd)`]);
}
for (const f of fs.readdirSync(S1).filter(f => /^\d{4}_21-4225_39-8262\.json$/.test(f))) {
  const yh = f.match(/^(\d{4})_/)[1];
  jobs.push([path.join(S1, f), CITIES.makkah, `makkah ${yh}H (s1 held)`]);
}
jobs.sort((a, b) => a[2].localeCompare(b[2]));
for (const [f, c, l] of jobs) fitFile(f, c, l);
