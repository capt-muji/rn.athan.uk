const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/Adhan.js');
const fs = require('fs');

// City-centre coordinates chosen by the capturer; the publisher states none.
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

const data = {};
const report = [];
for (const city of Object.keys(COORDS)) {
  const files = ['2026-11', '2026-02'].map(s => `captures/br_iib_${city}_${s}.json`).filter(f => fs.existsSync(f));
  if (!files.length) continue;
  const rows = files.flatMap(f => JSON.parse(fs.readFileSync(f)).data);
  const tz = rows[0].meta.timezone;
  const method = rows[0].meta.method.name;
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
  const coords = new adhan.Coordinates(...COORDS[city]);
  const p = adhan.CalculationMethod.MuslimWorldLeague();
  p.madhab = adhan.Madhab.Shafi;
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const acc = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  const out = {};
  let n = 0;
  for (const row of rows) {
    const g = row.date.gregorian;
    const key = `${g.year}-${String(g.month.number).padStart(2, '0')}-${String(g.day).padStart(2, '0')}`;
    const t = row.timings;
    out[key] = {
      fajr: t.Fajr, sunrise: t.Sunrise, dhuhr: t.Dhuhr,
      asr: t.Asr, magrib: t.Maghrib, isha: t.Isha,
    };
    const pt = new adhan.PrayerTimes(coords, new Date(+g.year, +g.month.number - 1, +g.day), p);
    acc.fajr += Math.abs(toMin(fmt.format(pt.fajr)) - toMin(t.Fajr));
    acc.sunrise += Math.abs(toMin(fmt.format(pt.sunrise)) - toMin(t.Sunrise));
    acc.dhuhr += Math.abs(toMin(fmt.format(pt.dhuhr)) - toMin(t.Dhuhr));
    acc.asr += Math.abs(toMin(fmt.format(pt.asr)) - toMin(t.Asr));
    acc.maghrib += Math.abs(toMin(fmt.format(pt.maghrib)) - toMin(t.Maghrib));
    acc.isha += Math.abs(toMin(fmt.format(pt.isha)) - toMin(t.Isha));
    n++;
  }
  data[city] = out;
  report.push([city, n, tz, method, ...Object.values(acc).map(v => (v / n).toFixed(2))]);
}
fs.writeFileSync('data/br_iib_25cities.json', JSON.stringify(data, null, 1));
console.log('city\tdays\ttz\tmethod\tfajrMsunriseMdhuhrMasrMmaghribMishaM');
for (const r of report) console.log(r.join('\t'));
console.log('cities', report.length, 'rows', report.reduce((s, r) => s + r[1], 0));
