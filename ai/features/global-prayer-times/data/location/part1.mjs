// R14 part 1: how far does a prayer time move per unit of position error?
// Measured with adhan@4.4.6, MWL angles, SeventhOfTheNight, Rounding.None.
// Everything is computed on UTC instants, so no timezone enters the measurement.
import { times, deltaMinutes, kmToDegLat, kmToDegLon, KEYS, DATES, DIST_KM, LAT_BAND, CITIES, table, fmt, KM_PER_DEG_LAT } from './lib.mjs';

const out = [];
const say = (s = '') => out.push(s);

say('# R14 part 1: position sensitivity of a prayer time');
say('');
say('adhan@4.4.6, MuslimWorldLeague(), highLatitudeRule=SeventhOfTheNight, madhab=Shafi, rounding=None.');
say(`km per degree of latitude = ${KM_PER_DEG_LAT.toFixed(4)}`);
say('');

// ---------------------------------------------------------------- 1A analytic
say('## 1A. Longitude is exactly a clock offset. Analytic, then confirmed.');
say('');
say('4 minutes of clock per degree of longitude. So minutes of shift per km east is 4/(111.195*cos(lat)).');
say('');
{
  const rows = LAT_BAND.map((lat) => {
    const kmPerDeg = KM_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
    const minPerKm = 4 / kmPerDeg;
    const kmFor30s = 0.5 / minPerKm;
    const kmFor1min = 1 / minPerKm;
    return [String(lat), kmPerDeg.toFixed(1), minPerKm.toFixed(4), kmFor30s.toFixed(1), kmFor1min.toFixed(1)];
  });
  say(table(['lat deg', 'km per deg lon', 'min per km east', 'km for 0.5 min', 'km for 1.0 min'], rows));
}
say('');

// ------------------------------------------------- 1B measured, longitude only
say('## 1B. Measured east-west shift, per prayer, confirming the clock model');
say('');
say('London 51.5074N. Position moved EAST by the distance shown. Minutes of shift, signed (negative = earlier).');
say('');
{
  const lat = 51.5074;
  const lon = -0.1278;
  for (const [dname, date] of DATES) {
    const base = times(lat, lon, date);
    const rows = DIST_KM.map((km) => {
      const d = deltaMinutes(base, times(lat, lon + kmToDegLon(km, lat), date));
      return [String(km), ...KEYS.map((k) => fmt(d[k], 2))];
    });
    say(`### ${dname}`);
    say('');
    say(table(['km east', ...KEYS], rows));
    say('');
  }
}

// -------------------------------------------------- 1C measured, latitude only
say('## 1C. Measured north-south shift, per prayer');
say('');
say('Position moved NORTH by the distance shown. Longitude fixed, so Dhuhr cannot move at all.');
say('Minutes of shift, signed. `null` = the prayer has no solution at that position and date.');
say('');
for (const [dname, date] of DATES) {
  say(`### ${dname}`);
  say('');
  const rows = [];
  for (const lat of LAT_BAND) {
    const base = times(lat, 0, date);
    for (const km of DIST_KM) {
      const d = deltaMinutes(base, times(lat + kmToDegLat(km), 0, date));
      rows.push([String(lat), String(km), ...KEYS.map((k) => fmt(d[k], 2))]);
    }
  }
  say(table(['lat', 'km north', ...KEYS], rows));
  say('');
}

// --------------------------------------- 1D worst case over all 8 compass dirs
say('## 1D. Worst case over eight compass directions, which is what a positioning error actually is');
say('');
say('For each radius, the position is moved to 8 bearings at that distance and the largest absolute');
say('shift of any of the six times is reported, with the prayer that produced it. Max over all four dates.');
say('');
{
  const rows = [];
  for (const [cname, clat, clon] of CITIES) {
    const cells = [];
    for (const km of DIST_KM) {
      let worst = 0;
      let who = '';
      for (const [, date] of DATES) {
        const base = times(clat, clon, date);
        for (let b = 0; b < 8; b++) {
          const th = (b * Math.PI) / 4;
          const dLat = kmToDegLat(km * Math.cos(th));
          const dLon = kmToDegLon(km * Math.sin(th), clat);
          const d = deltaMinutes(base, times(clat + dLat, clon + dLon, date));
          for (const k of KEYS) {
            if (d[k] === null) continue;
            if (Math.abs(d[k]) > worst) {
              worst = Math.abs(d[k]);
              who = k;
            }
          }
        }
      }
      cells.push(`${worst.toFixed(1)} ${who}`);
    }
    rows.push([cname, clat.toFixed(2), ...cells]);
  }
  say(table(['city', 'lat', ...DIST_KM.map((k) => `${k} km`)], rows));
}
say('');

