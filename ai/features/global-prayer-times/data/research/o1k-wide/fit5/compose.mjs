import fs from 'node:fs';
const R = process.env.HOME + '/athan-gitree/census/o1k-wide/';
const mn = (t) => parseInt(t.slice(0, 2), 10) * 60 + parseInt(t.slice(3, 5), 10);
const fmt = (v) => String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0');
let count = 0;

function span(rows) {
  const days = Object.keys(rows).sort();
  const g = (d, k) => (rows[d][k] ?? rows[d][k === 'maghrib' ? 'magrib' : k]);
  const cols = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const out = {};
  for (const c of cols) {
    const v = days.map((d) => mn(g(d, c)));
    out[c] = { min: fmt(Math.min(...v)), max: fmt(Math.max(...v)), amplitude: Math.max(...v) - Math.min(...v) };
  }
  return { days: days.length, first: days[0], last: days[days.length - 1], cols: out };
}

// --- Job 1 ---
const phRaw = JSON.parse(fs.readFileSync('ph-fit.json'));
const ph = {
  job: 'Philippines: the two year-round official surfaces',
  zone: 'Asia/Manila',
  method: 'adhan 4.4.6, second resolution then explicit minute rounding',
  surfaces: {},
  shared: phRaw.shared,
  crossApplication: {},
  verdict: {
    sameMethod: 'fajr angle, asr school (Shafi), rounding and the sunrise/dhuhr/maghrib convention are shared; the isha rule is not',
    fajr: 'one 18.1 deg angle with a +0.5 min margin reproduces all 148 rows within 1 min (124/148 exact)',
    isha: 'Davao is an angle (16.7 deg, printed interval drifts 64..69 min); BARMM is an isha angle of 18.1 deg whose printed interval is 73..75 min. One region\'s isha applied to the other misses by 4 min on every row.',
    intervalRefuted: 'a fixed interval on Davao scores worst 4 (30/90 exact): the printed 64..69 min drift is the angle signature',
  },
};
for (const [k, v] of Object.entries(phRaw)) {
  if (!v || !v.coords) continue;
  ph.surfaces[k] = {
    coords: v.coords, rows: v.rows, first: v.first, last: v.last, mode: v.mode,
    recipe: {
      fajrAngle: v.fajr.angle, fajrMargin: v.fajr.margin,
      sunriseMargin: v.sunrise.margin, dhuhrMargin: v.dhuhr.margin,
      asrSchool: v.asr.school, asrMargin: v.asr.margin, maghribMargin: v.maghrib.margin,
      isha: v.isha.model === 'interval' ? { model: 'interval', minutes: v.isha.interval, margin: v.isha.margin } : { model: 'angle', angle: v.isha.angle, margin: v.isha.margin },
    },
    scores: {
      joint: v.joint,
      fajr: { exact: v.fajr.exact, within1: v.fajr.within1, worst: v.fajr.worst },
      asr: { exact: v.asr.exact, within1: v.asr.within1, worst: v.asr.worst, hanafiWorst: v.asr.hanafiWorst },
      ishaAngle: v.isha.angleScore, ishaInterval: v.isha.intervalScore,
      printedIshaInterval: v.isha.printedIntervalRange,
    },
    identifiability: { fajrBand: v.fajrBand, ishaAngleBand: v.ishaAngleBand, ishaIntervalBand: v.ishaIntervalBand, note: 'range of the parameter that still reproduces every row within 1 min with a margin bounded to +-2 min' },
    perYear: v.perYear,
  };
  count++;
}
for (const [k, v] of Object.entries(phRaw)) {
  if (k.includes('->')) ph.crossApplication[k] = v;
}
const phRows = {};
for (const [k, f] of Object.entries({ Davao: 'philippines/data/davao-city_darul-ifti-region-xi.json', Cotabato: 'philippines/data/cotabato-city_bdi-muharram1448.json', Marawi: 'philippines/data/marawi-city_bdi-muharram1448.json' })) {
  phRows[k] = span(JSON.parse(fs.readFileSync(R + f)));
}
ph.printedSpans = phRows;
fs.writeFileSync('ph.json', JSON.stringify(ph, null, 1));

