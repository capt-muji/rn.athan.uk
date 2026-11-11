import fs from 'node:fs';
import { load, series, score, PRAYERS } from './lib.mjs';
const ROOT = process.env.HOME + '/athan-gitree/census/o1k-wide/horneast2/data/';
const adhan = await load();
const { CalculationParameters, Madhab } = adhan;
const p = new CalculationParameters('Other', 18, 17);
const files = {
  'hargeisa-marwa': ['somalia-hargeisa-masjid-marwa.json', 9.56, 44.065],
  'hargeisa-ina-weerar': ['somalia-hargeisa-masjid-ina-weerar.json', 9.56, 44.065],
  'mogadishu-cali-jimcaale': ['somalia-mawaqit-masjidka-cali-jimcaale-mogadishu.json', 2.0469, 45.3184],
  'djibouti-djaffar-gabode4': ['djibouti-mawaqit-masjid-djaffar-gabode4.json', 11.5721, 43.1456],
  'djibouti-al-salam-fyart': ['djibouti-mawaqit-masjid-al-salam-fyart.json', 11.5721, 43.1456],
};
for (const [name, [file, lat, lon]] of Object.entries(files)) {
  const raw = JSON.parse(fs.readFileSync(ROOT + file));
  const days = Object.keys(raw).sort();
  const ser = series(adhan, { lat, lon }, days, p);
  console.log('===', name);
  for (const col of PRAYERS) {
    const chart = days.map((d) => parseInt(raw[d][col === 'maghrib' ? 'magrib' : col].slice(0, 2), 10) * 60 + parseInt(raw[d][col === 'maghrib' ? 'magrib' : col].slice(3, 5), 10));
    const r = score(ser[col], chart, 0, 'nearest');
    const r2 = score(ser[col], chart, -0.5, 'nearest');
    const hist = {};
    for (let i = 0; i < chart.length; i++) {
      const v = Math.floor(ser[col][i] / 60 + 0.5 + 1e-9) - chart[i];
      hist[v] = (hist[v] || 0) + 1;
    }
    console.log(`  ${col.padEnd(8)} m0: exact ${r.exact} w1 ${r.within1} worst ${r.worst} bias ${r.bias.toFixed(2)} | m-0.5: exact ${r2.exact} worst ${r2.worst} bias ${r2.bias.toFixed(2)} | hist ${JSON.stringify(hist)}`);
  }
}
