// Job 1: verify Kemenag's 21/19 highland rule from the banked 516-regency table.
// For every regency and both banked dates, invert the printed fajr/isha minutes
// to the sun depression they imply, then classify.
import { readFileSync, writeFileSync } from 'node:fs';
import { loadAdhan, sun, impliedDepression, parseHHMM, stats, tzOffsetMinutes, params, columns, bestMargin } from './lib.mjs';

const DATA = process.env.HOME + '/athan-gitree/census/o1k-wide/indonesia/data/sihat-2026-all-cities-2dates.json';
const TZ = 'Asia/Jayapura';
const A = await loadAdhan();

const table = JSON.parse(readFileSync(DATA, 'utf8'));
const dates = table.dates;

const perRegency = [];
for (const [name, c] of Object.entries(table.cities)) {
  const coord = { lat: c.lat, lng: c.lng };
  const days = [];
  for (const ds of dates) {
    const [y, m, d] = ds.split('-').map(Number);
    const utcNoon = new Date(Date.UTC(y, m - 1, d, 12));
    const s = sun(A, coord, new Date(Date.UTC(y, m - 1, d, 0)));
    const r = c.rows[ds];
    const transpMin = s.transit * 60 + tzOffsetMinutes(c.tz, utcNoon);
    const fajrMin = parseHHMM(r.fajr);
    const ishaMin = parseHHMM(r.isha);
    const maghribMin = parseHHMM(r.magrib);
    const dhuhrMin = parseHHMM(r.dhuhr);
    days.push({
      date: ds,
      fajrDepth: impliedDepression(s, c.lat, (fajrMin - transpMin) / 60),
      ishaDepth: impliedDepression(s, c.lat, (ishaMin - transpMin) / 60),
      sunriseAlt: impliedDepression(s, c.lat, (parseHHMM(r.sunrise) - transpMin) / 60),
      dhuhrOffset: dhuhrMin - transpMin,
      ishaGap: ishaMin - maghribMin,
      fajrGap: parseHHMM(r.sunrise) - fajrMin,
      r,
    });
  }
  perRegency.push({
    name,
    tz: c.tz,
    lat: c.lat,
    lng: c.lng,
    elevation: c.elevation,
    fajrDepth: days.map(d => d.fajrDepth),
    ishaDepth: days.map(d => d.ishaDepth),
    sunriseAlt: days.map(d => d.sunriseAlt),
    dhuhrOffset: days.map(d => d.dhuhrOffset),
    rows: days.map(d => ({ date: d.date, ...d.r })),
  });
}

const fajrMed = perRegency.map(p => ({ ...p, fj: stats(p.fajrDepth).med, is: stats(p.ishaDepth).med }));
const deep = fajrMed.filter(p => p.fj > 20.5 && p.is > 18.5);
const mid = fajrMed.filter(p => !(p.fj > 20.5 && p.is > 18.5) && (p.fj > 19.5 || p.is > 17.5));

const quant = (arr, f) => { const a = [...arr].sort((x, y) => x - y); return a[Math.round(f * (a.length - 1))]; };

const SEVEN = ['KAB. PUNCAK JAYA', 'KAB. PUNCAK', 'KAB. INTAN JAYA', 'KAB. LANNY JAYA',
  'KAB. PEGUNUNGAN ARFAK', 'KAB. PANIAI', 'KAB. DEIYAI', 'KAB. JAYAWIJAYA'];

const seven = SEVEN.map(n => {
  const p = fajrMed.find(x => x.name === n);
  return {
    name: n,
    elevation_m: p.elevation,
    lat: +p.lat.toFixed(4),
    lng: +p.lng.toFixed(4),
    tz: p.tz,
    fajr_depth_med: +p.fj.toFixed(2),
    isha_depth_med: +p.is.toFixed(2),
    per_date: p.rows.map((r, i) => ({
      date: r.date,
      fajr: r.fajr, fajr_depth: +p.fajrDepth[i].toFixed(2),
      isha: r.isha, isha_depth: +p.ishaDepth[i].toFixed(2),
      isha_minus_maghrib: p.rows[i] && (parseHHMM(r.isha) - parseHHMM(r.magrib)),
    })),
    class: p.fj > 20.5 && p.is > 18.5 ? '21/19' : '20/18',
  };
});

