// Stage 2: Yemen (both authority feeds and the platform layer), Qatar (the Jamiat month
// and the platform layer) and Singapore (MUIS 2027 against the record's A fit).
import fs from "node:fs";
import path from "node:path";
import { fitOne, fitTwilights, amplitude, hhmm, solveLat } from "./fitlib.mjs";

const DIR = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "data");
const load = (n) => JSON.parse(fs.readFileSync(path.join(DIR, n), "utf8"));
const out = {};

const { rawColumns } = await import("./fitlib.mjs");

function impliedAngle(rows, opt, col, range) {
  const votes = [];
  for (let a = range[0]; a <= range[1] + 1e-9; a += 0.05) {
    const pass = rawColumns(rows, {
      ...opt, fajrAngle: col === "fajr" ? a : 18, ishaAngle: col === "isha" ? a : 17, hanafi: false,
    });
    for (const p of pass) {
      const v = p.raw[col];
      if (!Number.isFinite(v)) continue;
      if (Math.abs(v - hhmm(p.row[col])) <= 1) votes.push(+a.toFixed(2));
    }
  }
  votes.sort((x, y) => x - y);
  return votes.length ? { median: votes[Math.floor(votes.length / 2)], n: votes.length, min: votes[0], max: votes[votes.length - 1] } : null;
}

// ---------- Yemen: Sanaa awqaf, the Sanaa and Aden rows at their own published points ----------
// The feed serves 31 named locations for a nine-day rolling window. Nine days cannot
// separate latitude from horizon dip, and the feed publishes no per-location coordinates,
// so only the two locations whose points the record already carries are fitted here.
{
  const locs = load("ye-sanaa-locations.json");
  const fixed = { loc27: { place: "Sanaa", lat: 15.3694, lon: 44.191 }, loc28: { place: "Aden", lat: 12.7855, lon: 45.0187 } };
  const per = {};
  for (const [id, pt] of Object.entries(fixed)) {
    const l = locs.find((x) => x.id === id);
    const rows = load(`ye-sanaa-${id}.json`);
    const clock = { lat: pt.lat, lon: pt.lon, tz: "Asia/Aden" };
    const fa = impliedAngle(rows, clock, "fajr", [14, 22]);
    const ia = impliedAngle(rows, clock, "isha", [12, 20]);
    const opt = { ...clock, fajrAngle: fa.median, ishaAngle: ia.median, hanafi: false };
    const r = fitOne(rows, opt);
    per[id] = { place: pt.place, name: l.name, days: l.days, point: pt, implied: { fajr: fa, isha: ia }, recipe: r.recipe, cols: r.cols, joint: r.joint };
    console.log("YE", pt.place, JSON.stringify(fa), JSON.stringify(ia), JSON.stringify(r.recipe), JSON.stringify(r.joint));
  }
  out.yeSanaa = {
    surface: "Awqaf and Religious Guidance (Sanaa), tebyan prayer panel API",
    tier: "authority", url: "awqaf.gov.ye/api/method/...get_page_data?fetch_date=",
    span: "2026-11-01..2026-11-09 (nine-day rolling retention)",
    locations: locs.length, rows: locs.reduce((a, l) => a + l.days, 0),
    fitted: per,
    unfitted: "29 further locations: nine-day windows, no published per-location coordinates, so no per-location fit is claimed",
  };
}

// ---------- Yemen: Aden ministry month ----------
{
  const rows = load("ye-aden-nov2026.json");
  const pt = { lat: 12.7855, lon: 45.0187, scheme: "gazetteer (the ministry publishes none)" };
  const dip = { dip: 0 };
  const clock = { ...pt, tz: "Asia/Aden", dip: dip.dip };
  const fa = impliedAngle(rows, clock, "fajr", [14, 22]);
  const ia = impliedAngle(rows, clock, "isha", [12, 20]);
  const opt = { ...clock, fajrAngle: fa.median, ishaAngle: ia.median, hanafi: false };
  const r = fitOne(rows, opt);
  out.yeAden = {
    surface: "Ministry of Awqaf and Guidance (Aden), yemenawqaf.org/prayer-times",
    tier: "authority", span: "2026-11-01..2026-11-30", rows: r.rows, point: pt,
    implied: { fajr: fa, isha: ia }, recipe: r.recipe, cols: r.cols, joint: r.joint,
    amplitude: amplitude(opt, 2026),
  };
  console.log("YE-ADEN", JSON.stringify(fa), JSON.stringify(ia), JSON.stringify(r.recipe), JSON.stringify(r.joint));
}

