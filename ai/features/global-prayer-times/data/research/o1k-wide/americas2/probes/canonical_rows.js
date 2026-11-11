// Emit the brief's canonical row shape for every surface captured here.
// { "YYYY-MM-DD": {fajr, sunrise, dhuhr, asr, magrib, isha} }
const fs = require('fs');

const pick = (v) => {
  if (Array.isArray(v)) return { fajr: v[0], sunrise: v[1], dhuhr: v[2], asr: v[3], magrib: v[4], isha: v[5] };
  const src = v.athan || v;
  return { fajr: src.fajr, sunrise: src.sunrise || src.shuruq, dhuhr: src.dhuhr || src.zuhr, asr: src.asr, magrib: src.magrib || src.maghrib, isha: src.isha };
};

const jobs = [
  ['data/us_icgt_toledo.json', 'data/rows_us_icgt_toledo.json'],
  ['data/us_mcsamasjid_san_antonio.json', 'data/rows_us_mcsamasjid_san_antonio.json'],
  ['data/ca_kitchener_masjid.json', 'data/rows_ca_kitchener_masjid.json'],
  ['data/ca_bilal_centre_winnipeg.json', 'data/rows_ca_bilal_centre_winnipeg.json'],
  ['data/ca_mia_winnipeg.json', 'data/rows_ca_mia_winnipeg.json'],
  ['data/ca_ummah_masjid_halifax.json', 'data/rows_ca_ummah_masjid_halifax.json'],
];

const masjidal = {
  '1QL0gbKZ': 'us_memphis_islamic_center',
  'keLQn7AM': 'us_richmond_iccc_tx',
  'XEdoEvL7': 'us_icsouthbay_lomita_ca',
  'nL1JggAa': 'us_mas_tarbiyah_livonia_mi',
  'z0AW66Lj': 'us_jamaica_muslim_center_queens_ny',
  '6adJ5qAk': 'us_ema_seatac_wa',
  'rdRvm3dG': 'us_islamic_center_of_tennessee',
  'VrdRkwKG': 'ca_markaz_ul_islam_edmonton',
  'pVdwyVLe': 'ca_masjid_ataqwa_edmonton',
  'M0dYkvL6': 'ca_masjid_alfatima_edmonton',
  'xdy03lAX': 'us_iant_richardson_tx',
};
for (const [id, name] of Object.entries(masjidal)) jobs.push([`data/masjidal_${id}_2026.json`, `data/rows_${name}.json`]);

// mawaqit athan calendars and the Masjidbox/PDF surfaces keep their own extractors
for (const [src, dst] of [
  ['data/gt_aldaawa_2026.json', 'data/rows_gt_aldaawa_guatemala_city.json'],
  ['data/hn_sps_centro_islamico_2026.json', 'data/rows_hn_centro_islamico_san_pedro_sula.json'],
  ['data/mx_guadalajara_isa_ibn_maryam_masjidbox.json', 'data/rows_mx_guadalajara_isa_ibn_maryam.json'],
]) jobs.push([src, dst]);

for (const [src, dst] of jobs) {
  if (!fs.existsSync(src)) { console.log('missing', src); continue; }
  const raw = JSON.parse(fs.readFileSync(src));
  const rows = {};
  for (const [d, v] of Object.entries(raw)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    rows[d] = pick(v);
  }
  fs.writeFileSync(dst, JSON.stringify(rows, null, 1));
  console.log(dst, Object.keys(rows).length);
}