console.log('regencies:', perRegency.length, 'dates:', dates.join(','));
console.log('implied fajr depth quantiles 5/50/95:', [0.05, 0.5, 0.95].map(f => quant(fajrMed.map(p => p.fj), f).toFixed(2)).join(' '));
console.log('implied isha depth quantiles 5/50/95:', [0.05, 0.5, 0.95].map(f => quant(fajrMed.map(p => p.is), f)).map(v => v.toFixed(2)).join(' '));
console.log('DEAD BAND (20.5.., 18.5..) count:', deep.length);
console.log('AMBIGUOUS band (19.5-20.5 or 17.5-18.5):', mid.length, mid.slice(0, 10).map(p => `${p.name} ${p.fj.toFixed(2)}/${p.is.toFixed(2)}`).join(' | '));
console.log('classified 21/19:', deep.map(p => p.name).join(', '));
const highland = fajrMed.filter(p => p.elevation >= 1500).sort((a, b) => b.elevation - a.elevation);
console.log('\nall regencies at >=1500 m (elevation, implied fajr/isha depth):');
for (const p of highland) console.log(`${p.name.padEnd(26)} ${String(p.elevation).padStart(5)}m ${p.fj.toFixed(2)}/${p.is.toFixed(2)} ${p.fj > 20.5 ? 'DEEP' : ''}`);
const dipOf = h => Math.atan(1 / (1 + h / 6371000)) * 180 / Math.PI * 60; // arcmin
console.log('\nsunrise altitude implied by the printed sunrise minute, vs horizon dip at stated elevation:');
for (const s of seven) {
  const alt = stats(perRegency.find(p => p.name === s.name).sunriseAlt).med;
  console.log(`${s.name.padEnd(24)} ${String(s.elevation_m).padStart(5)}m  implied alt ${alt.toFixed(2)} deg  dip(elev)+refraction ${(-0.833 - (s.elevation_m > 100 ? Math.acos(6371000/(6371000+s.elevation_m))*180/Math.PI*60/60 : 0)).toFixed(2)} deg`);
}
console.log('\nthe seven plus Jayawijaya:');
for (const s of seven) console.log(`${s.name.padEnd(24)} ${String(s.elevation_m).padStart(5)}m  fajr ${s.fajr_depth_med.toFixed(2)}  isha ${s.isha_depth_med.toFixed(2)}  -> ${s.class}`);

// Pooled margin fit: which nominal angle reproduces the printed minute per class.
function pool(names, fajrAngle, ishaAngle) {
  const fj = [], is_ = [], fjP = [], isP = [];
  for (const n of names) {
    const p = perRegency.find(x => x.name === n);
    for (const row of p.rows) {
      const [y, m, d] = row.date.split('-').map(Number);
      const col = columns(A, { lat: p.lat, lng: p.lng }, new Date(Date.UTC(y, m - 1, d, 0)), params(A, fajrAngle, ishaAngle));
      const off = tzOffsetMinutes(p.tz, new Date(Date.UTC(y, m - 1, d, 12)));
      fj.push(((col.fajr / 60 + off) % 1440 + 1440) % 1440); fjP.push(parseHHMM(row.fajr));
      is_.push(((col.isha / 60 + off) % 1440 + 1440) % 1440); isP.push(parseHHMM(row.isha));
    }
  }
  return { fajr: bestMargin(fj, fjP), isha: bestMargin(is_, isP) };
}
const normal = fajrMed.filter(p => !(p.fj > 20.5 && p.is > 18.5)).map(p => p.name);
const fit = {
  deep_at_21_19: pool(seven.filter(s => s.class === '21/19').map(s => s.name), 21, 19),
  deep_at_20_18: pool(seven.filter(s => s.class === '21/19').map(s => s.name), 20, 18),
  normal_at_20_18: pool(normal, 20, 18),
  normal_at_21_19: pool(normal, 21, 19),
  deiyai_at_21_19: pool(['KAB. DEIYAI'], 21, 19),
  deiyai_at_20_18: pool(['KAB. DEIYAI'], 20, 18),
};
console.log('\npooled margin fits (fajr / isha):');
for (const [k, v] of Object.entries(fit)) {
  console.log(`${k.padEnd(18)} fajr ${String(v.fajr.exact).padStart(4)}/${v.fajr.n} exact ${v.fajr.within1}/${v.fajr.n} w1 (${v.fajr.margin} ${v.fajr.mode})  isha ${String(v.isha.exact).padStart(4)}/${v.isha.n} exact ${v.isha.within1}/${v.isha.n} w1 (${v.isha.margin} ${v.isha.mode})`);
}

writeFileSync(new URL('./id-highlands.json', import.meta.url), JSON.stringify({
  job: 'Kemenag 21/19 highland rule, verified from the banked table',
  source: table.source,
  source_file: 'indonesia/data/sihat-2026-all-cities-2dates.json',
  dates,
  timezone_note: 'the seven regencies all sit in Asia/Jayapura (WIT); table tz field used per regency',
  method: 'adhan 4.4.6 solar position; printed minute inverted to sun depression at the printed coordinate, sea-level geometry',
  total_regencies: perRegency.length,
  depth_quantiles_fajr: { p05: +quant(fajrMed.map(p => p.fj), 0.05).toFixed(2), p50: +quant(fajrMed.map(p => p.fj), 0.5).toFixed(2), p95: +quant(fajrMed.map(p => p.fj), 0.95).toFixed(2) },
  depth_quantiles_isha: { p05: +quant(fajrMed.map(p => p.is), 0.05).toFixed(2), p50: +quant(fajrMed.map(p => p.is), 0.5).toFixed(2), p95: +quant(fajrMed.map(p => p.is), 0.95).toFixed(2) },
  pooled_fit: fit,
  deep_count: deep.length,
  deep_regencies: deep.map(p => ({ name: p.name, elevation_m: p.elevation, fajr: +p.fj.toFixed(2), isha: +p.is.toFixed(2) })),
  seven,
  all_regencies: fajrMed.map(p => ({
    name: p.name, tz: p.tz, lat: +p.lat.toFixed(4), lng: +p.lng.toFixed(4),
    elevation_m: p.elevation, fajr_depth: +p.fj.toFixed(2), isha_depth: +p.is.toFixed(2),
    rows: p.rows,
  })),
}, null, 1));
console.log('\nwrote id-highlands.json');
