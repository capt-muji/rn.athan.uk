// Does the engine evaluate the sun once per day? Compare h0 wobble when the
// declination is taken at the event, at 0h UT, at 12h UT, and at local noon.
const L = require('./fitlib');
const fs = require('fs');
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const YEAR = 2028;

function sun(jd) {
  const D = jd - 2451545.0;
  const g = (357.529 + 0.98560028 * D) * D2R;
  const q = 280.459 + 0.98564736 * D;
  const Ls = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * D2R;
  const e = (23.439 - 0.00000036 * D) * D2R;
  const dec = Math.asin(Math.sin(e) * Math.sin(Ls)) * R2D;
  let ra = Math.atan2(Math.cos(e) * Math.sin(Ls), Math.cos(Ls)) * R2D;
  ra = ((ra % 360) + 360) % 360;
  let eqt = q - ra;
  eqt = (((eqt + 180) % 360) + 360) % 360 - 180;
  return { dec, eqt: eqt * 4 };
}
const jd0 = date => date.getTime() / 86400000 + 2440587.5;

const META = JSON.parse(fs.readFileSync(__dirname + '/regions.json', 'utf8'));
const VARIANTS = { event: null, h0: 0, h12: 0.5, h18: 0.75, prev0: -1 };

for (const f of process.argv.slice(2)) {
  const id = f.match(/region_(\d+)\./)[1];
  const m = META[id] || { tz: 120 };
  const table = L.parseTable(f);
  const dates = Array.from({ length: table.length }, (_, i) => L.doyDate(i, true, YEAR));
  const row = { id: +id, country: m.country };
  for (const [name, frac] of Object.entries(VARIANTS)) {
    // declination used for day i
    const decOf = i => {
      if (frac == null) {
        const noon = (table[i].Sunrise + table[i].Maghrib) / 2;
        return sun(jd0(dates[i]) + (noon - m.tz) / 1440).dec;
      }
      return sun(jd0(dates[i]) + frac).dec;
    };
    const dec = dates.map((_, i) => decOf(i));
    let best = { phi: 0, sd: 1e9, h0: 0 };
    for (let p = 5; p <= 62; p += 0.05) {
      const s = [];
      for (let i = 0; i < table.length; i++) {
        const noon = (table[i].Sunrise + table[i].Maghrib) / 2;
        const H = ((noon - table[i].Sunrise) / 4) * D2R;
        const pp = p * D2R, d = dec[i] * D2R;
        const v = Math.sin(pp) * Math.sin(d) + Math.cos(pp) * Math.cos(d) * Math.cos(H);
        s.push(Math.asin(Math.max(-1, Math.min(1, v))) * R2D);
      }
      const mu = L.mean(s);
      const sd = L.rms(s.map(x => x - mu));
      if (sd < best.sd) best = { phi: p, sd, h0: mu };
    }
    row[name] = { phi: +best.phi.toFixed(2), h0: +best.h0.toFixed(3), sd: +best.sd.toFixed(3) };
  }
  console.log(JSON.stringify(row));
}
