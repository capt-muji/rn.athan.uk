/* Verify the norislam grid's stated 15/15 Hanafi basis at every provincial capital.
 *
 * Engine: adhan 4.4.6, Rounding.None, TZ pinned Asia/Shanghai, dates built from the
 * printed capture strings only (never the real clock).
 *
 * The grid prints a 12-hour clock with no meridiem, so the afternoon columns are
 * normalised by clock window before comparison: noon 11:00-15:00, asr 12:00-20:00,
 * sunset 16:00-22:00, isha 17:00-24:00, and any printed hour at or below 11 in those
 * four columns is read as afternoon. Fajr and sunrise are morning columns.
 *
 * adhan substitutes a night-fraction time when an angle time is unreachable; at China
 * latitudes the 15 deg times are reachable, and MiddleOfTheNight widens the guard so
 * the comparison sees the pure angle computation rather than the guard.
 */
const fs = require('fs');
const path = require('path');

const adhan = require(process.env.HOME +
  '/athan-gitree/census/adhan-build/node_modules/adhan');

const DATA = path.join(__dirname, 'data');
// Solar noon in eastern China prints as 11:57-12:00, so the noon window keeps hour 11
// as morning and only a printed hour of 10 or less is read as afternoon.
const PM_FLOOR = { noon: 10, asr: 11, sunset: 11, isha: 11 };

function printedMinutes(hhmm, col) {
  const [h, m] = hhmm.split(':').map(Number);
  const floor = PM_FLOOR[col];
  return (floor !== undefined && h <= floor ? h + 12 : h) * 60 + m;
}
const toMinutes = (d) => d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;

function params(fajrAngle, ishaAngle) {
  const p = new adhan.CalculationParameters();
  p.fajrAngle = fajrAngle;
  p.ishaAngle = ishaAngle;
  p.madhab = adhan.Madhab.Hanafi;
  p.rounding = adhan.Rounding.None;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  return p;
}

function compute(coords, year, month, day, fajrAngle = 15, ishaAngle = 15) {
  const date = new Date(year, month - 1, day, 12, 0, 0);
  const pt = new adhan.PrayerTimes(coords, date, params(fajrAngle, ishaAngle));
  return {
    fajr: toMinutes(pt.fajr), sunrise: toMinutes(pt.sunrise), noon: toMinutes(pt.dhuhr),
    asr: toMinutes(pt.asr), sunset: toMinutes(pt.sunset), isha: toMinutes(pt.isha),
  };
}

const ROUNDERS = { ceil: Math.ceil, floor: Math.floor, nearest: Math.round };

function stats(res, comp, printed) {
  const n = res.length;
  const sorted = [...res].sort((a, b) => a - b);
  const matches = {};
  for (const [name, fn] of Object.entries(ROUNDERS)) {
    matches[name] = res.filter((v, i) => fn(comp[i]) === printed[i]).length;
  }
  const abs = res.map(Math.abs);
  return {
    n,
    mean: Number((res.reduce((a, b) => a + b, 0) / n).toFixed(3)),
    mean_abs: Number((abs.reduce((a, b) => a + b, 0) / n).toFixed(3)),
    rms: Number(Math.sqrt(res.reduce((a, b) => a + b * b, 0) / n).toFixed(3)),
    min: Number(sorted[0].toFixed(2)),
    p05: Number(sorted[Math.floor(n * 0.05)].toFixed(2)),
    p95: Number(sorted[Math.floor(n * 0.95)].toFixed(2)),
    max: Number(sorted[n - 1].toFixed(2)),
    within_half: abs.filter((v) => v < 0.5).length,
    within_one: abs.filter((v) => v <= 1).length,
    within_two: abs.filter((v) => v <= 2).length,
    rounding_matches: matches,
    rounding_verdict: Object.keys(matches).sort((a, b) => matches[b] - matches[a])[0],
  };
}

const COLS = ['fajr', 'sunrise', 'noon', 'asr', 'sunset', 'isha'];
const out = {
  engine: 'adhan 4.4.6',
  rounding: 'none (seconds kept; per-column rounding graded after the fact)',
  tz: 'Asia/Shanghai',
  high_latitude_rule: 'MiddleOfTheNight (widens the substitution guard so the pure ' +
    '15 deg angle stands; at China latitudes no guard binds)',
  params: { fajr: 15, isha: 15, madhab: 'Hanafi', sunrise_sunset: '-0.833 deg' },
  residual: 'printed (24h normalised) minus computed, minutes',
  margin_note: 'the printed columns carry no margins: 日中 is local apparent noon and ' +
    '日没 is geometric sunset, so dhuhr +5 and maghrib +5 live in the prose only',
  years_tested: [2004, 2026],
  cities: {},
};

