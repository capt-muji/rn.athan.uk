// Job 2 (partial): the JAKIM KTN01 recipe, measured at Kota Bharu from the banked
// annual mirror, and the +1 min subuh/syuruk sample tested against it.
import { readFileSync, writeFileSync } from 'node:fs';
import { loadAdhan, params, columns, bestMargin, tzOffsetMinutes, parseHHMM, sun, impliedDepression, stats } from './lib.mjs';

const LAT = 6.12, LNG = 102.24, TZ = 'Asia/Kuala_Lumpur';
const A = await loadAdhan();
const HTML = process.env.HOME + '/athan-gitree/census/o1k-wide/sea2/captures/msia-ktn01-tahunan-2026.html';

const MON = { Jan: 1, Feb: 2, Mac: 3, Apr: 4, Mei: 5, Jun: 6, Jul: 7, Ogo: 8, Sep: 9, Okt: 10, Nov: 11, Dis: 12 };
const rows = [...readFileSync(HTML, 'utf8').matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
  .map(m => [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(c => c[1].replace(/<[^>]+>/g, '').trim()))
  .filter(c => c.length === 9 && MON[Object.keys(MON).find(k => c[0].includes(k))]);

const days = rows.map((c) => {
  const mon = MON[Object.keys(MON).find(k => c[0].includes(k))];
  const dd = +/(\d{1,2})/.exec(c[0])[1];
  return {
    date: `2026-${String(mon).padStart(2, '0')}-${String(dd).padStart(2, '0')}`,
    hijri: c[1], imsak: parseHHMM(c[2]), subuh: parseHHMM(c[3]), syuruk: parseHHMM(c[4]),
    zohor: parseHHMM(c[5]), asar: parseHHMM(c[6]), maghrib: parseHHMM(c[7]), isyak: parseHHMM(c[8]),
  };
});

function secs(col, fajrAngle, ishaAngle, madhab = 'shafi', dateRange = days) {
  const p = params(A, fajrAngle, ishaAngle, { madhab });
  const out = [], printed = [];
  for (const d of dateRange) {
    const [y, m, dd] = d.date.split('-').map(Number);
    const utc = new Date(Date.UTC(y, m - 1, dd, 0));
    const c = columns(A, { lat: LAT, lng: LNG }, utc, p);
    const off = tzOffsetMinutes(TZ, new Date(Date.UTC(y, m - 1, dd, 12)));
    out.push(((c[col] / 60 + off) % 1440 + 1440) % 1440);
    printed.push(d[{ fajr: 'subuh', sunrise: 'syuruk', dhuhr: 'zohor', asr: 'asar', maghrib: 'maghrib', isha: 'isyak' }[col]]);
  }
  return { calc: out, printed };
}

function fitAngle(col, lo, hi, madhab = 'shafi') {
  let best = null;
  for (let angle = lo; angle <= hi + 1e-9; angle += 0.05) {
    const { calc, printed } = secs(col, angle, angle, madhab);
    const r = bestMargin(calc, printed, { m0: -6, step: 0.5, jMax: 24 });
    r.angle = +angle.toFixed(2);
    if (!best || r.within1 > best.within1 || (r.within1 === best.within1 && r.exact > best.exact) ||
        (r.within1 === best.within1 && r.exact === best.exact && r.worst < best.worst)) best = r;
  }
  return best;
}

const f = (x) => `${x.angle} margin ${x.margin} ${x.mode}: ${x.exact}/${x.n} exact, ${x.within1}/${x.n} within 1, worst ${x.worst}`;

const out = {
  job: 'Kelantan zon 1 (KTN01) recipe from the banked JAKIM annual and the +1 min flag',
  coordinate: { lat: LAT, lng: LNG, tz: TZ },
  source: 'sea2/captures/msia-ktn01-tahunan-2026.html (waktusolatmalaysia.org mirror of JAKIM zon KTN01, 2026 annual)',
  rows_parsed: days.length,
  first: days[0], last: days[days.length - 1],
  fit: {},
  sample_2026_03_18: days.find(d => d.date === '2026-03-18') || null,
};

for (const [col, lo, hi] of [['fajr', 15, 20], ['isha', 15, 20]]) {
  out.fit[col] = fitAngle(col, lo, hi);
  console.log(col.padEnd(6), f(out.fit[col]));
}
out.fit.sunrise = fitAngle('sunrise', 0.5, 1.5);
console.log('sunrise', f(out.fit.sunrise));
out.fit.asrShafi = (() => { const { calc, printed } = secs('asr', 18, 18, 'shafi'); return bestMargin(calc, printed, { m0: -6, step: 0.5, jMax: 24 }); })();
out.fit.asrHanafi = (() => { const { calc, printed } = secs('asr', 18, 18, 'hanafi'); return bestMargin(calc, printed, { m0: -6, step: 0.5, jMax: 24 }); })();
out.fit.maghrib = (() => { const { calc, printed } = secs('maghrib', 18, 18); return bestMargin(calc, printed, { m0: -6, step: 0.5, jMax: 24 }); })();
console.log('asr shafi', JSON.stringify(out.fit.asrShafi), '| hanafi', JSON.stringify(out.fit.asrHanafi));
console.log('maghrib vs sunset', JSON.stringify(out.fit.maghrib));

// Implied angles, and the dhuhr offset against true noon.
const off = tzOffsetMinutes(TZ, new Date(Date.UTC(2026, 2, 18, 12)));
const imp = days.map((d) => {
  const [y, m, dd] = d.date.split('-').map(Number);
  const s = sun(A, { lat: LAT, lng: LNG }, new Date(Date.UTC(y, m - 1, dd, 0)));
  const noon = s.transit * 60 + tzOffsetMinutes(TZ, new Date(Date.UTC(y, m - 1, dd, 12)));
  return { date: d.date, fajr: impliedDepression(s, LAT, (d.subuh - noon) / 60), isha: impliedDepression(s, LAT, (d.isyak - noon) / 60), dhuhrOffset: d.zohor - noon, imsakGap: d.subuh - d.imsak };
});
out.implied = {
  fajr: stats(imp.map(x => x.fajr)), isha: stats(imp.map(x => x.isha)),
  dhuhrOffset: stats(imp.map(x => x.dhuhrOffset)), imsakGap: stats(imp.map(x => x.imsakGap)),
};
console.log('implied fajr', JSON.stringify(out.implied.fajr), 'isha', JSON.stringify(out.implied.isha));
console.log('dhuhr offset vs noon', JSON.stringify(out.implied.dhuhrOffset), 'imsak gap', JSON.stringify(out.implied.imsakGap));

writeFileSync(new URL('./kelantan.json', import.meta.url), JSON.stringify(out, null, 1));
console.log('wrote kelantan.json');
