// Fit the two countries the record still holds unfitted, from banked captures only.
// Every input is already in the archive; no network call is made and no clock is read.
import fs from "node:fs";
import path from "node:path";
import { fitOne, fitTwilights, amplitude, hhmm, solveLat, solveDip, rawColumns } from "./fitlib.mjs";

const DIR = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "data");
const load = (n) => JSON.parse(fs.readFileSync(path.join(DIR, n), "utf8"));
const results = {};
const stride = (rows, k) => Object.fromEntries(Object.entries(rows).filter((_, i) => i % k === 0));

// The depression angle a table implies, found by inverting its own column: for each day
// the angle that reproduces the printed value to the minute, then the median over a
// stride sample. This is what separates a real angle from a margin artefact.
function impliedAngle(rows, opt, col, range) {
  const sample = stride(rows, 10);
  const votes = [];
  for (let a = range[0]; a <= range[1] + 1e-9; a += 0.05) {
    const pass = rawColumns(sample, { ...opt, fajrAngle: col === "fajr" ? a : 18, ishaAngle: col === "isha" ? a : 17, hanafi: false });
    for (const p of pass) {
      const v = p.raw[col];
      if (!Number.isFinite(v)) continue;
      const d = Math.abs(v - hhmm(p.row[col]));
      if (d <= 1) votes.push(+a.toFixed(2));
    }
  }
  votes.sort((x, y) => x - y);
  return votes.length ? { median: votes[Math.floor(votes.length / 2)], n: votes.length, min: votes[0], max: votes[votes.length - 1] } : null;
}

// ---------- Belarus: islambel Minsk 2025 ----------
{
  const rows = load("by-islambel-minsk-2025.json");
  const pt = { lat: 53.9, lon: 27.5667, scheme: "gazetteer, corroborated by a second table" };
  const dip = solveDip(rows, { lat: pt.lat, lon: pt.lon, tz: "Europe/Minsk" });
  const clock = { lat: pt.lat, lon: pt.lon, tz: "Europe/Minsk", dip: dip.dip };
  const fa = impliedAngle(rows, clock, "fajr", [16, 20]);
  const ia = impliedAngle(rows, clock, "isha", [14, 18]);
  // From May to August the sun never reaches either angle at 53.9 N and the publisher
  // substitutes a night portion, so that block is scored separately, never fitted.
  const probe = rawColumns(rows, { ...clock, fajrAngle: fa.median, ishaAngle: ia.median, hanafi: false });
  const honest = {}, summer = {};
  for (const p of probe) {
    const df = Math.abs(p.raw.fajr - hhmm(p.row.fajr));
    const di = Math.abs(p.raw.isha - hhmm(p.row.isha));
    (Number.isFinite(p.raw.fajr) && Number.isFinite(p.raw.isha) && df <= 3 && di <= 3 ? honest : summer)[p.day] = p.row;
  }
  const opt = { ...clock, fajrAngle: fa.median, ishaAngle: ia.median, hanafi: false, ceil: { fajr: hhmm("07:16"), isha: hhmm("23:06") } };
  const r = fitOne(honest, opt);
  const all = fitOne(rows, opt);
  results.byIslambel = {
    surface: "Muslim Religious Association of Belarus, islambel.by/vremya-namazov",
    tier: "authority-tier national association",
    point: { ...pt, dip: dip.dip },
    span: "2025-01-01..2025-12-31",
    rows: Object.keys(rows).length, honestRows: Object.keys(honest).length, summerRows: Object.keys(summer).length,
    implied: { fajr: fa, isha: ia },
    recipe: r.recipe, cols: r.cols, joint: r.joint,
    wholeYearWithSubstitution: { rows: all.rows, ...all.joint, cols: all.cols },
    amplitude: amplitude(opt, 2025),
  };
  console.log("BY", JSON.stringify(fa), JSON.stringify(ia), "dip", dip.dip, JSON.stringify(r.recipe), JSON.stringify(r.joint));
}

// ---------- Lebanon: Dar al-Fatwa five regional tables, 2028 inferred ----------
{
  const regions = {};
  for (let i = 1; i <= 5; i++) {
    const rows = load(`lb-region${i}-2028-inferred.json`);
    // The payload prints standard time year-round: fixed UTC+2, never Asia/Beirut DST.
    const lon = 35.5;
    const pt = solveLat(rows, { lon, fixedOffset: 120, lat: [32.8, 34.8], step: 0.02, dip: [0, 1.5], dipStep: 0.05 });
    const clock = { lat: pt.lat, lon, fixedOffset: 120, dip: pt.dip };
    const fa = impliedAngle(rows, clock, "fajr", [14, 22]);
    const ia = impliedAngle(rows, clock, "isha", [14, 22]);
    const opt = { ...clock, fajrAngle: fa.median, ishaAngle: ia.median, hanafi: false };
    const r = fitOne(rows, opt);
    regions[`region${i}`] = {
      point: { ...pt, lon, scheme: "latitude from the table's own columns; longitude fixed at the country's mid-meridian (degenerate with the dhuhr margin)" },
      rows: r.rows, implied: { fajr: fa, isha: ia },
      recipe: r.recipe, cols: r.cols, joint: r.joint,
      amplitude: amplitude(opt, 2028),
    };
    console.log("LB", i, "lat", pt.lat, "dip", pt.dip, JSON.stringify(fa), JSON.stringify(ia), JSON.stringify(r.recipe), JSON.stringify(r.joint));
  }
  results.lbDarAlFatwa = {
    surface: "Dar al-Fatwa annual tables via the masjidi display platform",
    tier: "authority",
    url: "tv.masjidi.app/upload/json_prayers_times/prayer_times_region_json_{1..5}.json",
    clock: "fixed UTC+2 year-round (rendering shift)",
    yearBasis: "leap-shaped payload, 29 February seam after row 59: 2028, inferred not stated",
    regions,
  };
}

fs.writeFileSync(path.join(DIR, "..", "fits-stage1.json"), JSON.stringify(results, null, 1));
