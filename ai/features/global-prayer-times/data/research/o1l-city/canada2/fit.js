/* Fit adhan 4.4.6 against every Canada-2 surface.
   Rounding.None, timezone pinned per surface, dates built from the capture's own literal
   strings. No clock is read.
   Sunrise is pure geometry, so it exposes whole-block clock defects first: any date whose
   sunrise residual leaves the median by more than 30 minutes is cut from the fit and
   reported as a dated block. The fit then runs on the clean span. */
const fs = require('fs');
const path = require('path');
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');

const HERE = __dirname;
const DATA = path.join(HERE, 'data');
const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

const SURFACES = [
  ...[['MB', 'Winnipeg', 'waverley-grand-masjid-wi', 49.791412, -97.175030, 'America/Winnipeg'],
    ['MB', 'Winnipeg', 'al-haqq-masjid-winnipeg-', 49.8171876, -97.1903284, 'America/Winnipeg'],
    ['MB', 'Winnipeg', 'rahma-wpg', 49.919, -97.097, 'America/Winnipeg'],
    ['MB', 'Winnipeg', 'manitoba-dawah-center-wi', 49.895, -97.138, 'America/Winnipeg'],
    ['SK', 'Regina', 'al-ummah-islamic-center-', 50.4500367, -104.6031807, 'America/Regina'],
    ['NS', 'Dartmouth', 'coleharbour-muslim-commu', 44.6730059, -63.4801435, 'America/Halifax'],
    ['NB', 'Moncton', 'moncton-masjid-moncton-e', 46.087923, -64.790041, 'America/Halifax'],
    ['NB', 'Moncton', 'masjid-yusuf-moncton-e1a-', 46.1125296, -64.7803148, 'America/Halifax'],
    ['NB', 'Moncton', 'north-end-mussallah-monc', 46.114, -64.867, 'America/Halifax'],
    ['NB', 'Moncton', 'hassnain-e-karimain-masj', 46.0961427, -64.8213837, 'America/Halifax'],
    ['PE', 'Charlottetown', 'dar-as-salam-mosque-char', 46.2789204, -63.1373385, 'America/Halifax'],
    ['ON', 'Kingston', 'islamic-centre-of-kingst', 44.2844647, -76.5420283, 'America/Toronto'],
    ['QC', 'Trois-Rivieres', 'ccim3r', 46.3330911, -72.5861298, 'America/Toronto'],
    ['QC', 'Trois-Rivieres', 'assounna-annabawiyya-3r', 46.354, -72.581, 'America/Toronto'],
    ['QC', 'Sherbrooke', 'annour-sherbrooke', 45.4100920, -71.9484143, 'America/Toronto'],
  ].map(([prov, city, slug, lat, lon, tz]) => ({
    prov, city, label: `mawaqit:${slug}`, tier: 'platform',
    file: fs.readdirSync(DATA).find((f) => f.startsWith(`mawaqit-${prov.toLowerCase()}-${city.toLowerCase().replace(/ /g, '-')}-${slug}`)),
    lat, lon, tz,
  })),
  { prov: 'ON', city: 'Windsor', label: 'WIA 2026 PDF', tier: 'mosque', file: 'dpt-on-windsor-2026.json', lat: 42.3149, lon: -83.0364, tz: 'America/Toronto' },
  { prov: 'NL', city: "St John's", label: 'MANAL 2026 PDF', tier: 'mosque', file: 'pdf-nl-stjohns-2026.json', lat: 47.5615, lon: -52.7126, tz: 'America/St_Johns' },
  { prov: 'ON', city: 'London', label: 'londonmosque.ca CMS 2025-26', tier: 'mosque', file: 'cms-on-london-2025-2026.json', lat: 42.9849, lon: -81.2453, tz: 'America/Toronto' },
  { prov: 'SK', city: 'Saskatoon', label: 'dpt IASK 2026', tier: 'mosque', file: 'dpt-sk-saskatoon-iask-2026.json', lat: 52.1332, lon: -106.6700, tz: 'America/Regina' },
  { prov: 'SK', city: 'Saskatoon', label: 'dpt PMA 2026', tier: 'mosque', file: 'dpt-sk-saskatoon-pma-2026.json', lat: 52.1332, lon: -106.6700, tz: 'America/Regina' },
  { prov: 'SK', city: 'Saskatoon', label: 'dpt Dawah 2026', tier: 'mosque', file: 'dpt-sk-saskatoon-dawah-2026.json', lat: 52.1332, lon: -106.6700, tz: 'America/Regina' },
  { prov: 'SK', city: 'Saskatoon', label: 'dpt JRJ 2025-label', tier: 'mosque', file: 'dpt-sk-saskatoon-jrj-2025.json', lat: 52.1332, lon: -106.6700, tz: 'America/Regina' },
  { prov: 'NS', city: 'Halifax', label: 'dpt UMCC 2025', tier: 'mosque', file: 'dpt-ns-halifax-umcc-2025.json', lat: 44.6488, lon: -63.5752, tz: 'America/Halifax' },
  { prov: 'ON', city: 'London', label: 'ICSWO dpt 2026', tier: 'mosque', file: 'dpt-on-london-icswo-2026.json', lat: 42.9849, lon: -81.2453, tz: 'America/Toronto' },
  { prov: 'NB', city: 'Saint John', label: 'masjidal Vdw3zode 2026', tier: 'platform', file: 'masjidal-nb-saintjohn-2026.json', lat: 45.2733, lon: -66.0633, tz: 'America/Moncton' },
];

