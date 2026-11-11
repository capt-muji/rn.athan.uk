// One record per surface, plus the per-country inputs the resolver needs.
import fs from "node:fs";
import path from "node:path";
import { BBOX, ZONES } from "./countries.mjs";

const DATA = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "data");
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"));

const surfaces = fs.readFileSync(path.join(DATA, "surfaces.psv"), "utf8").trim().split("\n").slice(1)
  .map((l) => {
    const [id, op, workspace, file, p, rows_n, first, last] = l.split("|");
    return { id: +id, op, workspace, file, path: p, rows_n: +rows_n, first, last };
  });
const solved = new Map(read("solved.json").map((r) => [r.id, r]));
const published = read("published.json");

const REASON = {
  "no-country": "the record does not name the surface's country, and its file name does not resolve to one",
  "not-solar": "the rows do not move with the sun (fixed or partly fixed table), so no point is implied",
  "no-transit": "the record holds fewer than two solar columns, so latitude and longitude are not jointly determined",
  "too-few-days": "too few dated rows to identify a point",
  "outside-bbox": "the fitted point falls outside the country's envelope, so the table does not describe one place",
  "bases-disagree": "the transit column and the horizon pair imply longitudes more than 2 degrees apart",
  "no-rows": "the record holds no dated rows for this surface",
  "zone-degenerate": "the table reproduces at longitudes a whole civil-zone step apart and the record names no point, so only the latitude is fixed",
};

const records = [];
for (const s of surfaces) {
  const sol = solved.get(s.id);
  const pub = published[s.file];
  const rec = {
    id: s.id, op: s.op, workspace: s.workspace, file: s.file,
    country: (pub && pub.country) || (sol && sol.country) || null,
    rows: s.rows_n, first: s.first, last: s.last,
  };
  if (pub) {
    Object.assign(rec, {
      lat: pub.lat, lon: pub.lon, pointClass: pub.pointClass, timezone: pub.tz,
      source: pub.source,
    });
    if (pub.anchorName) rec.anchorName = pub.anchorName;
    if (pub.elevation !== undefined) rec.elevation = pub.elevation;
    if (pub.pointClass === "DERIVED" && sol && sol.rms !== undefined) {
      rec.derived = { rmsMin: sol.rms, days: sol.days, basis: sol.lonBasis, perColumn: sol.perColumn };
    }
  } else if (sol && sol.lat !== undefined && sol.status === "ok") {
    Object.assign(rec, {
      lat: sol.lat, lon: sol.lon, pointClass: "DERIVED", timezone: sol.tz,
      source: `solved from the surface's own ${sol.lonBasis === "dhuhr" ? "transit" : "horizon and asr"} columns; derive/solve.mjs`,
      derived: {
        rmsMin: sol.rms, biasMin: sol.bias, days: sol.days, basis: sol.lonBasis,
        sigmaLatDeg: sol.sigmaLat, sigmaLonDeg: sol.sigmaLon,
        perColumn: sol.perColumn, dhuhrBiasMin: sol.dhuhrBias,
        normalisedCells: sol.normalisedCells, clockShiftHours: sol.clockShiftHours,
        rowSource: sol.rowSource || "index",
        hint: sol.hintSource || null,
      },
    });
  } else {
    rec.pointClass = "UNKNOWN";
    rec.unknownStatus = sol ? sol.status : "no-rows";
    rec.unknownReason = REASON[rec.unknownStatus] || `solver status ${rec.unknownStatus}`;
    if (sol && sol.status === "zone-degenerate") {
      rec.lat = sol.lat;
      rec.lon = null;
      rec.lonAmbiguityDeg = 15;
      rec.lonIfFirstZone = sol.lon;
    }
    if (sol && sol.rms !== undefined) rec.derived = { rmsMin: sol.rms, days: sol.days, rejected: sol.status };
  }
  records.push(rec);
}

fs.writeFileSync(path.join(DATA, "..", "coords-ledger.json"), JSON.stringify(records, null, 0));

const byCountry = {};
for (const r of records) {
  const c = r.country || "??";
  const e = (byCountry[c] ||= { country: c, surfaces: 0, PUBLISHED: 0, DERIVED: 0, ANCHOR: 0, UNKNOWN: 0, zones: [], reasons: {} });
  e.surfaces++;
  e[r.pointClass]++;
  if (r.timezone && !e.zones.includes(r.timezone)) e.zones.push(r.timezone);
  if (r.pointClass === "UNKNOWN") e.reasons[r.unknownStatus] = (e.reasons[r.unknownStatus] || 0) + 1;
}
for (const e of Object.values(byCountry)) {
  e.usable = e.PUBLISHED + e.DERIVED + e.ANCHOR;
  e.bbox = BBOX[e.country] || null;
  e.declaredZones = ZONES[e.country] || [];
}
const order = Object.values(byCountry).sort((a, b) => b.surfaces - a.surfaces);
fs.writeFileSync(path.join(DATA, "by-country.json"), JSON.stringify(order, null, 1));

const tally = {};
for (const r of records) tally[r.pointClass] = (tally[r.pointClass] || 0) + 1;
console.log(JSON.stringify({ records: records.length, tally, countries: order.length }));
