// Job 3: Brazil, the 25-city verification. Publisher states Muslim World League;
// the fit tests 18/17, Shafi, zero margins, at the five cities named plus the
// whole country for context.
import fs from 'node:fs';
import { load, series, score, bestMargin, marginsIn, PRAYERS } from './lib.mjs';

const ROOT = process.env.HOME + '/athan-gitree/census/o1k-wide/americas/';
const adhan = await load();
const data = JSON.parse(fs.readFileSync(ROOT + 'data/br_iib_25cities.json'));

// City-centre coordinates the capturer chose; the publisher states none.
const COORDS = {
  Sao_Paulo: [-23.5505, -46.6333], Rio_de_Janeiro: [-22.9068, -43.1729],
  Belo_Horizonte: [-19.9167, -43.9345], Recife: [-8.0476, -34.8770],
  Fortaleza: [-3.7172, -38.5433], Manaus: [-3.1190, -60.0217],
  Belem: [-1.4558, -48.4902], Goiania: [-16.6869, -49.2648],
  Campinas: [-22.9099, -47.0626], Guarulhos: [-23.4538, -46.5333],
  Sao_Bernardo_do_Campo: [-23.6914, -46.5646], Santo_Andre: [-23.6639, -46.5383],
  Curitiba: [-25.4284, -49.2733], Porto_Alegre: [-30.0346, -51.2177],
  Brasilia: [-15.7939, -47.8828], Salvador: [-12.9777, -38.5016],
  Florianopolis: [-27.5954, -48.5480], Vitoria: [-20.3155, -40.3128],
  Natal: [-5.7945, -35.2110], Joao_Pessoa: [-7.1195, -34.8450],
  Maceio: [-9.6658, -35.7353], Cuiaba: [-15.6014, -56.0979],
  Campo_Grande: [-20.4697, -54.6201], Porto_Velho: [-8.7612, -63.9004],
  Aracaju: [-10.9472, -37.0731],
};
const ZONE = 'America/Sao_Paulo'; // overridden per group below
// Published timezone per city, read from the captures' own meta.
const TZ = {
  Aracaju: 'America/Maceio', Belem: 'America/Belem', Belo_Horizonte: 'America/Sao_Paulo',
  Brasilia: 'America/Sao_Paulo', Campinas: 'America/Sao_Paulo', Campo_Grande: 'America/Campo_Grande',
  Cuiaba: 'America/Cuiaba', Curitiba: 'America/Sao_Paulo', Florianopolis: 'America/Sao_Paulo',
  Fortaleza: 'America/Fortaleza', Goiania: 'America/Sao_Paulo', Guarulhos: 'America/Sao_Paulo',
  Joao_Pessoa: 'America/Fortaleza', Maceio: 'America/Maceio', Manaus: 'America/Manaus',
  Natal: 'America/Fortaleza', Porto_Alegre: 'America/Sao_Paulo', Porto_Velho: 'America/Porto_Velho',
  Recife: 'America/Recife', Rio_de_Janeiro: 'America/Sao_Paulo', Salvador: 'America/Bahia',
  Santo_Andre: 'America/Sao_Paulo', Sao_Bernardo_do_Campo: 'America/Sao_Paulo',
  Sao_Paulo: 'America/Sao_Paulo', Vitoria: 'America/Sao_Paulo',
};
// The process runs one fixed-offset class at a time; 2026 Brazil has two.
const group = process.env.BR_GROUP || 'm3';
const inGroup = (c) => (new Intl.DateTimeFormat('en-GB', { timeZone: TZ[c], timeZoneName: 'longOffset' }).format(new Date(Date.UTC(2026, 0, 15))).endsWith('04:00') ? 'm4' : 'm3') === group;

function get(city) {
  const rows = data[city];
  const days = Object.keys(rows).sort();
  const chart = {};
  for (const p of PRAYERS) chart[p] = days.map((d) => parseInt(rows[d][p === 'maghrib' ? 'magrib' : p].slice(0, 2), 10) * 60 + parseInt(rows[d][p === 'maghrib' ? 'magrib' : p].slice(3, 5), 10));
  return { days, chart };
}

const p = adhan.methods.MuslimWorldLeague();
p.madhab = adhan.Madhab.Shafi;