// -------------------------------- 1E the direct answer: radius for sub-minute
say('## 1E. The direct answer: what radius keeps every prayer inside a tolerance');
say('');
say('Binary search on the radius at which the worst of the six times over 8 bearings and all four dates');
say('first exceeds the tolerance. Reported in km.');
say('');
{
  const tol = [0.5, 1, 2, 5];
  const worstAt = (clat, clon, km) => {
    let worst = 0;
    for (const [, date] of DATES) {
      const base = times(clat, clon, date);
      for (let b = 0; b < 16; b++) {
        const th = (b * Math.PI) / 8;
        const d = deltaMinutes(
          base,
          times(clat + kmToDegLat(km * Math.cos(th)), clon + kmToDegLon(km * Math.sin(th), clat), date)
        );
        for (const k of KEYS) {
          if (d[k] !== null && Math.abs(d[k]) > worst) worst = Math.abs(d[k]);
        }
      }
    }
    return worst;
  };
  const rows = [];
  for (const [cname, clat, clon] of CITIES) {
    const cells = tol.map((t) => {
      let lo = 0;
      let hi = 2000;
      if (worstAt(clat, clon, hi) <= t) return '>2000';
      for (let i = 0; i < 32; i++) {
        const mid = (lo + hi) / 2;
        if (worstAt(clat, clon, mid) <= t) lo = mid;
        else hi = mid;
      }
      return lo.toFixed(1);
    });
    rows.push([cname, clat.toFixed(2), ...cells]);
  }
  say(table(['city', 'lat', ...tol.map((t) => `<= ${t} min`)], rows));
}
say('');

// -------------------------------- 1F per-prayer radius, the asymmetry answer
say('## 1F. Per-prayer radius for 0.5 min and 1 min, which shows the asymmetry');
say('');
{
  for (const tol of [0.5, 1]) {
    say(`### tolerance ${tol} min`);
    say('');
    const rows = [];
    for (const [cname, clat, clon] of CITIES) {
      const cells = KEYS.map((k) => {
        const worstK = (km) => {
          let w = 0;
          for (const [, date] of DATES) {
            const base = times(clat, clon, date);
            if (base[k] === null) continue;
            for (let b = 0; b < 16; b++) {
              const th = (b * Math.PI) / 8;
              const d = deltaMinutes(
                base,
                times(clat + kmToDegLat(km * Math.cos(th)), clon + kmToDegLon(km * Math.sin(th), clat), date)
              );
              if (d[k] !== null && Math.abs(d[k]) > w) w = Math.abs(d[k]);
            }
          }
          return w;
        };
        let lo = 0;
        let hi = 3000;
        if (worstK(hi) <= tol) return '>3000';
        for (let i = 0; i < 30; i++) {
          const mid = (lo + hi) / 2;
          if (worstK(mid) <= tol) lo = mid;
          else hi = mid;
        }
        return lo.toFixed(0);
      });
      rows.push([cname, clat.toFixed(2), ...cells]);
    }
    say(table(['city', 'lat', ...KEYS], rows));
    say('');
  }
}

// --------------------- 1G decompose: pure NS at fixed lon vs pure EW
say('## 1G. Decomposition at 100 km, pure north-south against pure east-west');
say('');
say('Max absolute minutes over the four dates. NS holds longitude, so Dhuhr is exactly 0.');
say('');
{
  const rows = [];
  for (const [cname, clat, clon] of CITIES) {
    const ns = {};
    const ew = {};
    for (const k of KEYS) {
      ns[k] = 0;
      ew[k] = 0;
    }
    for (const [, date] of DATES) {
      const base = times(clat, clon, date);
      for (const sgn of [1, -1]) {
        const dn = deltaMinutes(base, times(clat + sgn * kmToDegLat(100), clon, date));
        const de = deltaMinutes(base, times(clat, clon + sgn * kmToDegLon(100, clat), date));
        for (const k of KEYS) {
          if (dn[k] !== null) ns[k] = Math.max(ns[k], Math.abs(dn[k]));
          if (de[k] !== null) ew[k] = Math.max(ew[k], Math.abs(de[k]));
        }
      }
    }
    rows.push([cname, clat.toFixed(2), 'NS', ...KEYS.map((k) => ns[k].toFixed(2))]);
    rows.push(['', '', 'EW', ...KEYS.map((k) => ew[k].toFixed(2))]);
  }
  say(table(['city', 'lat', 'axis', ...KEYS], rows));
}
say('');

console.log(out.join('\n'));
