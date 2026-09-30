// R14 part 1c: the Tromso outliers isolated. Tromso's huge displayed-minute jumps are not
// position sensitivity: they are adhan's own Asr approximation runaway (R7 measured 2,279 min)
// and the polar-day Maghrib discontinuity, both of which flip on a hair of latitude.
// This run reports the worst shift with those discontinuities separated out.
import { Coordinates, PrayerTimes, CalculationMethod, HighLatitudeRule, Rounding, Madhab } from './lib.mjs';
import { kmToDegLat, kmToDegLon, KEYS, CITIES, table } from './lib.mjs';

const q = CalculationMethod.MuslimWorldLeague();
q.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
q.rounding = Rounding.Nearest;
q.madhab = Madhab.Shafi;

function yearMinutes(lat, lon) {
  const res = [];
  const d0 = Date.UTC(2026, 0, 1, 12);
  for (let i = 0; i < 365; i++) {
    const t = new PrayerTimes(new Coordinates(lat, lon), new Date(d0 + i * 86400000), q);
    for (const k of KEYS) {
      const v = t[k];
      res.push(v instanceof Date && !Number.isNaN(v.getTime()) ? Math.round(v.getTime() / 60000) : null);
    }
  }
  return res;
}

const DIST = [1, 10, 50, 100, 500];
const out = [];
const say = (s = '') => out.push(s);

say('# R14 part 1c: displayed-minute error with library discontinuities separated');
say('');
say('Same sweep as part 1b. A shift over 60 displayed minutes from a position move is not position');
say('sensitivity: it is a solver discontinuity. Those are counted separately.');
say('');
const rows = [];
for (const [cname, clat, clon] of CITIES) {
  const base = yearMinutes(clat, clon);
  const cells = [];
  for (const km of DIST) {
    let worst = 0;
    let disc = 0;
    for (let b = 0; b < 8; b++) {
      const th = (b * Math.PI) / 4;
      const alt = yearMinutes(clat + kmToDegLat(km * Math.cos(th)), clon + kmToDegLon(km * Math.sin(th), clat));
      for (let i = 0; i < base.length; i++) {
        if (base[i] === null || alt[i] === null) continue;
        const dd = Math.abs(base[i] - alt[i]);
        if (dd > 60) {
          disc++;
          continue;
        }
        if (dd > worst) worst = dd;
      }
    }
    cells.push(disc ? `${worst} (+${disc} disc)` : String(worst));
  }
  rows.push([cname, clat.toFixed(2), ...cells]);
}
say(table(['city', 'lat', ...DIST.map((k) => `${k} km`)], rows));
say('');
console.log(out.join('\n'));
