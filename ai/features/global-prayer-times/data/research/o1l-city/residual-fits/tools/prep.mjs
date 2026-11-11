// Stage the banked captures into dated row sets. Nothing is re-fetched; every file
// is a copy or a key rename of an artifact already in the archive.
import fs from "node:fs";
import path from "node:path";

const ROOT = "$HOME/athan-gitree/census";
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "data");
fs.mkdirSync(OUT, { recursive: true });
const write = (name, obj) => fs.writeFileSync(path.join(OUT, name), JSON.stringify(obj, null, 0));
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));

// --- Belarus: national association, Minsk, full 2025 ---
const by = read("o1k-wide/nordics2/data/by-islambel-minsk-2025.json");
write("by-islambel-minsk-2025.json", Object.fromEntries(Object.entries(by).map(([d, r]) => [d, {
  fajr: r.fajr, sunrise: r.sunrise, dhuhr: r.dhuhr, asr: r.asr, maghrib: r.magrib, isha: r.isha,
}])));

// --- Lebanon: Dar al-Fatwa five regional annual tables, undated payload ---
// The payload is keyed by day index only and carries a 29 February seam after row 59,
// so the series is a leap year: 2028. Dates are inferred and never quoted as published.
const leap = [];
for (let m = 0; m < 12; m++) {
  const days = new Date(Date.UTC(2028, m + 1, 0)).getUTCDate();
  for (let d = 1; d <= days; d++) leap.push(`2028-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
}
for (let i = 1; i <= 5; i++) {
  const src = read(`o1k-wide/gulf2/captures/lb-masjidi-region-${i}.json`);
  if (src.length !== leap.length) throw new Error(`region ${i} length ${src.length}`);
  write(`lb-region${i}-2028-inferred.json`, Object.fromEntries(src.map((r, k) => [leap[k], {
    fajr: r.Fajr, sunrise: r.Sunrise, dhuhr: r.Dhuhr, asr: r.Asr, maghrib: r.Maghrib, isha: r.Isha,
  }])));
}

// --- Yemen: Sanaa awqaf 31 locations, nine days; Aden ministry month ---
const ye = read("o1k-wide/gulf2/data/ye-sanaa-31-locations-nov2026.json");
const locs = [];
Object.entries(ye).forEach(([loc, rows], i) => {
  const id = `loc${String(i + 1).padStart(2, "0")}`;
  locs.push({ id, name: loc, days: Object.keys(rows).length });
  write(`ye-sanaa-${id}.json`, Object.fromEntries(Object.entries(rows).map(([d, r]) => [d, {
    fajr: r.fajr, sunrise: r.sunrise, dhuhr: r.dhuhr, asr: r.asr, maghrib: r.magrib, isha: r.isha,
  }])));
});
write("ye-sanaa-locations.json", locs);
const aden = read("o1k-wide/gulf2/data/ye-gov-aden-nov2026.json");
write("ye-aden-nov2026.json", Object.fromEntries(Object.entries(aden).map(([d, r]) => [d, {
  fajr: r.fajr, sunrise: r.sunrise, dhuhr: r.dhuhr, asr: r.asr, maghrib: r.magrib, isha: r.isha,
}])));

// --- Qatar: Jamiat perpetual Doha month, November 2026, published point ---
const qa = read("c15-jamiat/data/Qatar/doha-qatar.json");
write("qa-jamiat-doha-2026-11.json", Object.fromEntries(qa.rows.map((r) => [
  `2026-11-${r.day_of_month}`,
  { fajr: r.fajr, sunrise: r.sunrise, dhuhr: r.zuhr, asr: r.asr_shafi, maghrib: r.maghrib, isha: r.isha_shafi },
])));
write("qa-jamiat-meta.json", {
  town: qa.town, lat: qa.latitude, lon: qa.longitude, offset: qa.utc_offset_hours,
  source: qa.source, columns: "zuhr, asr_shafi, maghrib, isha_shafi",
});

// --- Singapore: MUIS 2027 timetable PDF, parsed rows ---
const sg = read("o1k-wide/thmsg/data/sg-muis-2027.json");
write("sg-muis-2027.json", Object.fromEntries(Object.entries(sg).map(([d, r]) => [d, {
  fajr: r.fajr, sunrise: r.sunrise, dhuhr: r.dhuhr, asr: r.asr, maghrib: r.magrib, isha: r.isha,
}])));

// --- Platform tables: one month per city, September 2026, with the page's own point ---
const idx = read("o1l-city/athanpro/data/index.json");
const byCountry = {};
for (const rec of idx) {
  if (!["Qatar", "Yemen", "Lebanon", "Belarus", "Singapore"].includes(rec.country)) continue;
  const rows = read(`o1l-city/athanpro/data/${rec.country_slug}-${rec.city_slug}.json`);
  byCountry[rec.country] ??= {};
  byCountry[rec.country][rec.city_slug] = {
    city: rec.city, lat: rec.lat, lon: rec.lon, tz: rec.tz,
    method: rec.method, methodId: rec.method_id, rows,
  };
}
for (const [country, cities] of Object.entries(byCountry)) {
  write(`platform-${country.toLowerCase().replace(/\s+/g, "-")}.json`, cities);
}

console.log("staged", fs.readdirSync(OUT).length, "files");