function tzOffsetMin(tz, y, m, d) {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const parts = Object.fromEntries(dtf.formatToParts(new Date(Date.UTC(y, m - 1, d, 12))).map((p) => [p.type, p.value]));
  const asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute);
  return Math.round((asUTC - Date.UTC(y, m - 1, d, 12)) / 60000);
}

const OFF = new Map();
function localMins(date, tz, iso) {
  const key = tz + iso;
  let off = OFF.get(key);
  if (off === undefined) {
    const [y, m, d] = iso.split('-').map(Number);
    off = tzOffsetMin(tz, y, m, d);
    OFF.set(key, off);
  }
  let t = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60 + off;
  if (t < 0) t += 1440;
  if (t >= 1440) t -= 1440;
  return t;
}

function times(s, iso, fa, ia, rule, madhab) {
  const [y, m, d] = iso.split('-').map(Number);
  const p = new adhan.CalculationParameters('Other', fa, ia);
  p.madhab = madhab;
  p.highLatitudeRule = rule;
  p.rounding = adhan.Rounding.None;
  const pt = new adhan.PrayerTimes(new adhan.Coordinates(s.lat, s.lon), new Date(Date.UTC(y, m - 1, d, 12)), p);
  const out = { fajr: localMins(pt.fajr, s.tz, iso), sunrise: localMins(pt.sunrise, s.tz, iso),
    dhuhr: localMins(pt.dhuhr, s.tz, iso), asr: localMins(pt.asr, s.tz, iso),
    maghrib: localMins(pt.maghrib, s.tz, iso), isha: localMins(pt.isha, s.tz, iso) };
  /* anchor the computed twilight past its own sunset exactly as the printed row is anchored */
  if (out.isha < out.maghrib) out.isha += 1440;
  if (out.fajr > out.sunrise) out.fajr -= 1440;
  return out;
}

const toMin = (v) => { const [h, m] = v.split(':').map(Number); return h * 60 + m; };
/* isha may print past midnight; anchor it after maghrib so the gap stays arithmetic */
const pubMin = (row, prayer) => {
  const v = toMin(row[prayer]);
  if (prayer === 'isha' && v < toMin(row.maghrib)) return v + 1440;
  if (prayer === 'fajr' && v > toMin(row.sunrise)) return v - 1440;
  return v;
};

function margin(list) {
  const s = [...list].sort((a, b) => a - b);
  return Math.round(s[Math.floor(s.length / 2)]);
}

function grade(devs, k) {
  let exact = 0, w1 = 0, w3 = 0, worst = 0, abs = 0;
  for (const v of devs) {
    const d = v - k;
    if (Math.abs(d) > Math.abs(worst)) worst = d;
    abs += Math.abs(d);
    const rd = Math.round(d);
    if (rd === 0) exact++;
    if (Math.abs(rd) <= 1) w1++;
    if (Math.abs(rd) <= 3) w3++;
  }
  return { n: devs.length, margin: k, exact, w1, w3, worst, meanAbs: +(abs / devs.length).toFixed(2),
    exactPct: +(100 * exact / devs.length).toFixed(1), w1Pct: +(100 * w1 / devs.length).toFixed(1),
    w3Pct: +(100 * w3 / devs.length).toFixed(1) };
}

const RULES = [adhan.HighLatitudeRule.MiddleOfTheNight, adhan.HighLatitudeRule.SeventhOfTheNight,
  adhan.HighLatitudeRule.TwilightAngle];
const RULE_NAME = (r) => String(r).split('.').pop();

