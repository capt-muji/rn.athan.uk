// Recover the point a published table implies, from its own solar columns.
// Method: longitude from the transit (dhuhr), latitude by weighted least squares over
// sunrise and asr, then a joint local refinement. Every surface reports its residual so a
// reader can judge the point; a table that does not move with the sun gets no point at all.
import fs from "node:fs";
import path from "node:path";
import { solarPosition, toMin } from "./solar.mjs";
import { rowsFromFile } from "./rowsource.mjs";
import { countryOf, ZONES, BBOX } from "./countries.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const DATA = path.join(ROOT, "..", "data");
const RAD = Math.PI / 180;

const WEIGHT = { sunrise: 4, dhuhr: 4, asr: 1, maghrib: 2 };
const COLS = [["sunrise", "rise"], ["dhuhr", "noon"], ["asr", "asr"], ["maghrib", "set"]];

function loadSurfaces() {
  const lines = fs.readFileSync(path.join(DATA, "surfaces.psv"), "utf8").trim().split("\n").slice(1);
  return lines.map((l) => {
    const [id, op, workspace, file, p, rows_n, first, last] = l.split("|");
    return { id: +id, op, workspace, file, path: p, rows_n: +rows_n, first, last };
  });
}

function loadRows() {
  const by = new Map();
  const text = fs.readFileSync(path.join(DATA, "rows.psv"), "utf8");
  for (const line of text.split("\n")) {
    if (!line) continue;
    const [id, date, sunrise, dhuhr, asr, maghrib] = line.split("|");
    let arr = by.get(+id);
    if (!arr) by.set(+id, (arr = []));
    arr.push({ date, sunrise, dhuhr, asr, maghrib });
  }
  return by;
}

function offsetAt(tz, ymd) {
  const s = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" })
    .formatToParts(new Date(ymd + "T12:00:00Z")).find((p) => p.type === "timeZoneName").value;
  if (s === "GMT") return 0;
  const m = s.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) + Number(m[3] || 0) / 60) : 0;
}

function sample(rows, max = 80) {
  const usable = rows.filter((r) => r.sunrise || r.dhuhr || r.asr || r.maghrib);
  if (usable.length <= max) return usable;
  const step = usable.length / max;
  return Array.from({ length: max }, (_, i) => usable[Math.floor(i * step)]);
}

// One pass per (surface, zone): every per-date constant is computed once. A table that prints
// afternoon prayers on a 12-hour clock without a PM marker is normalised here, and the count
// of normalised cells is carried into the result.
const AFTERNOON = new Set(["dhuhr", "asr", "maghrib"]);

function prepare(days, tz) {
  let normalised = 0;
  const prep = days.map((d) => {
    const { dec, eot } = solarPosition(d.date, 12);
    const off = offsetAt(tz, d.date);
    const printed = {};
    for (const [col] of COLS) {
      let v = toMin(d[col]);
      if (v !== null && AFTERNOON.has(col) && v < 600) { v += 720; normalised++; }
      printed[col] = v;
    }
    return { dec, eot, off, printed };
  });
  prep.normalised = normalised;
  return prep;
}

function cost(prep, lat, lon, useDhuhr = true) {
  const sinLat = Math.sin(lat * RAD), cosLat = Math.cos(lat * RAD);
  let s = 0;
  for (const { dec, eot, off, printed } of prep) {
    const sinDec = Math.sin(dec * RAD), cosDec = Math.cos(dec * RAD);
    const noon = 12 - lon / 15 - eot / 60 + off;
    const altAsr = Math.atan(1 / (1 + Math.tan(Math.abs(lat - dec) * RAD))) / RAD;
    const alts = { rise: -0.833, asr: altAsr, set: -0.833 };
    for (const [col, key] of COLS) {
      const p = printed[col];
      if (p === null) continue;
      if (col === "dhuhr" && !useDhuhr) continue;
      let pred;
      if (key === "noon") pred = noon;
      else {
        const alt = alts[key];
        const cosH = (Math.sin(alt * RAD) - sinLat * sinDec) / (cosLat * cosDec);
        if (cosH < -1 || cosH > 1) { s += 1e6; continue; }
        const H = Math.acos(cosH) / RAD;
        pred = key === "rise" ? noon - H / 15 : noon + H / 15;
      }
      const r = p - pred * 60;
      s += WEIGHT[col] * r * r;
    }
  }
  return s;
}

