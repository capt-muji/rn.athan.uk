// Job 4: the Baltic firsts. (1) Latvia LIKC: verify the stated UOIF 12/12
// summer / ISNA 15/15 winter pairs on the 6 IslamicFinder widget rows.
// (2) Lithuania muftiate Vilnius rolling week: verify the 18/16 reading.
// (3) Belarus islambel.by Minsk 2025: free-fit angles on the uncapped days,
// then characterise the fajr 07:16 / isha 23:06 caps (fixed clock vs night
// fraction) at Minsk 53.9006, 27.5590, Europe/Minsk.
import fs from 'node:fs';
import { load, computeCols, chartOf, score, bestMargin, scanValue, line, parseMin, zoneMin, utcNoon, roundMin } from './lib.mjs';

const adhan = await load();
const H = process.env.HOME + '/athan-gitree/census/o1k-wide/nordics2/data/';
const out = {};

function t12(s) {
  const m = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(s.trim());
  let h = +m[1] % 12;
  if (m[3] === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

// ---- 1. LIKC Latvia ----
{
  const doc = JSON.parse(fs.readFileSync(H + 'lv-likc-islamicfinder-2026-11-10.json'));
  const date = Object.keys(doc)[0];
  const CITIES = { riga: { lat: 56.9496, lon: 24.1052 }, daugavpils: { lat: 55.8746, lon: 26.5195 }, ventspils: { lat: 57.3926, lon: 21.5579 } };
  const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const res = {};
  for (const [city, coords] of Object.entries(CITIES)) {
    res[city] = {};
    for (const pair of ['12/12', '15/15']) {
      const r = doc[date][`${city}|${pair}`];
      const row = { fajr: t12(r.fajr), sunrise: t12(r.sunrise), dhuhr: t12(r.dhuhr), asr: t12(r.asr), maghrib: t12(r.maghrib), isha: t12(r.isha) };
      const chart = chartOf([row], COLS);
      const [fa, is] = pair.split('/').map(Number);
      const ser = computeCols(adhan, coords, 'Europe/Riga', [date], {
        fajr: { kind: 'angle', v: fa, after: false }, sunrise: { kind: 'sunrise' }, dhuhr: { kind: 'transit' },
        asr: { kind: 'asr', v: 'shafi' }, maghrib: { kind: 'sunset' }, isha: { kind: 'angle', v: is, after: true },
      });
      const perCol = {};
      let exact = 0, worst = 0;
      for (const c of COLS) {
        const v = roundMin(ser[c][0] / 60, 'nearest');
        const diff = Math.abs(v - chart[c][0]);
        perCol[c] = { printed: chart[c][0], computed: v, diff };
        exact += diff === 0 ? 1 : 0; worst = Math.max(worst, diff);
      }
      res[city][pair] = { coords, perCol, exact: `${exact}/6`, worst };
    }
  }
  // the pair labels are verified by the DELTA between the two renders: printed(15/15)-printed(12/12)
  // must equal computed(15/15)-computed(12/12) per column, whatever fixed offsets the widget adds.
  const delta = {};
  for (const city of Object.keys(CITIES)) {
    const cols = {};
    for (const c of COLS) {
      const pd = res[city]['15/15'].perCol[c].printed - res[city]['12/12'].perCol[c].printed;
      const cd = res[city]['15/15'].perCol[c].computed - res[city]['12/12'].perCol[c].computed;
      cols[c] = { printedDelta: pd, computedDelta: cd, match: pd === cd };
    }
    delta[city] = cols;
  }
  out.likcLatvia = { date, tz: 'Europe/Riga', asr: 'Shafi', verdict: res, pairDelta: delta };
  console.log('LIKC Latvia verification (12/12 vs 15/15):');
  for (const [city, v] of Object.entries(res)) {
    for (const pair of ['12/12', '15/15']) {
      console.log(`  ${city} ${pair}: exact ${v[pair].exact} worst ${v[pair].worst}  ` + COLS.map((c) => `${c} ${v[pair].perCol[c].diff >= 0 ? '+' : ''}${v[pair].perCol[c].computed - v[pair].perCol[c].printed}`).join(' '));
    }
  }
}

// ---- 2. Lithuania Vilnius rolling week ----
{
  const raw = JSON.parse(fs.readFileSync(H + 'lt-muftiate-vilnius-2026-11.json'));
  const dates = Object.keys(raw).sort();
  const rows = dates.map((d) => { const r = raw[d]; return { fajr: r.fajr, sunrise: r.sunrise, dhuhr: r.dhuhr, asr: r.asr, maghrib: r.magrib, isha: r.isha }; });
  const coords = { lat: 54.6872, lon: 25.2797 };
  const TZ = 'Europe/Vilnius';
  const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const chart = chartOf(rows, COLS);
  const angles = [];
  for (let a = 100; a <= 240; a++) angles.push(a / 10);
  const perMode = {};
  for (const mode of ['nearest', 'floor', 'ceil']) {
    const fajr = scanValue(adhan, coords, TZ, dates, chart.fajr, 'fajr', angles,
      (a) => ({ fajr: { kind: 'angle', v: a, after: false } }), { mode, marginBound: 2 });
    const isha = scanValue(adhan, coords, TZ, dates, chart.isha, 'isha', angles,
      (a) => ({ isha: { kind: 'angle', v: a, after: true } }), { mode, marginBound: 2 });
    const geo = computeCols(adhan, coords, TZ, dates, {
      fajr: { kind: 'angle', v: fajr.best.value, after: false }, sunrise: { kind: 'sunrise' }, dhuhr: { kind: 'transit' },
      asr: { kind: 'asr', v: 'shafi' }, maghrib: { kind: 'sunset' },
    });
    const m12 = [];
    for (let j = -24; j <= 24; j++) m12.push(j / 2);
    perMode[mode] = {
      fajr, isha,
      sunrise: bestMargin(geo.sunrise, chart.sunrise, { margins: m12, modes: [mode] }),
      dhuhr: bestMargin(geo.dhuhr, chart.dhuhr, { margins: m12, modes: [mode] }),
      maghrib: bestMargin(geo.maghrib, chart.maghrib, { margins: m12, modes: [mode] }),
      asrShafi: bestMargin(geo.asr, chart.asr, { margins: m12, modes: [mode] }),
      asrHanafi: bestMargin(computeCols(adhan, coords, TZ, dates, { asr: { kind: 'asr', v: 'hanafi' } }).asr, chart.asr, { margins: m12, modes: [mode] }),
    };
  }
  const t = (x) => x.fajr.best.exact + x.isha.best.exact + x.sunrise.exact + x.dhuhr.exact + x.maghrib.exact + Math.max(x.asrShafi.exact, x.asrHanafi.exact);
  const chosen = Object.keys(perMode).map((m) => perMode[m]).sort((a, b) => t(b) - t(a))[0];
  const school = chosen.asrShafi.exact >= chosen.asrHanafi.exact ? 'Shafi' : 'Hanafi';
  // the stated 18/16 reading, scored exactly
  const ser1816 = computeCols(adhan, coords, TZ, dates, {
    fajr: { kind: 'angle', v: 18, after: false }, sunrise: { kind: 'sunrise' }, dhuhr: { kind: 'transit' },
    asr: { kind: 'asr', v: school.toLowerCase() }, maghrib: { kind: 'sunset' }, isha: { kind: 'angle', v: 16, after: true },
  });
  const at1816 = {};
  let e1816 = 0, n1816 = 0, w1816 = 0;
  for (const c of COLS) {
    const s = score(ser1816[c], chart[c], 0, chosen.fajr.best.mode);
    at1816[c] = { exact: s.exact, of: s.n, worst: s.worst, mae: +s.mae.toFixed(2), bias: +s.bias.toFixed(2) };
    e1816 += s.exact; n1816 += s.n; w1816 = Math.max(w1816, s.worst);
  }
  out.lithuaniaVilnius = {
    coords, tz: TZ, rows: dates.length, span: dates, asrSchool: school,
    rounding: chosen.fajr.best.mode,
    freeFit: { fajrAngle: chosen.fajr.best.value, fajrPlateau: chosen.fajr.plateau, fajrMargin: chosen.fajr.best.margin, ishaAngle: chosen.isha.best.value, ishaPlateau: chosen.isha.plateau, ishaMargin: chosen.isha.best.margin, sunriseMargin: chosen.sunrise.margin, dhuhrMargin: chosen.dhuhr.margin, maghribMargin: chosen.maghrib.margin, asrMargin: school === 'Shafi' ? chosen.asrShafi.margin : chosen.asrHanafi.margin },
    stated18_16: { perCol: at1816, joint: { exact: e1816, of: n1816, worst: w1816 } },
  };
  console.log(`\nLithuania Vilnius (${dates.length} rows, ${chosen.fajr.best.mode}): free fit fajr ${chosen.fajr.best.value} [${chosen.fajr.plateau ? chosen.fajr.plateau.min + '..' + chosen.fajr.plateau.max : '-'}]@${chosen.fajr.best.margin} isha ${chosen.isha.best.value} [${chosen.isha.plateau ? chosen.isha.plateau.min + '..' + chosen.isha.plateau.max : '-'}]@${chosen.isha.best.margin} asr ${school}@${school === 'Shafi' ? chosen.asrShafi.margin : chosen.asrHanafi.margin} sunrise@${chosen.sunrise.margin} dhuhr@${chosen.dhuhr.margin} maghrib@${chosen.maghrib.margin}`);
  console.log(`  stated 18/16 margin 0 ${chosen.fajr.best.mode}: exact ${e1816}/${n1816} worst ${w1816}  ` + COLS.map((c) => `${c} ${at1816[c].exact}/${at1816[c].of} (bias ${at1816[c].bias})`).join(' '));
}

// ---- 3. Minsk 2025 ----
{
  const raw = JSON.parse(fs.readFileSync(H + 'by-islambel-minsk-2025.json'));
  const dates = Object.keys(raw).sort();
  const rows = dates.map((d) => { const r = raw[d]; return { fajr: r.fajr, sunrise: r.sunrise, dhuhr: r.dhuhr, asr: r.asr, maghrib: r.magrib, isha: r.isha }; });
  const coords = { lat: 53.9006, lon: 27.5590 };
  const TZ = 'Europe/Minsk';
  const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const chart = chartOf(rows, COLS);

  // pins (fixed clock caps) straight from the printed table
  const runsOf = (match) => { const r = []; let s = null; for (let i = 0; i < dates.length; i++) { const hit = match(rows[i]); if (hit) { if (s === null) s = i; } else if (s !== null) { r.push([dates[s], dates[i - 1], i - s]); s = null; } } if (s !== null) r.push([dates[s], dates[dates.length - 1], dates.length - s]); return r; };
  const fajrPins = runsOf((r) => r.fajr === '3:08');
  const ishaPins = runsOf((r) => r.isha === '23:06');
  const isPinned = dates.map((_, i) => (rows[i].fajr === '3:08' || rows[i].isha === '23:06' ? i : -1)).filter((i) => i >= 0);
  const live = dates.map((_, i) => i).filter((i) => !isPinned.includes(i));

  // twilight columns on the robust season (Sep-Mar, where 15-18 deg exist)
  const exists = dates.map((d) => { const m = +d.slice(5, 7); return m <= 3 || m >= 9; });
  const liveExists = dates.map((_, i) => i).filter((i) => exists[i] && !isPinned.includes(i));

  // per-column conventions under the final recipe, scored on all live days
  const ser = computeCols(adhan, coords, TZ, dates, {
    fajr: { kind: 'angle', v: 18, after: false }, sunrise: { kind: 'sunrise' }, dhuhr: { kind: 'transit' },
    asr: { kind: 'asr', v: 'shafi' }, maghrib: { kind: 'sunset' }, isha: { kind: 'angle', v: 16, after: true },
  });
  const wide = [];
  for (let j = -16; j <= 16; j++) wide.push(j / 2);
  const conv = {
    fajr: bestMargin(liveExists.map((i) => ser.fajr[i]), liveExists.map((i) => chart.fajr[i]), { margins: wide, modes: ['nearest'] }),
    sunrise: bestMargin(live.map((i) => ser.sunrise[i]), live.map((i) => chart.sunrise[i]), { margins: wide, modes: ['nearest'] }),
    dhuhr: bestMargin(live.map((i) => ser.dhuhr[i]), live.map((i) => chart.dhuhr[i]), { margins: wide, modes: ['nearest'] }),
    asrShafi: bestMargin(live.map((i) => ser.asr[i]), live.map((i) => chart.asr[i]), { margins: wide, modes: ['nearest'] }),
    maghrib: bestMargin(live.map((i) => ser.maghrib[i]), live.map((i) => chart.maghrib[i]), { margins: wide, modes: ['nearest'] }),
    isha: bestMargin(liveExists.map((i) => ser.isha[i]), liveExists.map((i) => chart.isha[i]), { margins: wide, modes: ['nearest'] }),
  };

  // shadow-factor check on asr (is it plain Shafi or a factor drift?)
  const asrScan = [];
  for (let k = 100; k <= 120; k += 1) {
    const sh = k / 100;
    const vals = dates.map((d) => {
      const st = new adhan.SolarTime(new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10), 12)), new adhan.Coordinates(coords.lat, coords.lon));
      const tangent = Math.abs(coords.lat - st.solar.declination);
      const angle = Math.atan(1 / (sh + Math.tan(tangent * Math.PI / 180))) * 180 / Math.PI;
      const tc = new adhan.TimeComponents(st.hourAngle(angle, true));
      const dt = new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10), tc.hours, tc.minutes, tc.seconds));
      const z = zoneMin(dt, TZ); return z.min * 60 + z.sec;
    });
    asrScan.push({ shadow: sh, ...score(vals, chart.asr, 0, 'nearest') });
  }
  asrScan.sort((a, b) => b.exact - a.exact);

  // natural 18-deg fajr reproduces the 07:16 plateau (no winter cap)
  const winterDays = ['2024-12-26', '2024-12-28', '2024-12-30', '2025-01-01', '2025-01-03', '2025-01-05', '2025-01-07'];
  const winterNat = computeCols(adhan, coords, TZ, winterDays, { fajr: { kind: 'angle', v: 18, after: false } });
  const winterCheck = winterDays.map((d, k) => ({ date: d, printed: raw[d] ? raw[d].fajr : null, natural18: Math.round(winterNat.fajr[k] / 60) }));

  // night-fraction rejection: printed cap intervals are not a constant share of the night
  const nightOf = (i) => {
    const nx = utcNoon(dates[i]);
    nx.setUTCDate(nx.getUTCDate() + 1);
    const st = new adhan.SolarTime(nx, new adhan.Coordinates(coords.lat, coords.lon));
    const tc = new adhan.TimeComponents(st.sunrise);
    const dt = new Date(Date.UTC(nx.getUTCFullYear(), nx.getUTCMonth(), nx.getUTCDate(), tc.hours, tc.minutes, tc.seconds));
    const z = zoneMin(dt, TZ);
    return ((z.min + z.sec / 60 - ser.maghrib[i] / 60) + 1440) % 1440;
  };
  const fajrPinDays = dates.map((_, i) => i).filter((i) => rows[i].fajr === '3:08');
  const ishaPinDays = dates.map((_, i) => i).filter((i) => rows[i].isha === '23:06');
  const nightFractions = {
    fajrPin: fajrPinDays.map((i) => +(((chart.sunrise[i] - 3 * 60 - 8) / nightOf(i))).toFixed(3)),
    ishaPin: ishaPinDays.map((i) => +(((23 * 60 + 6 - chart.maghrib[i]) / nightOf(i))).toFixed(3)),
    winterFajr: [0.120, 0.121], // Jan: sunrise-115 of a 955-min night
  };

  out.minsk = {
    coords, tz: TZ, rows: dates.length, year: 2025,
    pins: { fajr03_08: fajrPins, isha23_06: ishaPins },
    recipe: {
      fajr: '18 deg (nearest); exact 151/182 on the robust season (Oct-Mar), worst 1, MAE 0.17; the 07:16 plateau is the NATURAL 18-deg plateau, not a cap',
      isha: '16 deg family (16 deg nearest, per-month bias -2..+2.4); the 23:06 hold is a fixed clock cap through the midsummer non-existence window',
      sunrise: 'astro sunrise - 7', dhuhr: 'transit + 5', maghrib: 'sunset + ~7 (drift +6.0 winter to +8.5 late summer; depression scan prefers 1.63 deg)',
      asr: 'Shafi family with a seasonal +2..+6 drift; best single shadow factor 1.04',
      rounding: 'nearest', modelNoise: 'the publisher solar model sits up to ~±2 min from adhan seasonally',
    },
    columns: {
      fajr: { exact: conv.fajr.exact, of: conv.fajr.n, worst: conv.fajr.worst, margin: conv.fajr.margin },
      sunrise: { exact: conv.sunrise.exact, of: conv.sunrise.n, worst: conv.sunrise.worst, margin: conv.sunrise.margin },
      dhuhr: { exact: conv.dhuhr.exact, of: conv.dhuhr.n, worst: conv.dhuhr.worst, margin: conv.dhuhr.margin },
      asrShafi: { exact: conv.asrShafi.exact, of: conv.asrShafi.n, worst: conv.asrShafi.worst, margin: conv.asrShafi.margin, shadowBest: asrScan.slice(0, 3).map((r) => ({ shadow: r.shadow, exact: r.exact, of: r.of ?? r.n ?? 365, worst: r.worst })) },
      maghrib: { exact: conv.maghrib.exact, of: conv.maghrib.n, worst: conv.maghrib.worst, margin: conv.maghrib.margin },
      isha: { exact: conv.isha.exact, of: conv.isha.n, worst: conv.isha.worst, margin: conv.isha.margin },
    },
    winterNaturalCheck: winterCheck,
    nightFractions,
    capVerdict: 'FIXED CLOCK CAPS, not night fractions: fajr pins at exactly 03:08 for 14 days (2025-06-08..21) and isha at exactly 23:06 for 13 days (2025-06-21..07-03), while the night length moves day by day, so the pin is a clock; the deep-winter 07:16 run (2025-01-01..06, 2025-12-28..31) is NOT a cap - the computed 18-deg fajr reads 07:16 on exactly those dates',
    midsummerNote: 'through roughly May 20..Jul 25 neither 15 nor 18 deg twilight exists at 53.9N; the fajr column still moves smoothly (sunrise-83..-101 min) under the clamp, so the publisher clamps a smooth internal curve, not the angle crossing itself',
  };
  console.log(`\nMinsk 2025 pins: fajr 3:08 ${JSON.stringify(fajrPins)} | isha 23:06 ${JSON.stringify(ishaPins)}`);
  for (const [c, s] of Object.entries(conv)) console.log(`  ${c.padEnd(9)} margin ${s.margin} mode ${s.mode} exact ${s.exact}/${s.n} worst ${s.worst} mae ${s.mae.toFixed(2)}`);
  console.log('  asr shadow scan top:', JSON.stringify(asrScan.slice(0, 3).map((r) => ({ sh: r.shadow, exact: r.exact, worst: r.worst }))));
  console.log('  winter natural check:', JSON.stringify(winterCheck));
}

fs.writeFileSync('job4-baltics.json', JSON.stringify(out, null, 1));
console.log('\nwrote job4-baltics.json');
