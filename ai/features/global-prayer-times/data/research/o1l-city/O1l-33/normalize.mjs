import fs from 'node:fs';

const map = [
  ['CM-ngaoundere-2026.json', 'mawaqit-sabongari-ngaoundere'],
  ['CM-douala-arrahma-pagecoords-2026.json', 'mawaqit-ar-rahma-mosque-27000-douala-cameroon'],
  ['TD-ndjamena-2026.json', 'mawaqit-masjid-abu-bakr-siddiq-ndjamena-526hhrv-chad'],
  ['CF-bangui-2026.json', 'mawaqit-mosquee-saina-youssuf-avenue-udeac-bangui-central-african-republic'],
  ['CD-goma-taqwa-2026.json', 'mawaqit-taqwa-mosque-ibb-boulevard-sake-105-16-gis-goma-congo-kinshasa'],
  ['CD-goma-daarusalaam-2026.json', 'mawaqit-daarus-salaam-goma-00-congo-kinshasa'],
  ['CG-brazzaville-2026.json', 'mawaqit-houriya-brazzaville-99324-congo-brazzaville'],
  ['GA-libreville-kinguele-2026.json', 'mawaqit-mosquee-de-kinguele-msjd-alhq-libreville-0000-gabon'],
  ['GA-libreville-bellevue3-2026.json', 'mawaqit-mosquee-de-bellevue-3-libreville-0000-gabon'],
  ['GA-portgentil-2026.json', 'mawaqit-mosquee-du-roi-faisal-msjd-almlk-fysl-port-gentil-2110-gabon'],
  ['GQ-malabo-2026.json', 'mawaqit-issa-obama-home-malabo-8163-equatorial-guinea'],
];

for (const [out, src] of map) {
  const s = JSON.parse(fs.readFileSync(`data/${src}.json`, 'utf8'));
  const o = {};
  for (const r of s.rows) o[r.date] = { fajr: r.fajr, sunrise: r.sunrise, dhuhr: r.dhuhr, asr: r.asr, maghrib: r.maghrib, isha: r.isha };
  fs.writeFileSync(`data/${out}`, JSON.stringify(o));
  console.log(out, Object.keys(o).length);
}