function residuals(prep, lat, lon) {
  const sinLat = Math.sin(lat * RAD), cosLat = Math.cos(lat * RAD);
  const out = [];
  for (const { dec, eot, off, printed } of prep) {
    const sinDec = Math.sin(dec * RAD), cosDec = Math.cos(dec * RAD);
    const noon = 12 - lon / 15 - eot / 60 + off;
    const altAsr = Math.atan(1 / (1 + Math.tan(Math.abs(lat - dec) * RAD))) / RAD;
    const alts = { rise: -0.833, asr: altAsr, set: -0.833 };
    for (const [col, key] of COLS) {
      const p = printed[col];
      if (p === null) continue;
      let pred;
      if (key === "noon") pred = noon;
      else {
        const cosH = (Math.sin(alts[key] * RAD) - sinLat * sinDec) / (cosLat * cosDec);
        if (cosH < -1 || cosH > 1) continue;
        const H = Math.acos(cosH) / RAD;
        pred = key === "rise" ? noon - H / 15 : noon + H / 15;
      }
      out.push({ col, r: p - pred * 60 });
    }
  }
  return out;
}

function lonFromTransit(prep) {
  const est = prep.filter((d) => d.printed.dhuhr !== null)
    .map((d) => 15 * (12 - d.eot / 60 + d.off - d.printed.dhuhr / 60));
  return median(est);
}

// Longitude from the horizon pair: the midpoint of sunrise and sunset is the transit, and a
// symmetric pair of horizon margins leaves it untouched. Preferred where both columns exist,
// because a printed dhuhr margin is indistinguishable from a longitude shift.
function lonFromHorizon(prep) {
  const est = prep.filter((d) => d.printed.sunrise !== null && d.printed.maghrib !== null)
    .map((d) => 15 * (12 - d.eot / 60 + d.off - (d.printed.sunrise + d.printed.maghrib) / 120));
  return median(est);
}

function median(a) {
  if (!a.length) return null;
  a.sort((x, y) => x - y);
  return a[Math.floor(a.length / 2)];
}

function refine(prep, lat, lon, useDhuhr = true, steps = [0.1, 0.05, 0.02, 0.01, 0.005, 0.0025]) {
  let c = cost(prep, lat, lon, useDhuhr);
  for (const step of steps) {
    let moved = true;
    while (moved) {
      moved = false;
      for (const [dLat, dLon] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
        const nc = cost(prep, lat + dLat, lon + dLon, useDhuhr);
        if (nc < c - 1e-9) { lat += dLat; lon += dLon; c = nc; moved = true; }
      }
    }
  }
  return { lat, lon, c };
}

function summarise(rs) {
  const byCol = {};
  for (const { col, r } of rs) (byCol[col] ||= []).push(r);
  const perColumn = {};
  for (const [col, arr] of Object.entries(byCol)) {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const rms = Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length);
    perColumn[col] = { n: arr.length, bias: +mean.toFixed(2), rms: +rms.toFixed(2) };
  }
  const all = rs.map((x) => x.r);
  const mean = all.reduce((a, b) => a + b, 0) / all.length;
  const rms = Math.sqrt(all.reduce((a, b) => a + (b - mean) ** 2, 0) / all.length);
  return { perColumn, rms: +rms.toFixed(2), bias: +mean.toFixed(2) };
}