// --- Job 2 ---
const eaRaw = JSON.parse(fs.readFileSync('ea-fit.json'));
const eaFiles = {
  'hargeisa-marwa': ['somalia-hargeisa-masjid-marwa.json', 'Hargeisa'],
  'hargeisa-nuurul-huda': ['somalia-hargeisa-masjid-nuurul-huda.json', 'Hargeisa'],
  'hargeisa-ina-weerar': ['somalia-hargeisa-masjid-ina-weerar.json', 'Hargeisa'],
  'mogadishu-rabbul-caalamiin': ['somalia-mawaqit-masjid-rabbul-caalamiin-mogadishu.json', 'Mogadishu'],
  'mogadishu-cali-jimcaale': ['somalia-mawaqit-masjidka-cali-jimcaale-mogadishu.json', 'Mogadishu'],
  'djibouti-djaffar-gabode4': ['djibouti-mawaqit-masjid-djaffar-gabode4.json', 'Djibouti'],
  'djibouti-abd-ar-rahman': ['djibouti-mawaqit-msjd-abd-ar-rahman-bin-awf.json', 'Djibouti'],
  'djibouti-al-salam-fyart': ['djibouti-mawaqit-masjid-al-salam-fyart.json', 'Djibouti'],
  'djibouti-tayib-nagad': ['djibouti-mawaqit-mosquee-tayib-nagad.json', 'Djibouti'],
  'djibouti-nashr-aldine': ['djibouti-mawaqit-mosquee-nashr-aldine.json', 'Djibouti'],
  'djibouti-ihsaan': ['djibouti-mawaqit-mosquee-ihsaan.json', 'Djibouti'],
};
const ea = {
  job: 'East Africa: the Hargeisa, Mogadishu and Djibouti mawaqit clusters',
  zones: { Somalia: 'Africa/Mogadishu', Djibouti: 'Africa/Djibouti', note: 'both UTC+3 with no DST in 2026; verified identical offsets all year, so one process zone is exact' },
  platformClass: { method: 'Muslim World League 18/17', asr: 'Shafi', rounding: 'nearest', margins: 0, grade: 'community (platform default on a mosque page, no authority parameter statement)' },
  payloads: {},
  clusters: {
    Hargeisa: 'two of the three share one configuration (every column within 1 min); ina-weerar prints fajr up to 3 min later and isha up to 2 min earlier, i.e. lower fajr and isha angles',
    Mogadishu: 'the pair shares one configuration: every column within 1 min, one table a minute earlier across the board',
    Djibouti: 'five of six share one configuration within 1 min; al-Salam FYART is defective (asr -14..+16, sunrise -7..+6)',
  },
  verdict: {
    perCity: 'one community recipe per city, and it is the same recipe in all three: MWL 18/17, Shafi, nearest, zero margins',
    hargeisa: 'yes with one exception (ina-weerar)',
    mogadishu: 'yes',
    djibouti: 'yes for five of six, FYART excluded',
  },
};
for (const [k, v] of Object.entries(eaRaw)) {
  const [file, city] = eaFiles[k];
  const rows = JSON.parse(fs.readFileSync(R + 'horneast2/data/' + file));
  ea.payloads[k] = {
    city, coords: v.coords, rows: v.rows, mode: v.mode,
    fitted: { fajrAngle: v.fajrAngle, fajrMargin: v.fajrMargin, ishaModel: v.ishaModel, ishaAngle: v.ishaAngle, ishaInterval: v.ishaInterval, ishaMargin: v.ishaMargin, asrSchool: v.asrSchool, asrMargin: v.asrMargin },
    bands: { fajr: v.fajrBand, ishaAngle: v.ishaAngleBand, ishaInterval: v.ishaIntervalBand },
    fittedScores: { fajr: v.fajrScore, isha: v.ishaScore, asr: v.asrScore, sunrise: v.sunriseScore, dhuhr: v.dhuhrScore, maghrib: v.maghribScore, joint: v.joint },
    platformClassScores: v.fixed,
    printedSpan: span(rows),
  };
  count++;
}
fs.writeFileSync('ea.json', JSON.stringify(ea, null, 1));

// --- Job 3 ---
// The two offset groups are fitted in separate processes; merge them here.
{
  const a = JSON.parse(fs.readFileSync('br-fit-m3.json'));
  const b = JSON.parse(fs.readFileSync('br-fit-m4.json'));
  const m = { method: a.method, zones: { m3: 'UTC-3', m4: 'UTC-4' }, cities: { ...a.cities, ...b.cities }, national: { ...a.national, ...b.national } };
  let w = 0, e = 0, wi = 0, n = 0, mae = 0;
  for (const v of Object.values(m.national)) { w = Math.max(w, v.worst); e += v.exact; wi += v.within1; n += v.n; mae += v.mae * v.n; }
  m.summary = { cities: 25, rows: n / 6, worst: w, within1: wi, exact: e, n, mae: +(mae / n).toFixed(4) };
  m.five = Object.fromEntries(['Manaus', 'Salvador', 'Sao_Paulo', 'Curitiba', 'Porto_Alegre'].map((c) => [c, m.national[c]]));
  fs.writeFileSync('br-fit.json', JSON.stringify(m, null, 1));
}
const br = JSON.parse(fs.readFileSync('br-fit.json'));
br.job = 'Brazil: the 25-city verification of the IIB national surface';
br.zoneNote = 'four payloads publish UTC-4 (Manaus, Cuiaba, Campo Grande, Porto Velho), 21 publish UTC-3; each group was evaluated in its own zone, not in one zone';
br.verdict = { confirmed: true, statement: 'MWL 18/17, Shafi, no margins reproduces all 25 cities and all 5 named cities within 1 minute; worst 1' };
fs.writeFileSync('br.json', JSON.stringify(br, null, 1));

// --- Job 4 ---
const caRaw = JSON.parse(fs.readFileSync('ca-fit.json'));
const ca = {
  job: "Canada: Toronto's two year feeds",
  zone: 'America/Toronto',
  mosques: {
    'masjid-toronto': { printedRule: 'isha = printed maghrib + 80 on all 365 days', ...caRaw['masjid-toronto'] },
    'islamic-institute-toronto': { printedRule: 'isha = printed maghrib + 90 on 345 days, 89 on 20 days in April', ...caRaw['islamic-institute-toronto'] },
  },
  agreement: caRaw.agreement,
  verdict: {
    agreeWithEachOther: 'yes on method (fajr 15 deg, Shafi asr, fixed post-maghrib interval, nearest rounding); they differ only in the interval, 80 vs 90 min',
    fcna: 'neither agrees with FCNA 13/13. Masjid Toronto is -12.5..+15.5 min against a 13 deg isha (mean +5.4 later); IIT -2.5..+24.5 (mean +14.8 later). Their fajr is 14.9..15.2 deg, not 13',
    residual: 'sunrise and maghrib move symmetrically about an exact dhuhr by up to +-2.5 min in month-level steps (August to October longest, April shortest). A coordinate fit does not remove it, so it is their solar declination, not their clock or longitude; asr inherits it.',
  },
};
count += 2;
for (const k of ['masjid-toronto', 'islamic-institute-toronto']) delete ca[k];
fs.writeFileSync('ca.json', JSON.stringify(ca, null, 1));
console.log('wrote ph.json ea.json br.json ca.json');
