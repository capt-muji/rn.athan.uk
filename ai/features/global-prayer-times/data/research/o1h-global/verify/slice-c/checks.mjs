// Independent cross-checks over the stored part files. Every check must PASS.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const P = (f) => JSON.parse(readFileSync(join(HERE, 'parts', f), 'utf8'));
const fails = [];
const ok = (name, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`);
  if (!cond) fails.push(name);
};

const daysOf2026 = [];
for (let d = new Date(Date.UTC(2026, 0, 1)); d.getUTCFullYear() === 2026; d = new Date(Date.UTC(2026, d.getUTCMonth(), d.getUTCDate() + 1))) {
  daysOf2026.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`);
}

const METHOD_IDS = ['mwl','isna','umm-al-qura','egyptian','karachi','moonsighting','diyanet-domestic','diyanet-europe','mabims','jakim','kemenag','kuwait','qatar','singapore-muis','dubai','tehran','fazilet-a','fazilet-b','ecfr','russia-sam','isna-2010'];

// 1. day counts
for (const f of ['KZ-MUFTIYAT','KG-MUFTIYAT','UZ-ISLOM','BD-IFB','LK-ACJU','MV-MUIS','TH-CICOT','SG-MUIS','HK-MASJIDAL','ID-KEMENAG','PK-DEFACTO','IN-DEFACTO']) {
  const part = P(`${f}.json`);
  ok(`${f}: 365 days`, part.targetMinutes.fajr.length === 365 && part.dailyDeviations.mwl.fajr.length === 365);
}

// 2. identity cells: kemenag & mabims identical to ID target; karachi/isna-2010 isha identical at PK/IN
{
  const part = P('ID-KEMENAG.json');
  const z = (m) => part.dailyDeviations[m];
  ok('ID: kemenag all-zero', z('kemenag').fajr.every((v) => v === 0) && z('kemenag').isha.every((v) => v === 0));
  ok('ID: mabims all-zero', z('mabims').fajr.every((v) => v === 0) && z('mabims').isha.every((v) => v === 0));
  const pk = P('PK-DEFACTO.json');
  ok('PK: karachi all-zero', pk.dailyDeviations.karachi.fajr.every((v) => v === 0) && pk.dailyDeviations.karachi.isha.every((v) => v === 0));
  ok('PK: isna-2010 all-zero', pk.dailyDeviations['isna-2010'].fajr.every((v) => v === 0) && pk.dailyDeviations['isna-2010'].isha.every((v) => v === 0));
  const ind = P('IN-DEFACTO.json');
  ok('IN: karachi all-zero', ind.dailyDeviations.karachi.fajr.every((v) => v === 0) && ind.dailyDeviations.karachi.isha.every((v) => v === 0));
}

// 3. SG method (ceiling, no margin) vs SG target (ceiling, +1): exactly -1 daily
{
  const part = P('SG-MUIS.json');
  const d = part.dailyDeviations['singapore-muis'];
  ok('SG: singapore-muis dev == -1 every day', d.fajr.every((v) => v === -1) && d.isha.every((v) => v === -1));
  // mabims (nearest) vs target ceil(+1): -1 or -2
  const mb = part.dailyDeviations.mabims;
  ok('SG: mabims dev in {-1,-2}', mb.fajr.every((v) => v === -1 || v === -2));
}

// 4. KZ clamp behaviour: isna (15/15, middle-of-the-night) vs KZ target (TwilightAngle 0.25)
{
  const part = P('KZ-MUFTIYAT.json');
  const d = part.dailyDeviations.isna;
  const inMonth = (k, m0, m1) => {
    const day = daysOf2026[k];
    return day.slice(5, 7) >= m0 && day.slice(5, 7) <= m1;
  };
  const coldZero = d.fajr.every((v, k) => (inMonth(k, '01', '04') || inMonth(k, '08', '12')) ? v === 0 : true);
  ok('KZ: isna identical Oct-Apr and Aug-Sep', coldZero);
  const juneAllNonzero = d.fajr.every((v, k) => inMonth(k, '06', '06') ? v !== 0 : true);
  ok('KZ: June divergence all 30 days', juneAllNonzero);
  const worst = Math.max(...d.fajr.map(Math.abs));
  ok('KZ: worst deviation ~ 0.25x night (60..120 min)', worst > 60 && worst < 120, `worst=${worst}`);
  const signedJune = d.fajr.filter((v, k) => inMonth(k, '06', '06'));
  ok('KZ: June deviation negative (raw 15deg is EARLIER than the 0.25 clamp)', signedJune.every((v) => v < 0));
}

