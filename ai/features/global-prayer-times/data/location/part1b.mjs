// R14 part 1b: the display-minute question. A shift under 0.5 min can still cross a
// rounding boundary, so the honest measure is: over a whole year, what fraction of the
// 365 * 6 DISPLAYED HH:mm values change when the position moves by N km?
import { Coordinates, PrayerTimes, CalculationMethod, HighLatitudeRule, Rounding, Madhab } from './lib.mjs';
import { kmToDegLat, kmToDegLon, KEYS, CITIES, table } from './lib.mjs';

function p() {
  const q = CalculationMethod.MuslimWorldLeague();
  q.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
  q.rounding = Rounding.Nearest; // what the app would display
  q.madhab = Madhab.Shafi;
  return q;
}
const PARAMS = p();

function yearMinutes(lat, lon) {
  const res = [];
  const d = new Date(Date.UTC(2026, 0, 1, 12));
  for (let i = 0; i < 365; i++) {
    const t = new PrayerTimes(new Coordinates(lat, lon), new Date(d.getTime() + i * 86400000), PARAMS);
    for (const k of KEYS) {
      const v = t[k];
      res.push(v instanceof Date && !Number.isNaN(v.getTime()) ? Math.round(v.getTime() / 60000) : null);
    }
  }
  return res;
}

const DIST = [1, 2, 5, 10, 20, 50, 100, 500];
const out = [];
const say = (s = '') => out.push(s);

say('# R14 part 1b: displayed-minute changes over a whole year');
say('');
say('adhan@4.4.6, MWL, SeventhOfTheNight, rounding=Nearest (what the app shows). 2026, 365 days,');
say('6 times per day = 2190 displayed values per position. The position is moved to 8 bearings at each');
say('radius; the figure is the MAXIMUM over those 8 of the percentage of the 2190 values whose displayed');
say('HH:mm differs from the reference position. null values are excluded from both sides.');
say('');
{
  const rows = [];
  for (const [cname, clat, clon] of CITIES) {
    const base = yearMinutes(clat, clon);
    const cells = DIST.map((km) => {
      let worst = 0;
      for (let b = 0; b < 8; b++) {
        const th = (b * Math.PI) / 4;
        const alt = yearMinutes(clat + kmToDegLat(km * Math.cos(th)), clon + kmToDegLon(km * Math.sin(th), clat));
        let diff = 0;
        let n = 0;
        for (let i = 0; i < base.length; i++) {
          if (base[i] === null || alt[i] === null) continue;
          n++;
          if (base[i] !== alt[i]) diff++;
        }
        const pct = n ? (100 * diff) / n : 0;
        if (pct > worst) worst = pct;
      }
      return worst.toFixed(1);
    });
    rows.push([cname, clat.toFixed(2), ...cells]);
  }
  say(table(['city', 'lat', ...DIST.map((k) => `${k} km`)], rows));
}
say('');
say('## Worst single displayed-minute error, same sweep');
say('');
say('The largest absolute difference in displayed minutes seen anywhere in the year, over 8 bearings.');
say('');
{
  const rows = [];
  for (const [cname, clat, clon] of CITIES) {
    const base = yearMinutes(clat, clon);
    const cells = DIST.map((km) => {
      let worst = 0;
      for (let b = 0; b < 8; b++) {
        const th = (b * Math.PI) / 4;
        const alt = yearMinutes(clat + kmToDegLat(km * Math.cos(th)), clon + kmToDegLon(km * Math.sin(th), clat));
        for (let i = 0; i < base.length; i++) {
          if (base[i] === null || alt[i] === null) continue;
          const dd = Math.abs(base[i] - alt[i]);
          if (dd > worst) worst = dd;
        }
      }
      return String(worst);
    });
    rows.push([cname, clat.toFixed(2), ...cells]);
  }
  say(table(['city', 'lat', ...DIST.map((k) => `${k} km`)], rows));
}
say('');
console.log(out.join('\n'));