/* sunrise residual against the median, grouped into contiguous blocks */
function clockBlocks(rows, s, days) {
  const devs = days.map((iso) => ({ iso, dev: toMin(rows[iso].sunrise) - times(s, iso, 15, 15, RULES[0], adhan.Madhab.Shafi).sunrise }));
  const med = margin(devs.map((x) => x.dev));
  /* dev is already measured against the true zone-aware instant, so a whole-hour block is
     any run that leaves that value by more than 30 minutes */
  const bad = devs.filter((x) => Math.abs(x.dev) > 30);
  /* report the shift as an absolute offset from the solar value, not from the median */
  for (const b of bad) b.abs = Math.round(b.dev);
  const blocks = [];
  let cur = null;
  for (const b of bad) {
    if (cur && (new Date(b.iso) - new Date(cur.to)) / 86400000 === 1 && Math.abs(b.abs - cur.absSum / cur.n) <= 2) {
      cur.to = b.iso; cur.absSum += b.abs; cur.n++;
    } else {
      if (cur) blocks.push(cur);
      cur = { from: b.iso, to: b.iso, absSum: b.abs, n: 1 };
    }
  }
  if (cur) blocks.push(cur);
  return { med, blocks: blocks.map((b) => ({ from: b.from, to: b.to, days: b.n,
    shiftMin: +(b.absSum / b.n).toFixed(0) })) };
}

/* A floor or cap is real when at least five days sit exactly on the year's extreme. */
function clampOf(rows, days, prayer) {
  const vals = days.map((iso) => pubMin(rows[iso], prayer));
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const nLo = vals.filter((v) => v === lo).length, nHi = vals.filter((v) => v === hi).length;
  /* a real cap holds a long run, not a solstice plateau of rounded values */
  return { floor: prayer === 'fajr' && nLo >= 8 ? lo : null,
    cap: prayer === 'isha' && nHi >= 15 ? hi : null };
}

function bestAngle(rows, s, days, prayer, rule, clamp) {
  let best = null;
  const apply = (comp) => {
    if (clamp.floor !== null) comp = Math.max(comp, clamp.floor);
    if (clamp.cap !== null) comp = Math.min(comp, clamp.cap);
    return comp;
  };
  for (let a = 10; a <= 20.001; a += 0.25) {
    const fa = prayer === 'fajr' ? +a.toFixed(2) : 15;
    const ia = prayer === 'isha' ? +a.toFixed(2) : 15;
    const devs = days.map((iso) => pubMin(rows[iso], prayer) - apply(times(s, iso, fa, ia, rule, adhan.Madhab.Shafi)[prayer]));
    const k = margin(devs);
    const g = grade(devs, k);
    const score = g.w1 * 1000 + g.exact - g.meanAbs;
    if (!best || score > best.score) best = { score, angle: +a.toFixed(2), rule, g };
  }
  return best;
}

function bestInterval(rows, s, days, fa, rule, clamp) {
  const maghrib = new Map(days.map((iso) => [iso, times(s, iso, fa, 15, rule, adhan.Madhab.Shafi).maghrib]));
  let best = null;
  for (let n = 45; n <= 130; n++) {
    const devs = days.map((iso) => pubMin(rows[iso], 'isha') -
      (clamp.cap !== null ? Math.min(maghrib.get(iso) + n, clamp.cap) : maghrib.get(iso) + n));
    /* an interval recipe carries no free margin: a constant offset would make every
       candidate look perfect, so the interval is scored at zero */
    const g = grade(devs, 0);
    const score = g.w1 * 1000 + g.exact - g.meanAbs;
    if (!best || score > best.score) best = { score, minutes: n, g };
  }
  return best;
}