const FIVE = ['Manaus', 'Salvador', 'Sao_Paulo', 'Curitiba', 'Porto_Alegre'];
const out = { method: 'MuslimWorldLeague 18/17 Shafi, nearest, zero margins', cities: {}, national: {} };

function evaluate(city) {
  const { days, chart } = get(city);
  const ser = series(adhan, { lat: COORDS[city][0], lon: COORDS[city][1] }, days, p);
  const per = {};
  let worst = 0, exact = 0, within1 = 0, n = 0, mae = 0;
  for (const col of PRAYERS) {
    const r = score(ser[col], chart[col], 0, 'nearest');
    per[col] = r;
    worst = Math.max(worst, r.worst);
    exact += r.exact; within1 += r.within1; n += r.n;
    mae += r.mae * r.n;
  }
  return { days: days.length, worst, exact, within1, n, mae: mae / n, per };
}

console.log('BRAZIL: MWL 18/17, Shafi, nearest, no margins  group ' + group + ' (' + (group === 'm4' ? 'UTC-4' : 'UTC-3') + ')');
console.log('city                  days worst within1   exact   mae   cols-off');
for (const city of FIVE.filter(inGroup)) {
  const r = evaluate(city);
  out.cities[city] = {
    coords: COORDS[city], days: r.days, worst: r.worst, exact: r.exact,
    within1: r.within1, n: r.n, mae: +r.mae.toFixed(3),
    per: Object.fromEntries(PRAYERS.map((c) => [c, { worst: r.per[c].worst, within1: r.per[c].within1, exact: r.per[c].exact, mae: +r.per[c].mae.toFixed(2) }])),
  };
  const off = PRAYERS.filter((c) => r.per[c].worst > 0).map((c) => `${c}:${r.per[c].worst}`).join(' ');
  console.log(`  ${city.padEnd(20)} ${String(r.days).padStart(3)}  ${String(r.worst).padStart(3)}  ${String(r.within1).padStart(4)}/${r.n}  ${String(r.exact).padStart(4)}/${r.n}  ${r.mae.toFixed(2)}  ${off || '-'}`);
}

let nAll = 0, worstAll = 0, withinAll = 0, exactAll = 0, maeAll = 0;
console.log('\nnational (all 25 cities held):');
for (const city of Object.keys(COORDS).filter(inGroup)) {
  const r = evaluate(city);
  out.national[city] = { days: r.days, worst: r.worst, within1: r.within1, exact: r.exact, n: r.n, mae: +r.mae.toFixed(3) };
  nAll += r.n; worstAll = Math.max(worstAll, r.worst); withinAll += r.within1; exactAll += r.exact; maeAll += r.mae * r.n;
}
console.log(`  cities 25  rows ${nAll / 6}  worst ${worstAll}  within1 ${withinAll}/${nAll}  exact ${exactAll}/${nAll}  mae ${(maeAll / nAll).toFixed(3)}`);
out.summary = { cities: 25, rows: nAll / 6, worst: worstAll, within1: withinAll, exact: exactAll, n: nAll, mae: +(maeAll / nAll).toFixed(3) };
out.five = Object.fromEntries(FIVE.filter(inGroup).map((c) => [c, { worst: out.cities[c].worst, within1: out.cities[c].within1, n: out.cities[c].n, exact: out.cities[c].exact }]));

// Headroom: what would the best per-column margin buy, if any city needed one.
console.log('\nheadroom (best margin per column per city, bounded +-2):');
for (const city of FIVE.filter(inGroup)) {
  const { days, chart } = get(city);
  const ser = series(adhan, { lat: COORDS[city][0], lon: COORDS[city][1] }, days, p);
  const parts = PRAYERS.map((col) => {
    const r = bestMargin(ser[col], chart[col], { margins: marginsIn(2), modes: ['nearest'] });
    return `${col[0]}${r.margin >= 0 ? '+' : ''}${r.margin}`;
  });
  console.log(`  ${city.padEnd(20)} ${parts.join(' ')}`);
}

fs.writeFileSync('br-fit-' + group + '.json', JSON.stringify(out, null, 1));
console.log('\nwrote br-fit-' + group + '.json');
