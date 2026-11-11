// Identifiability check: which nominal twilight angle can reproduce the KTN01 column?
import { readFileSync } from 'node:fs';
import { loadAdhan, params, columns, bestMargin, tzOffsetMinutes, parseHHMM } from './lib.mjs';

const LAT = 6.12, LNG = 102.24, TZ = 'Asia/Kuala_Lumpur';
const A = await loadAdhan();
const HTML = process.env.HOME + '/athan-gitree/census/o1k-wide/sea2/captures/msia-ktn01-tahunan-2026.html';
const MON = { Jan: 1, Feb: 2, Mac: 3, Apr: 4, Mei: 5, Jun: 6, Jul: 7, Ogo: 8, Sep: 9, Okt: 10, Nov: 11, Dis: 12 };
const rows = [...readFileSync(HTML, 'utf8').matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
  .map(m => [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(c => c[1].replace(/<[^>]+>/g, '').trim()))
  .filter(c => c.length === 9 && MON[Object.keys(MON).find(k => c[0].includes(k))]);

function test(col, angle, margin, mode) {
  const p = params(A, angle, angle);
  let exact = 0, within1 = 0, worst = 0; const errs = [];
  for (const c of rows) {
    const mon = MON[Object.keys(MON).find(k => c[0].includes(k))];
    const dd = +/(\d{1,2})/.exec(c[0])[1];
    const col2 = columns(A, { lat: LAT, lng: LNG }, new Date(Date.UTC(2026, mon - 1, dd, 0)), p);
    const off = tzOffsetMinutes(TZ, new Date(Date.UTC(2026, mon - 1, dd, 12)));
    const v = ((col2[col === 'subuh' ? 'fajr' : 'isha'] / 60 + off) % 1440 + 1440) % 1440 + margin;
    const e = (mode === 'floor' ? Math.floor(v) : Math.round(v)) - parseHHMM(c[col === 'subuh' ? 3 : 8]);
    errs.push(e); if (e === 0) exact++; if (Math.abs(e) <= 1) within1++; if (Math.abs(e) > Math.abs(worst)) worst = e;
  }
  return { angle, margin, mode, exact, within1, worst, mean: +(errs.reduce((a, b) => a + b, 0) / errs.length).toFixed(2) };
}

for (const [col, angles] of [['subuh', [17, 17.4, 17.6, 18, 18.5, 19, 20]], ['isyak', [16.5, 17, 17.4, 17.6, 18, 18.5, 19]]]) {
  console.log(col);
  for (const angle of angles) {
    let best = null;
    for (const margin of [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6]) for (const mode of ['floor', 'nearest']) {
      const r = test(col, angle, margin, mode);
      if (!best || r.within1 > best.within1 || (r.within1 === best.within1 && r.exact > best.exact) || (r.within1 === best.within1 && r.exact === best.exact && Math.abs(r.mean) < Math.abs(best.mean))) best = r;
    }
    console.log(`  ${String(angle).padStart(4)}  best margin ${String(best.margin).padStart(2)} ${best.mode.padEnd(7)} exact ${best.exact}/365  within1 ${best.within1}/365  worst ${best.worst}  mean ${best.mean}`);
  }
}