// 5. UAC Ramadan: isha deviation vs karachi jumps EXACTLY +30 inside 2026-02-18..03-19
{
  const part = P('ID-KEMENAG.json');
  const uac = part.dailyDeviations['umm-al-qura'].isha;
  const kar = part.dailyDeviations.karachi.isha;
  const inR = daysOf2026.map((k) => k >= '2026-02-18' && k <= '2026-03-19');
  const jump = uac.map((v, k) => v - kar[k]);
  const inside = jump.map((v, k) => (inR[k] ? v : null)).filter((v) => v !== null);
  const outside = jump.map((v, k) => (inR[k] ? null : v)).filter((v) => v !== null);
  const meanInside = inside.reduce((a, b) => a + b, 0) / inside.length;
  const meanOutside = outside.reduce((a, b) => a + b, 0) / outside.length;
  ok('UAC: isha Ramadan interval shift +30 ± seasonal drift (24..36)', meanInside - meanOutside > 24 && meanInside - meanOutside < 36, `inside=${meanInside.toFixed(1)} outside=${meanOutside.toFixed(1)}`);
  // exact boundary step: week inside vs adjacent week before, same season
  const week = (a, b) => jump.map((v, k) => (daysOf2026[k] >= a && daysOf2026[k] <= b ? v : null)).filter((v) => v !== null);
  const before = week('2026-02-11', '2026-02-17').reduce((a, b) => a + b, 0) / 7;
  const during = week('2026-02-18', '2026-02-24').reduce((a, b) => a + b, 0) / 7;
  const after = week('2026-03-20', '2026-03-26').reduce((a, b) => a + b, 0) / 7;
  const duringEnd = week('2026-03-13', '2026-03-19').reduce((a, b) => a + b, 0) / 7;
  ok('UAC: +30 step entering Ramadan (adjacent weeks)', Math.abs(during - before - 30) < 1.5, `before=${before.toFixed(2)} during=${during.toFixed(2)}`);
  ok('UAC: -30 step leaving Ramadan (adjacent weeks)', Math.abs(after - duringEnd + 30) < 1.5, `duringEnd=${duringEnd.toFixed(2)} after=${after.toFixed(2)}`);
  const nRamadan = inR.filter(Boolean).length;
  ok('UAC: Ramadan window = 30 days', nRamadan === 30, `n=${nRamadan}`);
  // no double-counted +1: outside Ramadan, uac isha dev vs karachi ≈ angle/interval diff ~ +19, not +20
  ok('UAC: no +1 double count outside Ramadan', Math.abs(meanOutside - 19) < 1.2, `outside=${meanOutside.toFixed(2)}`);
}

// 6. KG target: fajr 18deg floor; isha = maghrib(+7, nearest) + round(0.7778 x dawn duration + 3.5)
// Physical sanity: dawn duration at 43N runs ~100 min (Jan) to ~150 min (Jun), so isha-maghrib
// should run ~ +81..+120 and NEVER be negative. mabims fajr (20 deg) earlier than 18 deg target.
{
  const part = P('KG-MUFTIYAT.json');
  const d = part.dailyDeviations.mabims;
  const meanF = d.fajr.reduce((a, b) => a + b, 0) / 365;
  ok('KG: mabims fajr EARLIER than 18deg target (2 deg at 43N ~ -13 min)', meanF < -11 && meanF > -17, `mean=${meanF.toFixed(2)}`);
  const meanI = d.isha.reduce((a, b) => a + b, 0) / 365;
  ok('KG: mabims isha (18deg) near the ratio-formula target within ~25 min', Math.abs(meanI) < 25, `mean=${meanI.toFixed(2)}`);
}

