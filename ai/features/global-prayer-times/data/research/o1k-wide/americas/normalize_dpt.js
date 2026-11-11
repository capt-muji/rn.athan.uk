// Normalise the captured dpt year feeds into the brief's dated-row shape.
const fs = require('fs');
const FEEDS = {
  us_daralhijrah_falls_church_va: 'hijrah.org',
  us_iant_richardson_tx: 'iant.com',
  ca_islamic_institute_toronto: 'islamicinstitute.ca',
  ca_masjid_toronto: 'masjidtoronto.com',
  ca_brandon_islamic_centre: 'bicmanitoba.ca',
  ca_saskatoon: 'saskatoonmosque.com',
  ca_icswo_london_on_DEFECTIVE: 'islamiccentre.ca',
};
const out = {};
for (const [name, domain] of Object.entries(FEEDS)) {
  const rows = JSON.parse(fs.readFileSync(`captures/dpt_${domain}.json`))[0];
  const dated = {};
  for (const r of rows) {
    dated[r.d_date] = {
      fajr: r.fajr_begins.slice(0, 5), sunrise: r.sunrise.slice(0, 5),
      dhuhr: r.zuhr_begins.slice(0, 5), asr: r.asr_mithl_1.slice(0, 5),
      magrib: r.maghrib_begins.slice(0, 5), isha: r.isha_begins.slice(0, 5),
      iqamah: {
        fajr: r.fajr_jamah.slice(0, 5), dhuhr: r.zuhr_jamah.slice(0, 5),
        asr: r.asr_jamah.slice(0, 5), magrib: r.maghrib_jamah.slice(0, 5),
        isha: r.isha_jamah.slice(0, 5),
      },
    };
  }
  out[name] = dated;
  fs.writeFileSync(`data/${name}_2026.json`, JSON.stringify(dated, null, 1));
}
console.log(Object.entries(out).map(([k, v]) => k + ' ' + Object.keys(v).length).join('\n'));
