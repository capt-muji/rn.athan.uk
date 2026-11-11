/* Fit adhan 4.4.6 against each captured mawaqit capital table.
   Publisher point and zone come from the page's own conf; no clock is read. */
const fs = require('fs');
const path = require('path');
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');

const HERE = __dirname;
const DATA = path.join(HERE, 'data');
const CAP = path.join(HERE, 'captures');

const MANIFEST = fs.readFileSync(path.join(HERE, 'manifest.tsv'), 'utf8').trim().split('\n').slice(1)
  .map((l) => l.split('\t')).filter((f) => f[6] === 'PASS');

function confOf(cc) {
  const f = fs.readdirSync(CAP).find((x) => x.startsWith('mawaqit_' + cc.toLowerCase() + '_') && x.endsWith('.html'));
  if (!f) return null;
  const t = fs.readFileSync(path.join(CAP, f), 'utf8');
  const lat = /latitude = ([\d.-]+)/.exec(t);
  const lon = /longitude = ([\d.-]+)/.exec(t);
  const tz = /"timezone":"([^"]+)"/.exec(t);
  return lat && lon && tz ? { lat: +lat[1], lon: +lon[1], tz: tz[1].replace(/\\\//g, '/') } : null;
}

const TZ_ALIAS = { 'Indian/Comoros': 'Africa/Nairobi', 'Atlantic/Cape_Verde': 'Atlantic/Cape_Verde',
  'Pacific/Tarawa': 'Pacific/Tarawa', 'Indian/Antananarivo': 'Africa/Nairobi', 'Indian/Mahe': 'Asia/Dubai' };
function tzOffsetMin(tz, y, m, d) {
  tz = TZ_ALIAS[tz] || tz;
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const parts = Object.fromEntries(dtf.formatToParts(new Date(Date.UTC(y, m - 1, d, 12))).map((p) => [p.type, p.value]));
  const asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute);
  return Math.round((asUTC - Date.UTC(y, m - 1, d, 12)) / 60000);
}

function localMins(date, tz) {
  const y = date.getUTCFullYear(), m = date.getUTCMonth() + 1, d = date.getUTCDate();
  const off = tzOffsetMin(tz, y, m, d);
  let t = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60 + off;
  if (t < 0) t += 1440;
  if (t >= 1440) t -= 1440;
  return t;
}

function build(coords, tz, iso, params) {
  const [y, m, d] = iso.split('-').map(Number);
  return new adhan.PrayerTimes(new adhan.Coordinates(coords.lat, coords.lon),
    new Date(Date.UTC(y, m - 1, d, 12)), params);
}

function median(a) { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; }

function score(rows, coords, tz, params, key) {
  const res = [];
  for (const [iso, r] of Object.entries(rows)) {
    const pub = r[key];
    if (!pub) continue;
    const [ph, pm] = pub.split(':').map(Number);
    const pt = build(coords, tz, iso, params);
    const dt = key === 'asr' ? pt.asr : pt[key];
    res.push({ pub: ph * 60 + pm, tv: localMins(dt, tz) });
  }
  const K = median(res.map((x) => x.pub - x.tv));
  let exact = 0, w1 = 0, abs = 0;
  for (const x of res) {
    const dev = x.pub - Math.round(x.tv + K);
    if (dev === 0) exact++;
    if (Math.abs(dev) <= 1) w1++;
    abs += Math.abs(x.pub - x.tv - K);
  }
  return { K: +K.toFixed(2), exact, within1: w1, n: res.length,
    exactPct: +(100 * exact / res.length).toFixed(1), w1Pct: +(100 * w1 / res.length).toFixed(1),
    meanAbs: +(abs / res.length).toFixed(2) };
}

const CAPS = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(HERE, 'data', 'capitals.json'), 'utf8'))
  .map((c) => [c[0], { lat: c[4], lon: c[5], tz: c[6] }]));