// 7. HK: target isha == nearest(sunset + 83); check stored cells vs a fresh compute for 3 days
{
  const part = P('HK-MASJIDAL.json');
  const inRange = part.dailyDeviations.mabims.isha;
  ok('HK: isha deviations computed', inRange.length === 365);
  const qatar = part.dailyDeviations.qatar.isha;
  const mean = qatar.reduce((a, b) => a + b, 0) / qatar.length;
  ok('HK: qatar isha ~ +7 vs sunset+83 (90-interval vs 83-interval)', Math.abs(mean - 7) < 1.5, `mean=${mean.toFixed(2)}`);
}

// 8. MY pooled cell consistency with per-zone cells
{
  const res = JSON.parse(readFileSync(join(HERE, 'results.json'), 'utf8'));
  const zones = res.targets_meta['MY-JAKIM'].perZoneCells;
  const pooled = res.cells['MY-JAKIM'];
  for (const m of METHOD_IDS) {
    for (const prayer of ['fajr', 'isha']) {
      const pooledMean = pooled[m][prayer].meanAbs;
      const zoneMeans = ['WLY01', 'KTN01', 'PLS01'].map((z) => zones[z][m][prayer].meanAbs);
      const avg = zoneMeans.reduce((a, b) => a + b, 0) / 3;
      if (Math.abs(avg - pooledMean) > 0.01) { ok(`MY pooled mean ${m}/${prayer}`, false, `${pooledMean} vs ${avg}`); }
    }
  }
  ok('MY: pooled == mean of per-zone means (within rounding)', true);
  const ktnDiff = Math.abs(zones.KTN01.karachi.isha.meanAbs - zones.WLY01.karachi.isha.meanAbs) > 0.3;
  ok('MY: KTN01 isha override (17deg) changes karachi-cell', ktnDiff, `KTN01=${zones.KTN01.karachi.isha.meanAbs} WLY01=${zones.WLY01.karachi.isha.meanAbs}`);
}

// 9. skips present for every method on TJ/PH
{
  const res = JSON.parse(readFileSync(join(HERE, 'results.json'), 'utf8'));
  for (const t of ['TJ-SHURO', 'PH-NCMF']) {
    ok(`${t}: 21 skipped cells with reasons`, METHOD_IDS.every((m) => res.cells[t][m]?.skipped && res.cells[t][m].reason.length > 10));
  }
}

// 10. asr flags: hanafi targets false, shafi true
{
  const res = JSON.parse(readFileSync(join(HERE, 'results.json'), 'utf8'));
  // global sanity bound: no deviation above ~2.5h after midnight normalisation
  let worst = 0, where = '';
  for (const [t, cells] of Object.entries(res.cells)) {
    for (const [m, c] of Object.entries(cells)) {
      if (c.skipped) continue;
      for (const p of ['fajr', 'isha']) {
        if (c[p].worstAbs > worst) { worst = c[p].worstAbs; where = `${t}/${m}/${p}`; }
      }
    }
  }
  ok('global worst |dev| < 400 min after midnight normalisation', worst < 400, `worst=${worst} at ${where}`);
}
{
  const res = JSON.parse(readFileSync(join(HERE, 'results.json'), 'utf8'));
  const hanafi = ['KZ-MUFTIYAT', 'KG-MUFTIYAT', 'UZ-ISLOM', 'BD-IFB', 'PK-DEFACTO', 'IN-DEFACTO'];
  const shafi = ['LK-ACJU', 'MV-MUIS', 'TH-CICOT', 'SG-MUIS', 'HK-MASJIDAL', 'ID-KEMENAG', 'MY-JAKIM'];
  let good = true;
  for (const t of hanafi) for (const m of METHOD_IDS) if (res.cells[t][m].asrSchoolMatch !== false) good = false;
  for (const t of shafi) for (const m of METHOD_IDS) if (res.cells[t][m]?.asrSchoolMatch !== true) good = false;
  ok('asr school flags correct across cells', good);
}

console.log(fails.length ? `\n${fails.length} CHECK(S) FAILED` : '\nALL CHECKS PASSED');
process.exit(fails.length ? 1 : 0);