const surfaces = loadSurfaces();
const rows = loadRows();
const HINTS = fs.existsSync(path.join(DATA, "hints.json"))
  ? JSON.parse(fs.readFileSync(path.join(DATA, "hints.json"), "utf8")) : {};
const results = [];

for (const s of surfaces) {
  let all = rows.get(s.id) || [];
  const country = countryOf(s.workspace, s.file);
  const rec = { id: s.id, op: s.op, workspace: s.workspace, file: s.file, country };
  const solarCols = (rowsIn) => new Set(rowsIn.flatMap((r) =>
    ["sunrise", "dhuhr", "asr", "maghrib"].filter((c) => r[c]))).size;
  if (solarCols(all) < 2) {
    const alt = rowsFromFile(s.path);
    if (solarCols(alt) > solarCols(all)) { all = alt; rec.rowSource = "file"; }
  }
  const days = sample(all);
  const varies = all.length > 5 && new Set(all.map((r) => r.sunrise || r.maghrib || r.dhuhr).filter(Boolean)).size > 5;

  if (!country || !days.length || !varies) {
    rec.status = !country ? "no-country" : !days.length ? "no-rows" : "not-solar";
    rec.days = all.length;
    results.push(rec);
    continue;
  }

  const fitAt = (tz, shift) => {
    const prep = prepare(days, tz);
    if (shift) for (const d of prep) d.off += shift;
    const lonDh = lonFromTransit(prep);
    const lonMid = lonFromHorizon(prep);
    const others = new Set(days.flatMap((d) => ["sunrise", "maghrib", "asr"].filter((c) => toMin(d[c]) !== null)));
    // The transit column is used only when no other pair of columns can pin the longitude: a
    // printed dhuhr margin is indistinguishable from a longitude shift, and biases it by
    // margin/4 degrees. Two horizon-or-asr columns determine lat and lon on their own.
    const useDhuhr = others.size < 2;
    const lon0 = lonMid ?? lonDh;
    if (lon0 === null) return null;
    const hint = HINTS[s.file];
    // A different civil offset is an exact solar degeneracy: the same table fits at a point
    // 15 degrees per hour away. Where the record names the city's own point, start the search
    // there instead, so the solver keeps the record's zone band.
    const startLon = hint && Math.abs(lon0 - hint.lon) > 5 ? hint.lon : lon0;
    let lat0 = 0, c0 = Infinity;
    for (let lat = -60; lat <= 60; lat += 0.5) {
      const c = cost(prep, lat, startLon, useDhuhr);
      if (c < c0) { c0 = c; lat0 = lat; }
    }
    const fit = refine(prep, lat0, startLon, useDhuhr);
    const all = residuals(prep, fit.lat, fit.lon);
    const used = useDhuhr ? all : all.filter((x) => x.col !== "dhuhr");
    const summary = summarise(used);
    // Identifiability, measured: a quadratic fit through cost at +-1 degree gives the 1-sigma
    // uncertainty of each coordinate. A single month of a flat-season table cannot separate
    // latitude from the seasonal curve, and this is what says so.
    const nRes = used.length;
    const aLat = (cost(prep, fit.lat + 1, fit.lon, useDhuhr) + cost(prep, fit.lat - 1, fit.lon, useDhuhr)) / 2 - fit.c;
    const aLon = (cost(prep, fit.lat, fit.lon + 1, useDhuhr) + cost(prep, fit.lat, fit.lon - 1, useDhuhr)) / 2 - fit.c;
    const sigma = (a) => (a > 1e-6 && nRes > 0 ? Math.sqrt(Math.max(fit.c, 0) / nRes / a) : 99);
    const dh = all.filter((x) => x.col === "dhuhr");
    return {
      tz, lat: +fit.lat.toFixed(3), lon: +fit.lon.toFixed(3), ...summary,
      sigmaLat: +sigma(aLat).toFixed(2), sigmaLon: +sigma(aLon).toFixed(2),
      lonTransit: lonDh === null ? null : +lonDh.toFixed(3),
      lonHorizon: lonMid === null ? null : +lonMid.toFixed(3),
      lonBasis: useDhuhr ? "dhuhr" : lonMid !== null ? "horizon" : "solar-columns",
      normalisedCells: prep.normalised,
      clockShiftHours: shift || 0,
      dhuhrBias: dh.length ? +(dh.reduce((a, b) => a + b.r, 0) / dh.length).toFixed(2) : null,
      hintSource: hint ? hint.source : null,
      hintApplied: hint ? Math.abs(lon0 - hint.lon) > 5 : false,
    };
  };

  const hint = HINTS[s.file];
  const scoreOf = (c) => {
    const box = BBOX[country];
    const inside = !box || (c.lat >= box[0] - 2 && c.lat <= box[1] + 2
      && c.lon >= box[2] - 2 && c.lon <= box[3] + 2);
    const atHint = hint && Math.abs(c.lat - hint.lat) < 3 && Math.abs(c.lon - hint.lon) < 3;
    return (inside ? 0 : 1e6) + c.rms - (atHint ? 1000 : 0);
  };

  const insideOf = (c) => {
    const box = BBOX[country];
    return !box || (c.lat >= box[0] - 2 && c.lat <= box[1] + 2
      && c.lon >= box[2] - 2 && c.lon <= box[3] + 2);
  };

  let best = null;
  for (const tz of ZONES[country] || []) {
    const cand = fitAt(tz, 0);
    if (cand && (!best || scoreOf(cand) < scoreOf(best))) best = cand;
  }
  // A table printed on a fixed offset that is not its country's civil zone still implies one
  // point; the shift that makes it solar is the table's clock defect, recorded, never hidden.
  if (best && (best.rms > 5 || !insideOf(best))) {
    for (const tz of ZONES[country] || []) {
      for (let shift = -3; shift <= 3; shift++) {
        if (!shift) continue;
        const cand = fitAt(tz, shift);
        if (cand && scoreOf(cand) < scoreOf(best) - 0.5) best = cand;
      }
    }
  }

  // A table printed in one civil zone reproduces exactly in any zone 15 degrees per hour away.
  // Without a point named by the record, such a surface fixes its latitude and leaves the
  // longitude ambiguous; that is reported, never papered over with the first zone in the list.
  let zoneDegenerate = false;
  if (best && (ZONES[country] || []).length > 1 && !best.hintSource) {
    for (const tz of ZONES[country]) {
      if (tz === best.tz) continue;
      const cand = fitAt(tz, 0);
      if (cand && Math.abs(cand.lon - best.lon) > 5 && cand.rms <= best.rms + 0.5) {
        zoneDegenerate = true;
        break;
      }
    }
  }

  rec.days = all.length;
  if (!best) { rec.status = "no-transit"; results.push(rec); continue; }
  Object.assign(rec, best);
  rec.zoneDegenerate = zoneDegenerate;
  const box = BBOX[country];
  const inside = !box || (best.lat >= box[0] - 2 && best.lat <= box[1] + 2
    && best.lon >= box[2] - 2 && best.lon <= box[3] + 2);
  const basesDisagree = best.lonTransit !== null && best.lonHorizon !== null
    && Math.abs(best.lonTransit - best.lonHorizon) > 2;
  rec.insideBbox = inside;
  rec.basesDisagree = basesDisagree;
  rec.status = !inside ? "outside-bbox"
    : all.length < 20 ? "too-few-days"
      : basesDisagree ? "bases-disagree"
        : zoneDegenerate ? "zone-degenerate"
          : best.rms > 60 ? "not-solar"
            : "ok";
  results.push(rec);
}

fs.writeFileSync(path.join(DATA, "solved.json"), JSON.stringify(results));
const tally = {};
for (const r of results) tally[r.status] = (tally[r.status] || 0) + 1;
console.log(JSON.stringify(tally));
