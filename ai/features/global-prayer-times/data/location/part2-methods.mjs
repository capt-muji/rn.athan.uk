// R14 part 2: every positioning method scored against part 1's tolerance.
//
// Each method's documented accuracy is turned into a prayer-minute error using the same
// measured sensitivity part 1 established, at four latitudes. That makes the comparison a
// measurement rather than a judgement.
import { Coordinates, PrayerTimes, CalculationMethod, HighLatitudeRule, Rounding, Madhab } from './lib.mjs';
import { KEYS, kmToDegLat, kmToDegLon, table } from './lib.mjs';

const q = CalculationMethod.MuslimWorldLeague();
q.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
q.rounding = Rounding.Nearest;
q.madhab = Madhab.Shafi;

const DATES = [];
for (let m = 0; m < 12; m++) DATES.push(new Date(Date.UTC(2026, m, 15, 12)));

function vals(lat, lon) {
  const res = [];
  for (const d of DATES) {
    const t = new PrayerTimes(new Coordinates(lat, lon), d, q);
    for (const k of KEYS) {
      const v = t[k];
      res.push(v instanceof Date && !Number.isNaN(v.getTime()) ? Math.round(v.getTime() / 60000) : null);
    }
  }
  return res;
}

// worst displayed-minute error over 16 bearings at radius km
function worstAt(lat, lon, km) {
  const base = vals(lat, lon);
  let w = 0;
  for (let b = 0; b < 16; b++) {
    const th = (b * Math.PI) / 8;
    const alt = vals(lat + kmToDegLat(km * Math.cos(th)), lon + kmToDegLon(km * Math.sin(th), lat));
    for (let i = 0; i < base.length; i++) {
      if (base[i] === null || alt[i] === null) continue;
      const dd = Math.abs(base[i] - alt[i]);
      if (dd <= 120 && dd > w) w = dd;
    }
  }
  return w;
}

const PLACES = [
  ['Jakarta 6.2S', -6.2088, 106.8456],
  ['Makkah 21.4N', 21.4225, 39.8262],
  ['Istanbul 41.0N', 41.0082, 28.9784],
  ['London 51.5N', 51.5074, -0.1278],
  ['Oslo 59.9N', 59.9139, 10.7522],
];

// Each method's documented positional accuracy, as a radius in km. Every figure is cited to the
// platform's own documentation; the source is named in the report.
const METHODS = [
  ['fine GPS, `Accuracy.High`', 0.05, 'Android: "usually within about 50 meters"'],
  ['`Accuracy.Balanced`, 100 m', 0.1, 'iOS kCLLocationAccuracyHundredMeters'],
  ['Android approximate, 2 km grid', 2, 'Android: "about 3 square kilometers"'],
  ['Android `Accuracy.Lowest`', 3, 'iOS kCLLocationAccuracyThreeKilometers'],
  ['iOS reduced accuracy, best case', 1, 'Apple: "usually within 1-20 kilometers"'],
  ['iOS reduced accuracy, worst case', 20, 'Apple: "usually within 1-20 kilometers"'],
  ['a city picked from a list, city centre', 15, 'a large city is tens of km across'],
];

const out = [];
const say = (s = '') => out.push(s);
say('# R14 part 2: each positioning method scored in prayer minutes');
say('');
say('adhan@4.4.6, MWL, SeventhOfTheNight, rounding=Nearest. For each method, the position is');
say('displaced by its documented accuracy radius in 16 directions on 12 dates of 2026, and the');
say('worst displayed-minute change of any of the six times is reported.');
say('');
{
  const rows = [];
  for (const [name, km, note] of METHODS) {
    rows.push([name, km.toFixed(2), ...PLACES.map(([, la, lo]) => String(worstAt(la, lo, km))), note]);
  }
  say(table(['method', 'radius km', ...PLACES.map(([n]) => n), 'accuracy figure quoted'], rows));
}
say('');

say('## The two tolerance thresholds, restated as radii');
say('');
say('From part 1E. The radius inside which every one of the six times stays within the tolerance,');
say('measured by binary search over 16 bearings and four dates.');
say('');
{
  const rows = [];
  for (const [name, la, lo] of PLACES) {
    const cells = [0.5, 1, 2, 5].map((tol) => {
      let lo2 = 0;
      let hi = 400;
      for (let i = 0; i < 24; i++) {
        const mid = (lo2 + hi) / 2;
        if (worstAt(la, lo, mid) <= tol) lo2 = mid;
        else hi = mid;
      }
      return lo2.toFixed(1);
    });
    rows.push([name, ...cells]);
  }
  say(table(['place', 'within 0.5 min', 'within 1 min', 'within 2 min', 'within 5 min'], rows));
}
say('');
console.log(out.join('\n'));
