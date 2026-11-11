// Published and anchor points the record already holds, carried verbatim with their citation.
// Each extractor names the file it read and the field it read, so a reader can re-derive the
// same table without this script.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const CENSUS = path.join(process.env.HOME, "athan-gitree", "census");
const DATA = path.join(ROOT, "..", "data");
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const out = {};
const put = (file, rec) => { if (!out[file]) out[file] = rec; };

// --- Tunisia: the INM archive echoes the delegation's own lat/lng in every row ------------
const TN_DIR = path.join(CENSUS, "o1l-city/tunisia-cities/captures");
const tn = {};
for (const name of fs.readdirSync(TN_DIR)) {
  if (!name.startsWith("tn-horaire-") || !name.endsWith(".ndjson")) continue;
  const m = name.match(/tn-horaire-[\w-]*-(\d+)-(\d+)\.ndjson$/);
  if (!m) continue;
  const [, gouv, deleg] = m;
  for (const line of fs.readFileSync(path.join(TN_DIR, name), "utf8").split("\n")) {
    if (!line.trim()) continue;
    let body;
    try { body = JSON.parse(JSON.parse(line).body); } catch { continue; }
    const d = body && body.data;
    if (!d || !d.lat || !d.lng) continue;
    tn[`${gouv}-${deleg}`] = {
      lat: +d.lat, lon: +d.lng,
      name: d.delegation ? d.delegation.intituleFr : null,
      gouv: d.gouvernorat ? d.gouvernorat.intituleFr : null,
    };
    break;
  }
}
let tnCount = 0;
const TN_KINDS = ["sw", "yp", "mon", "back", "kass"];
for (const kind of TN_KINDS) {
  for (const [key, v] of Object.entries(tn)) {
    put(`tn-inm-${kind}-${key}.json`, {
      lat: v.lat, lon: v.lon, pointClass: "PUBLISHED", tz: "Africa/Tunis",
      source: `INM meteo.tn archive row lat/lng for delegation ${key} (${v.name}, ${v.gouv}), echoed in every day row; captures/tn-horaire-*.ndjson`,
    });
    tnCount++;
  }
}

// --- Thailand: the CICOT workbook prints its reference point in degrees-minutes-seconds ----
const TH_COORDS = read(path.join(CENSUS, "o1l-city/thailand-provinces/data/th-province-coordinates.json"));
const thBySlug = new Map(Object.entries(TH_COORDS).map(([name, v]) => [norm(name), { name, ...v }]));
let thCount = 0;
for (const file of fs.readdirSync(path.join(CENSUS, "o1l-city/thailand-provinces/data"))) {
  const m = file.match(/^th-cicot-(.+)-2569(-leap)?\.json$/);
  if (!m) continue;
  const hit = thBySlug.get(norm(m[1]));
  if (!hit) continue;
  put(file, {
    lat: hit.lat, lon: hit.lon, pointClass: "ANCHOR", tz: "Asia/Bangkok",
    anchorName: hit.district_th || null,
    source: `CICOT workbook row 1, printed coordinate (${hit.header.trim()}); th-province-coordinates.json`,
  });
  thCount++;
}

// --- Indonesia: Kemenag's own city register states the point it computes at ----------------
const ID_CITIES = read(path.join(CENSUS, "o1l-city/indonesia-cities/captures/kemenag-cities-all.json")).data;
const idBySlug = new Map();
for (const c of ID_CITIES) {
  const key = norm(c.name.replace(/^(KAB\.|KOTA)\s+/i, ""));
  const isKota = /^KOTA/i.test(c.name);
  const prev = idBySlug.get(key);
  if (!prev || (isKota && !prev.isKota)) idBySlug.set(key, { ...c, isKota });
}
let idCount = 0;
const hints = {};
for (const file of fs.readdirSync(path.join(CENSUS, "o1l-city/indonesia-cities/data"))) {
  const m = file.match(/^(sihat|khgt)-(\d{4})-(.+)\.json$/);
  if (!m) continue;
  const hit = idBySlug.get(norm(m[3]));
  if (!hit) continue;
  // The register's point is a statement about the city, not about the other publisher's
  // engine, so it is a hint for the solver, never a published point on a KHGT surface.
  hints[file] = { lat: +hit.latitude.toFixed(4), lon: +hit.longitude.toFixed(4), source: `Kemenag city register, ${hit.name}` };
  if (m[1] === "sihat") {
    put(file, {
      lat: +hit.latitude.toFixed(4), lon: +hit.longitude.toFixed(4), pointClass: "PUBLISHED",
      tz: hit.timezone, elevation: hit.elevation,
      source: `Kemenag SIHAT city register, ${hit.name} lat/longitude/timezone; captures/kemenag-cities-all.json`,
    });
    idCount++;
  }
}

// --- Egypt: ESA publishes no point; the record's own implied point per city ---------------
const EG_FIT = read(path.join(CENSUS, "o1l-city/egypt-82/data/fit82.json"));
let egCount = 0;
for (const [idx, v] of Object.entries(EG_FIT)) {
  if (!v.implied) continue;
  const file = `eg-esa-${String(idx).padStart(2, "0")}-2026.json`;
  put(file, {
    lat: v.implied.lat, lon: v.implied.lng, pointClass: "DERIVED", tz: "Africa/Cairo",
    source: `ESA table's own implied point, o1l-city/egypt-82/data/fit82.json implied (${v.key}); solver scripts/fit82.js`,
  });
  egCount++;
}

// --- Bosnia and the vaktija federation: the API states each location's point --------------
const BA_INDEX = read(path.join(CENSUS, "o1l-city/balkan-cities/data/ba_cities_index.json"));
const BA_COORDS = read(path.join(CENSUS, "o1l-city/balkan-cities/data/ba_coords.json"));
let baCount = 0;
for (const [id, v] of Object.entries(BA_INDEX)) {
  const c = BA_COORDS[id];
  if (!c || !v.file) continue;
  put(v.file, {
    lat: c.lat, lon: c.lon, pointClass: "PUBLISHED", tz: "Europe/Sarajevo",
    source: `vaktija.eu location register id=${id} (${v.place}); balkan-cities/data/ba_coords.json`,
  });
  baCount++;
}

const surfaceFiles = new Set(
  fs.readFileSync(path.join(DATA, "surfaces.psv"), "utf8").trim().split("\n").slice(1)
    .map((l) => l.split("|")[3]),
);
const pruned = {};
for (const [file, rec] of Object.entries(out)) if (surfaceFiles.has(file)) pruned[file] = rec;

fs.writeFileSync(path.join(DATA, "published.json"), JSON.stringify(pruned, null, 1));
fs.writeFileSync(path.join(DATA, "hints.json"), JSON.stringify(hints, null, 1));
console.log(JSON.stringify({
  tunisia: tnCount, thailand: thCount, indonesiaSihat: idCount, egypt: egCount, bosnia: baCount,
  matched: Object.keys(pruned).length,
}));
