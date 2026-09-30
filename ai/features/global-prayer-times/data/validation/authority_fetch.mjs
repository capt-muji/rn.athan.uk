// Fetch the four authorities' OWN published prayer times, verbatim, once.
//
// This is the sourcing half of R7 Part 1. adhan ships `MuslimWorldLeague`,
// `Egyptian`, `Karachi` and `NorthAmerica` with NO test fixture (R3 finding
// 16). The only way to judge those four presets is against what the bodies
// themselves publish, so this script captures that and commits it.
//
// What each source is, and what it is worth:
//
//   MWL      POST https://portal.themwl.org/api/salat/prayer-times
//            The Muslim World League's OWN portal application, the endpoint
//            its Angular bundle calls (found in chunk
//            2569.fedca3ed5e30bcba.js, service `getPrayerTimes(lat, lon,
//            zoneId)`). This is the closest thing to an MWL position that
//            exists: R1 could find no MWL method document at all.
//
//   Egypt    GET https://esa.gov.eg/praytimes.aspx
//            The Egyptian General Authority of Survey's own page. It serves
//            78 Egyptian cities for TODAY only; the calendar control is a
//            postback that this script does not drive, because 78 cities
//            across 22.2N to 31.6N on one day is a better latitude sweep than
//            one city across a month.
//
//   Karachi  no publication exists. R1 searched and found none: the
//            "University of Islamic Sciences, Karachi" 18/18 pair traces only
//            to praytimes.org and Arabeyes ITL. Nothing is fetched here and
//            the preset is judged UNVERIFIABLE rather than right or wrong.
//
//   FCNA     the ruling itself, not a timetable:
//            https://fiqhcouncil.org/the-suggested-calculation-method-for-fajr-and-isha/
//            15/15 USA, 13/13 Canada, General Body Meeting, Dallas, 27 to 29
//            October 2017. Captured as a page snapshot for the record.
//
// Output: ./authority/*.json and ./authority/*.html, committed verbatim.
// Run: node authority_fetch.mjs

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('./authority/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Node's own fetch could not reach these hosts from the research machine
// (UND_ERR_CONNECT_TIMEOUT on portal.themwl.org while `curl` to the same URL
// returned 200), so every request here goes through `curl`. Announced because
// the tool path matters to anyone reproducing this.
function curl(url, { post, headers = [] } = {}) {
  const args = ['-sS', '-L', '-m', '40', '-A', UA];
  for (const h of headers) args.push('-H', h);
  if (post !== undefined) {
    args.push('-X', 'POST', '-H', 'content-type: application/json', '-d', post);
  }
  args.push(url);
  return execFileSync('curl', args, { maxBuffer: 64 * 1024 * 1024 }).toString();
}

// --------------------------------------------------------------------- MWL

const MWL_CITIES = [
  ['Makkah', 21.4225, 39.8262, 'Asia/Riyadh'],
  ['Madinah', 24.4686, 39.6142, 'Asia/Riyadh'],
  ['Riyadh', 24.7136, 46.6753, 'Asia/Riyadh'],
  ['Cairo', 30.0444, 31.2357, 'Africa/Cairo'],
  ['London', 51.5074, -0.1278, 'Europe/London'],
  ['Manchester', 53.4808, -2.2426, 'Europe/London'],
  ['Berlin', 52.52, 13.405, 'Europe/Berlin'],
  ['Istanbul', 41.0082, 28.9784, 'Europe/Istanbul'],
  ['Karachi', 24.8607, 67.0011, 'Asia/Karachi'],
  ['Lahore', 31.5204, 74.3587, 'Asia/Karachi'],
  ['Dhaka', 23.8103, 90.4125, 'Asia/Dhaka'],
  ['Delhi', 28.6139, 77.209, 'Asia/Kolkata'],
  ['Jakarta', -6.2088, 106.8456, 'Asia/Jakarta'],
  ['KualaLumpur', 3.139, 101.6869, 'Asia/Kuala_Lumpur'],
  ['Singapore', 1.3521, 103.8198, 'Asia/Singapore'],
  ['NewYork', 40.7128, -74.006, 'America/New_York'],
  ['Chicago', 41.8781, -87.6298, 'America/Chicago'],
  ['Toronto', 43.6532, -79.3832, 'America/Toronto'],
  ['Vancouver', 49.2827, -123.1207, 'America/Vancouver'],
  ['Lagos', 6.5244, 3.3792, 'Africa/Lagos'],
  ['CapeTown', -33.9249, 18.4241, 'Africa/Johannesburg'],
  ['Oslo', 59.9139, 10.7522, 'Europe/Oslo'],
  ['Sydney', -33.8688, 151.2093, 'Australia/Sydney'],
  ['Casablanca', 33.5731, -7.5898, 'Africa/Casablanca'],
];

async function fetchMwl() {
  const out = {};
  for (const [name, lat, lon, tz] of MWL_CITIES) {
    const raw = curl('https://portal.themwl.org/api/salat/prayer-times', {
      post: JSON.stringify({ latitude: lat, longitude: lon, zoneId: tz }),
      headers: [
        'accept: application/json',
        'origin: https://portal.themwl.org',
        'referer: https://portal.themwl.org/en/applications/prayer-times',
      ],
    });
    out[name] = { lat, lon, tz, body: JSON.parse(raw) };
    process.stderr.write(`mwl ${name} ok\n`);
    await sleep(800);
  }
  writeFileSync(
    `${OUT}mwl_portal.json`,
    JSON.stringify(
      {
        source: 'https://portal.themwl.org/api/salat/prayer-times',
        method: 'POST {latitude, longitude, zoneId}',
        note:
          "the Muslim World League's own portal application endpoint, found in its Angular chunk 2569.fedca3ed5e30bcba.js",
        fetchedUtc: new Date().toISOString(),
        cities: out,
      },
      null,
      2,
    ),
  );
}

// ------------------------------------------------------------------- Egypt

function decodeEntities(s) {
  return s.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
}

async function fetchEsa() {
  const html = curl('https://esa.gov.eg/praytimes.aspx');
  writeFileSync(`${OUT}esa_praytimes.html`, html);

  const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/g)].map((m) => m[0]);
  const grid = tables.find(
    (t) => /\u0641\u062c\u0631/.test(t) && /\d{1,2}:\d{1,2}/.test(t),
  );
  const rows = grid
    ? [...grid.matchAll(/<tr[\s\S]*?<\/tr>/g)]
        .map((r) =>
          [...r[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) =>
            decodeEntities(c[1].replace(/<[^>]+>/g, '')).trim(),
          ),
        )
        .filter((r) => r.length >= 9)
    : [];
  writeFileSync(
    `${OUT}esa_cities.json`,
    JSON.stringify(
      {
        source: 'https://esa.gov.eg/praytimes.aspx',
        authority:
          'al-Hay\u2019a al-Misriyya al-\u2018Amma li-l-Misaha (Egyptian General Authority of Survey)',
        note: 'the page serves every Egyptian city for TODAY only; the month view is a postback that returns the same day',
        fetchedUtc: new Date().toISOString(),
        header: rows[0],
        rows: rows.slice(1),
      },
      null,
      2,
    ),
  );
  process.stderr.write(`esa ok ${rows.length - 1} cities\n`);
}

// -------------------------------------------------------------------- FCNA

async function fetchFcna() {
  const url =
    'https://fiqhcouncil.org/the-suggested-calculation-method-for-fajr-and-isha/';
  const html = curl(url);
  writeFileSync(`${OUT}fcna_ruling.html`, html);
  process.stderr.write(`fcna ok ${html.length}\n`);
}

const which = process.argv[2] ?? 'all';
if (which === 'all' || which === 'mwl') await fetchMwl();
if (which === 'all' || which === 'esa') await fetchEsa();
if (which === 'all' || which === 'fcna') await fetchFcna();