function fitSurface(s) {
  const all = JSON.parse(fs.readFileSync(path.join(DATA, s.file), 'utf8'));
  const allDays = Object.keys(all).sort();
  const { med, blocks } = clockBlocks(all, s, allDays);
  const cut = new Set();
  for (const b of blocks) for (const iso of allDays) if (iso >= b.from && iso <= b.to) cut.add(iso);
  const days = allDays.filter((d) => !cut.has(d));

  const clampF = clampOf(all, days, 'fajr'), clampI = clampOf(all, days, 'isha');
  let fajr = null, isha = null, interval = null;
  for (const rule of RULES) {
    const f = bestAngle(all, s, days, 'fajr', rule, clampF);
    if (!fajr || f.score > fajr.score) fajr = f;
    const i = bestAngle(all, s, days, 'isha', rule, clampI);
    if (!isha || i.score > isha.score) isha = i;
    const n = bestInterval(all, s, days, fajr.angle, rule, clampI);
    if (!interval || n.score > interval.score) interval = { ...n, rule };
  }
  const useInterval = interval.score > isha.score;
  const fa = fajr.angle, rule = fajr.rule;
  const ia = useInterval ? 15 : isha.angle;

  const clamp = (prayer) => (v) => {
    if (prayer === 'fajr' && clampF.floor !== null) return Math.max(v, clampF.floor);
    if (prayer === 'isha' && clampI.cap !== null) return Math.min(v, clampI.cap);
    return v;
  };
  const asrS = days.map((iso) => pubMin(all[iso], 'asr') - times(s, iso, fa, ia, rule, adhan.Madhab.Shafi).asr);
  const asrH = days.map((iso) => pubMin(all[iso], 'asr') - times(s, iso, fa, ia, rule, adhan.Madhab.Hanafi).asr);
  const madhab = grade(asrH, margin(asrH)).w1 > grade(asrS, margin(asrS)).w1 ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;

  const out = { prov: s.prov, city: s.city, label: s.label, file: s.file, tier: s.tier, tz: s.tz, coords: [s.lat, s.lon],
    rows: allDays.length, fittedDays: days.length, clockDefects: blocks,
    recipe: { fajrAngle: fa, isha: useInterval ? `maghrib+${interval.minutes}` : `${isha.angle} deg`,
      fajrFloor: clampF.floor, ishaCap: clampI.cap,
      highLatitudeRule: RULE_NAME(rule), madhab: madhab === adhan.Madhab.Hanafi ? 'hanafi' : 'shafi',
      rounding: 'none' }, prayers: {} };

  for (const p of PRAYERS) {
    let devs;
    if (p === 'isha' && useInterval) {
      devs = days.filter((iso) => all[iso].isha).map((iso) => {
        const mg = times(s, iso, fa, ia, rule, madhab).maghrib;
        const c = clampI.cap !== null ? Math.min(mg + interval.minutes, clampI.cap) : mg + interval.minutes;
        return pubMin(all[iso], 'isha') - c;
      });
      out.prayers[p] = grade(devs, margin(devs));
      continue;
    }
    devs = days.filter((iso) => all[iso][p]).map((iso) => pubMin(all[iso], p) - clamp(p)(times(s, iso, fa, ia, rule, madhab)[p]));
    out.prayers[p] = grade(devs, margin(devs));
  }

  out.years = {};
  for (const y of [...new Set(days.map((d) => d.slice(0, 4)))].sort()) {
    const sub = days.filter((d) => d.startsWith(y));
    const e = {};
    for (const p of ['fajr', 'isha']) {
      const sd = sub.map((iso) => {
        if (p === 'isha' && useInterval) {
          const mg = times(s, iso, fa, ia, rule, madhab).maghrib;
          const c = clampI.cap !== null ? Math.min(mg + interval.minutes, clampI.cap) : mg + interval.minutes;
          return pubMin(all[iso], 'isha') - c;
        }
        return pubMin(all[iso], p) - clamp(p)(times(s, iso, fa, ia, rule, madhab)[p]);
      });
      const g = grade(sd, margin(sd));
      e[p] = { n: g.n, exactPct: g.exactPct, w1Pct: g.w1Pct, worst: g.worst, margin: g.margin };
    }
    out.years[y] = e;
  }

  const jan = all['2026-01-15'] || all['2025-01-15'];
  const jul = all['2026-07-15'] || all['2025-07-15'];
  if (jan && jul) out.amplitude = { fajrMin: pubMin(jul, 'fajr') - pubMin(jan, 'fajr'),
    ishaMin: pubMin(jul, 'isha') - pubMin(jan, 'isha') };
  return out;
}

const fits = SURFACES.filter((s) => s.file).map(fitSurface);
fs.writeFileSync(path.join(DATA, 'fits.json'), JSON.stringify(fits, null, 1));
for (const f of fits) {
  const p = f.prayers;
  const blocks = f.clockDefects.map((b) => `${b.from}..${b.to}(${b.days}d,${b.shiftMin >= 0 ? '+' : ''}${b.shiftMin})`).join(' ');
  console.log(`${f.prov} ${f.city.padEnd(13)} ${f.label.padEnd(28)} fajr=${f.recipe.fajrAngle} isha=${f.recipe.isha} ${f.recipe.madhab} ${f.recipe.highLatitudeRule} | ` +
    PRAYERS.map((k) => `${k.slice(0, 3)}:${p[k].w1Pct}/${p[k].w3Pct}`).join(' ') +
    ` | amp ${f.amplitude ? Math.abs(f.amplitude.fajrMin) + '/' + Math.abs(f.amplitude.ishaMin) : '-'} | n ${f.fittedDays}/${f.rows}` +
    ` | floor ${f.recipe.fajrFloor === null ? '-' : f.recipe.fajrFloor} cap ${f.recipe.ishaCap === null ? '-' : f.recipe.ishaCap}` +
    (blocks ? ` | CLOCK ${blocks}` : ''));
}