// ---------- Qatar: Jamiat perpetual Doha month ----------
{
  const rows = load("qa-jamiat-doha-2026-11.json");
  const meta = load("qa-jamiat-meta.json");
  const base = { lat: meta.lat, lon: meta.lon, fixedOffset: meta.offset * 60 };
  const fa = impliedAngle(rows, base, "fajr", [14, 22]);
  const ia = impliedAngle(rows, base, "isha", [12, 20]);
  const opt = { ...base, fajrAngle: fa.median, ishaAngle: ia.median, hanafi: false };
  const r = fitOne(rows, opt);
  out.qaJamiat = {
    surface: "Jamiat perpetual table for Doha (salaahtimes.starlite.za.net)", tier: "community",
    point: { lat: meta.lat, lon: meta.lon, scheme: "published on the table" },
    span: "2026-11-01..2026-11-30", rows: r.rows,
    implied: { fajr: fa, isha: ia }, recipe: r.recipe, cols: r.cols, joint: r.joint,
    amplitude: amplitude(opt, 2026),
  };
  console.log("QA-JAMIAT", JSON.stringify(fa), JSON.stringify(ia), JSON.stringify(r.recipe), JSON.stringify(r.joint));
}

// ---------- Platform layer: Qatar, Yemen, Singapore ----------
for (const [key, file, label] of [["qaPlatform", "platform-qatar.json", "Qatar"], ["yePlatform", "platform-yemen.json", "Yemen"], ["sgPlatform", "platform-singapore.json", "Singapore"]]) {
  const cities = load(file);
  const per = {};
  for (const [slug, c] of Object.entries(cities)) {
    const fa = impliedAngle(c.rows, { lat: c.lat, lon: c.lon, tz: c.tz }, "fajr", [14, 22]);
    const ia = impliedAngle(c.rows, { lat: c.lat, lon: c.lon, tz: c.tz }, "isha", [12, 20]);
    if (!fa || !ia) { per[slug] = { city: c.city, method: c.method, implied: { fajr: fa, isha: ia }, closed: "no single angle reproduces the column" }; continue; }
    const opt = { lat: c.lat, lon: c.lon, tz: c.tz, fajrAngle: fa.median, ishaAngle: ia.median, hanafi: false };
    const r = fitOne(c.rows, opt);
    per[slug] = { city: c.city, method: c.method, lat: c.lat, lon: c.lon, implied: { fajr: fa, isha: ia }, recipe: r.recipe, joint: r.joint, cols: r.cols };
  }
  out[key] = { surface: "athanpro.com platform tables", tier: "platform", span: "2026-09-01..2026-09-30", per };
  console.log(label.toUpperCase() + "-PLATFORM", Object.values(per).map((p) => `${p.city} ${p.implied.fajr?.median}/${p.implied.isha?.median} ${p.joint ? p.joint.within1 + "/" + p.joint.of : "closed"}`).join(", "));
}

// ---------- Singapore: MUIS 2027 ----------
{
  const rows = load("sg-muis-2027.json");
  const base = { lat: 1.3521, lon: 103.8198, tz: "Asia/Singapore" };
  const fa = impliedAngle(rows, base, "fajr", [16, 22]);
  const ia = impliedAngle(rows, base, "isha", [14, 20]);
  const opt = { ...base, fajrAngle: fa.median, ishaAngle: ia.median, hanafi: false };
  const r = fitOne(rows, opt);
  out.sgMuis = {
    surface: "MUIS Prayer Timetable 2027 (isomer-user-content PDF)", tier: "authority",
    span: "2027-01-01..2027-12-31", rows: r.rows,
    implied: { fajr: fa, isha: ia }, recipe: r.recipe, cols: r.cols, joint: r.joint,
    amplitude: amplitude(opt, 2027),
  };
  console.log("SG", JSON.stringify(fa), JSON.stringify(ia), JSON.stringify(r.recipe), JSON.stringify(r.joint));
}

fs.writeFileSync(path.join(DIR, "..", "fits-stage2.json"), JSON.stringify(out, null, 1));
