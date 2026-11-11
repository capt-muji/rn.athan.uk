// Normalise the dpt year feeds captured here into the brief's dated-row shape.
const fs = require('fs');
const FEEDS = {
  us_icgt_toledo: 'icgt.org',
  us_mcsamasjid_san_antonio: 'mcsamasjid.com',
  ca_kitchener_masjid: 'kitchenermasjid.com',
  ca_bilal_centre_winnipeg: 'bilalcentre.ca',
  ca_mia_winnipeg: 'miaonline.org',
  ca_ummah_masjid_halifax: 'ummahmasjid.ca',
};
for (const [name, domain] of Object.entries(FEEDS)) {
  const rows = JSON.parse(fs.readFileSync(`captures/dpt_${domain}.json`))[0];
  const dated = {};
  for (const r of rows) {
    if (!r.fajr_begins || r.fajr_begins === '00:00:00') continue;
    dated[r.d_date] = {
      fajr: r.fajr_begins.slice(0, 5),
      sunrise: r.sunrise.slice(0, 5),
      dhuhr: r.zuhr_begins.slice(0, 5),
      asr: r.asr_mithl_1.slice(0, 5),
      magrib: r.maghrib_begins.slice(0, 5),
      isha: r.isha_begins.slice(0, 5),
      iqamah: {
        fajr: r.fajr_jamah.slice(0, 5),
        dhuhr: r.zuhr_jamah.slice(0, 5),
        asr: r.asr_jamah.slice(0, 5),
        magrib: r.maghrib_jamah.slice(0, 5),
        isha: r.isha_jamah.slice(0, 5),
      },
    };
  }
  fs.writeFileSync(`data/${name}.json`, JSON.stringify(dated, null, 1));
  console.log(name, Object.keys(dated).length, 'rows');
}
