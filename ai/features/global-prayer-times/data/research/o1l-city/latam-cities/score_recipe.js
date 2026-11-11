// Score a dated grid against a fixed recipe at known coordinates.
// node score_recipe.js <rows.json> <lat> <lon> <tz> <fajrAngle> <ishaAngle> <shafi|hanafi> [offsetFajr,offsetSunrise,...,offsetIsha]
// rows: {date: [fajr,sunrise,dhuhr,asr,maghrib,isha]}. adhan 4.4.6, Rounding.None,
// minute rendering then explicit rounding to nearest minute per column.
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const fs = require('fs');
const [file, lat, lon, tz, fa, ia, madhab, offArg] = process.argv.slice(2);
const rows = JSON.parse(fs.readFileSync(file));
const coords = new adhan.Coordinates(+lat, +lon);
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const offs = offArg ? offArg.split(',').map(Number) : [0, 0, 0, 0, 0, 0];
const dates = Object.keys(rows).sort();
const p0 = new adhan.CalculationParameters('Other', +fa, +ia);
p0.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
p0.madhab = madhab === 'hanafi' ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
const cols = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const pickers = [t => t.fajr, t => t.sunrise, t => t.dhuhr, t => t.asr, t => t.maghrib, t => t.isha];
const per = {}, worst = {}, mae = {}, sums = cols.map(() => ({ s: 0, n: 0 }));
for (const d of dates) {
  const [Y, M, D] = d.split('-').map(Number);
  const t = new adhan.PrayerTimes(coords, new Date(Y, M - 1, D), p0);
  const got = pickers.map((pk, i) => toMin(fmt.format(pk(t))) + offs[i]);
  const want = rows[d].map(toMin);
  const yr = d.slice(0, 4);
  per[yr] = per[yr] || { exact: 0, within1: 0, cells: 0, worst: 0 };
  for (let i = 0; i < 6; i++) {
    const e = Math.abs(got[i] - want[i]);
    if (!worst[cols[i]] || e > worst[cols[i]][0]) worst[cols[i]] = [e, d];
    sums[i].s += e; sums[i].n++;
    per[yr].cells++; if (e === 0) per[yr].exact++; if (e <= 1) per[yr].within1++;
    if (e > per[yr].worst) per[yr].worst = e;
  }
}
for (let i = 0; i < 6; i++) mae[cols[i]] = +(sums[i].s / sums[i].n).toFixed(3);
// seasonal amplitude: Jan vs Jul fajr values (computed), plus row extremes
const jans = dates.filter(d => d.slice(5, 7) === '01').sort();
const juls = dates.filter(d => d.slice(5, 7) === '07').sort();
const amp = {
  jan_fajr_rows: [jans[0], jans[jans.length - 1]],
  jul_fajr_rows: [juls[0], juls[juls.length - 1]],
};
const total = { exact: 0, cells: 0, within1: 0, worst: 0 };
for (const y of Object.keys(per)) {
  total.exact += per[y].exact; total.cells += per[y].cells; total.within1 += per[y].within1;
  if (per[y].worst > total.worst) total.worst = per[y].worst;
}
console.log(JSON.stringify({
  file, days: dates.length, span: [dates[0], dates[dates.length - 1]],
  recipe: { fajr: +fa, isha: +ia, madhab, offsets: offs },
  total, perYear: per, maeByColumn: mae,
  worstByColumn: Object.fromEntries(Object.entries(worst).map(([k, [e, d]]) => [k, `${e}min@${d}`])),
}, null, 1));
