// R9: invert single published rows read off an authority's own site, one row per
// country, where the authority publishes a day view rather than a downloadable year.
// Each entry names the authority, the URL it was read from and the fetch date.
//
// A one-day inversion is weaker evidence than a month or a year, and every row here
// is reported as such. It is enough to separate a 12-degree convention from an
// 18-degree one, and enough to rule a Hanafi Asr in or out, because those differences
// are tens of minutes. It is NOT enough to distinguish 17.5 from 18.0.
import { invertRow } from './solar-harness.mjs';

const rows = [
  // AFRICA
  { country: 'Tunisia, Tunis', src: 'meteo.tn/fr/heures-prieres, Institut National de la Meteorologie, 2026-09-30',
    y: 2026, m: 9, d: 30, lat: 36.8065, lng: 10.1815, tz: 1,
    fajr: '04:47', dhuhr: '12:16', asr: '15:31', maghrib: '18:07', isha: '19:31' },
  { country: 'Mauritania, Nouakchott', src: 'affairesislamiques.mr, Ministere des Affaires Islamiques, 2026-09-30',
    y: 2026, m: 9, d: 30, lat: 18.0735, lng: -15.9582, tz: 0,
    fajr: '05:05', sunrise: '06:34', dhuhr: '13:09', asr: '16:30', maghrib: '19:44', isha: '21:03' },
  { country: 'Senegal, Dakar (CERFI, not a state body)', src: 'cerfi.sn, 2026-09-30',
    y: 2026, m: 9, d: 30, lat: 14.7167, lng: -17.4677, tz: 0,
    fajr: '05:44', dhuhr: '13:01', asr: '16:22', maghrib: '19:01', isha: '20:01' },
  { country: 'Senegal, Dakar, the separate `Suba` row', src: 'cerfi.sn, 2026-09-30',
    y: 2026, m: 9, d: 30, lat: 14.7167, lng: -17.4677, tz: 0, fajr: '05:59' },

  // EUROPE
  { country: 'France, Paris (Grande Mosquee de Paris)', src: 'mawaqit.net/fr/m/grande-mosquee-de-paris confData, 2026-09-30',
    y: 2026, m: 9, d: 30, lat: 48.8424, lng: 2.3548, tz: 2,
    fajr: '06:15', sunrise: '07:48', dhuhr: '13:46', asr: '16:51', maghrib: '19:35', isha: '21:02' },
  { country: 'Norway, Oslo (Islamsk Rad Norge)', src: 'bonnetid.no, 2026-09-30',
    y: 2026, m: 9, d: 30, lat: 59.913263, lng: 10.7522, tz: 2,
    fajr: '05:15', sunrise: '07:18', dhuhr: '13:11', asr: '15:59', maghrib: '18:58', isha: '20:47' },
  { country: 'Norway, Oslo, the printed `2x-skygge` Asr', src: 'bonnetid.no, 2026-09-30',
    y: 2026, m: 9, d: 30, lat: 59.913263, lng: 10.7522, tz: 2, asr: '16:45' },
];

for (const r of rows) {
  const { country, src, ...q } = r;
  console.log(country, '|', src);
  console.log(' ', JSON.stringify(invertRow(q)));
}