for (const file of fs.readdirSync(DATA).filter((f) => /^grid_[a-z]+\.json$/.test(f))) {
  const d = JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));
  const coords = new adhan.Coordinates(Number(d.lat), Number(d.lon));
  const rec = { lon: Number(d.lon), lat: Number(d.lat), rows: d.rows.length, years: {} };
  for (const year of [2004, 2026]) {
    const res = {}; const comp = {}; const printed = {};
    for (const r of d.rows) {
      const c = compute(coords, year, r.month, r.day);
      for (const k of COLS) {
        const p = printedMinutes(r[k], k);
        (res[k] = res[k] || []).push(p - c[k]);
        (comp[k] = comp[k] || []).push(c[k]);
        (printed[k] = printed[k] || []).push(p);
      }
    }
    const alt = {};
    for (const r of d.rows) {
      const c18 = compute(coords, year, r.month, r.day, 18, 17);
      (alt.fajr = alt.fajr || []).push(printedMinutes(r.fajr, 'fajr') - c18.fajr);
      (alt.isha = alt.isha || []).push(printedMinutes(r.isha, 'isha') - c18.isha);
    }
    rec.years[year] = {
      at_15_15_hanafi: Object.fromEntries(COLS.map((k) => [k, stats(res[k], comp[k], printed[k])])),
      at_18_17: { fajr: stats(alt.fajr, comp.fajr, printed.fajr),
                  isha: stats(alt.isha, comp.isha, printed.isha) },
    };
  }

  // Measured twilight angles: scan 12.0-20.0 in 0.1 steps on a half-sample of 2004.
  const sample = d.rows.filter((_, i) => i % 2 === 0);
  const scanAngle = (col, base) => {
    let best = { angle: null, mae: Infinity };
    for (let a10 = 120; a10 <= 200; a10 += 1) {
      const angle = a10 / 10;
      const p = params(col === 'fajr' ? angle : 15, col === 'isha' ? angle : 15);
      let sum = 0;
      for (const r of sample) {
        const pt = new adhan.PrayerTimes(coords, new Date(2004, r.month - 1, r.day, 12), p);
        sum += Math.abs(printedMinutes(r[col], col) -
          toMinutes(col === 'fajr' ? pt.fajr : pt.isha));
      }
      const mae = sum / sample.length;
      if (mae < best.mae) best = { angle, mae: Number(mae.toFixed(2)) };
    }
    return { ...best, mae_at_15: base };
  };
  const f15 = (() => {
    let sum = 0;
    for (const r of sample) {
      sum += Math.abs(printedMinutes(r.fajr, 'fajr') - compute(coords, 2004, r.month, r.day).fajr);
    }
    return Number((sum / sample.length).toFixed(2));
  })();
  const i15 = (() => {
    let sum = 0;
    for (const r of sample) {
      sum += Math.abs(printedMinutes(r.isha, 'isha') - compute(coords, 2004, r.month, r.day).isha);
    }
    return Number((sum / sample.length).toFixed(2));
  })();
  rec.measured_angles = { fajr: scanAngle('fajr', f15), isha: scanAngle('isha', i15),
                          sample_rows: sample.length };

  out.cities[d.city] = rec;
  const y = rec.years[2004].at_15_15_hanafi;
  const a = rec.years[2004].at_18_17;
  console.log(
    d.city.padEnd(7) +
    ` fajr m=${y.fajr.mean} rms=${y.fajr.rms} | isha m=${y.isha.mean} rms=${y.isha.rms}` +
    ` | asr m=${y.asr.mean} | noon m=${y.noon.mean} | rise m=${y.sunrise.mean} set m=${y.sunset.mean}` +
    ` || 18/17: fajr +${a.fajr.mean} isha ${a.isha.mean}` +
    ` || angles: fajr ${rec.measured_angles.fajr.angle} (mae ${rec.measured_angles.fajr.mae} vs 15: ${f15})` +
    ` isha ${rec.measured_angles.isha.angle} (mae ${rec.measured_angles.isha.mae} vs 15: ${i15})`
  );
}

fs.writeFileSync(path.join(DATA, 'adhan-verification.json'), JSON.stringify(out, null, 1));