function fitCity(cc, city, rows) {
  const conf = confOf(cc);
  if (!conf) return { cc, city, error: 'no conf coords' };
  const cityPt = CAPS[cc];
  const c = cityPt;
  const dLat = Math.abs(conf.lat - cityPt.lat), dLon = Math.abs(conf.lon - cityPt.lon);
  let best = null;
  for (const rule of [adhan.HighLatitudeRule.MiddleOfTheNight, adhan.HighLatitudeRule.SeventhOfTheNight,
    adhan.HighLatitudeRule.TwilightAngle]) {
    for (let fa = 10; fa <= 20.001; fa += 0.25) {
      const p = new adhan.CalculationParameters('Other', fa, 18);
      p.highLatitudeRule = rule; p.rounding = adhan.Rounding.None;
      const s = score(rows, c, c.tz, p, 'fajr');
      if (!best || s.w1Pct > best.s.w1Pct || (s.w1Pct === best.s.w1Pct && s.meanAbs < best.s.meanAbs)) {
        best = { rule, fa: +fa.toFixed(2), s };
      }
    }
  }
  const madhab = adhan.Madhab.Shafi;
  const p = new adhan.CalculationParameters('Other', best.fa, 18);
  p.madhab = madhab; p.highLatitudeRule = best.rule; p.rounding = adhan.Rounding.None;
  let bestIsha = null;
  for (let ia = 10; ia <= 20.001; ia += 0.25) {
    const q = new adhan.CalculationParameters('Other', best.fa, +ia.toFixed(1));
    q.madhab = madhab; q.highLatitudeRule = best.rule; q.rounding = adhan.Rounding.None;
    const s = score(rows, c, c.tz, q, 'isha');
    if (!bestIsha || s.w1Pct > bestIsha.s.w1Pct || (s.w1Pct === bestIsha.s.w1Pct && s.meanAbs < bestIsha.s.meanAbs)) {
      bestIsha = { ia: +ia.toFixed(1), s };
    }
  }
  let q = new adhan.CalculationParameters('Other', best.fa, bestIsha.ia);
  q.madhab = adhan.Madhab.Shafi; q.highLatitudeRule = best.rule; q.rounding = adhan.Rounding.None;
  const asrShafi = score(rows, c, c.tz, q, 'asr');
  const qh = new adhan.CalculationParameters('Other', best.fa, bestIsha.ia);
  qh.madhab = adhan.Madhab.Hanafi; qh.highLatitudeRule = best.rule; qh.rounding = adhan.Rounding.None;
  const asrHanafi = score(rows, c, c.tz, qh, 'asr');
  const asrMadhab = asrHanafi.w1Pct > asrShafi.w1Pct ? 'hanafi' : 'shafi';
  if (asrMadhab === 'hanafi') q = qh;
  const out = { cc, city, coords: c, tz: c.tz, confPoint: conf, confDeltaDeg: +Math.max(dLat, dLon).toFixed(3),
    recipe: { fajrAngle: best.fa, ishaAngle: bestIsha.ia, madhab: asrMadhab,
      highLatitudeRule: String(best.rule), rounding: 'none' },
    prayers: {} };
  for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    out.prayers[k] = score(rows, c, c.tz, q, k);
  }
  const jan = rows['2026-01-15'] || rows['2026-01-10'];
  const jul = rows['2026-07-15'] || rows['2026-07-10'];
  if (jan && jul) {
    const t = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
    out.amplitudeFajrMin = t(jul.fajr) - t(jan.fajr);
    out.amplitudeIshaMin = t(jul.isha) - t(jan.isha);
  }
  return out;
}

const fits = [];
for (const f of MANIFEST) {
  const cc = f[0], city = f[1], file = f[7];
  const rows = JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));
  const r = fitCity(cc, city, rows);
  fits.push(r);
  if (r.error) { console.log(cc, city, 'ERR', r.error); continue; }
  const p = r.prayers;
  console.log(`${cc} ${city.padEnd(13)} recipe fajr=${r.recipe.fajrAngle} isha=${r.recipe.ishaAngle} ${r.recipe.madhab} ${r.recipe.highLatitudeRule.split('.').pop()} | ` +
    ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map((k) => `${k[0]}:${p[k].exactPct}/${p[k].w1Pct}`).join(' ') +
    ` | amp ${r.amplitudeFajrMin}/${r.amplitudeIshaMin}`);
}
fs.writeFileSync(path.join(DATA, 'fits.json'), JSON.stringify(fits, null, 1));
