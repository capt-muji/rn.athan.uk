#!/usr/bin/env node
// Parse every ESA monthly capture -> data/eg-esa-<idx>-2026.json
const fs = require("fs");
const W = process.env.HOME + "/athan-gitree/census/o1l-city/egypt-82";
const COLS = ["fajr", "sunrise", "dhuhr", "asr", "magrib", "isha"];
const state = JSON.parse(fs.readFileSync(W + "/captures/eg-formstate.json", "utf8"));

function to24(t) {
  const m = t.trim().match(/(\d{1,2}):(\d{1,2})\s*([صم])/);
  if (!m) throw new Error("bad time: " + JSON.stringify(t));
  let h = parseInt(m[1], 10);
  const min = m[2];
  const am = m[3] === "ص";
  if (am && h === 12) h = 0;
  if (!am && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${min.padStart(2, "0")}`;
}
const normAr = (s) => s.replace(/\u0640/g, "").replace(/[\u064B-\u0652]/g, "").trim();

function parse(file) {
  const html = fs.readFileSync(file, "utf8");
  let table = null;
  for (const m of html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)) {
    if (m[1].includes("فجر")) { table = m[1]; break; }
  }
  if (!table) throw new Error("no table in " + file);
  const out = {};
  let city = null, n = 0;
  for (const row of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) =>
      c[1].replace(/<[^>]+>/g, "").trim());
    if (cells.length < 9) continue;
    const date = cells[1];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    city = normAr(cells[0]);
    const times = cells.slice(3, 9).map(to24);
    out[date] = {};
    COLS.forEach((k, i) => { out[date][k] = times[i]; });
    n++;
  }
  return { out, n, city };
}

const manifest = [];
for (let i = 0; i < state.cities.length; i++) {
  const c = state.cities[i];
  const all = {};
  const missing = [];
  for (let m = 1; m <= 12; m++) {
    const f = `${W}/captures/eg-esa-2026-${String(m).padStart(2, "0")}-city${String(i).padStart(2, "0")}.html`;
    if (!fs.existsSync(f)) { missing.push(m); continue; }
    let r; try { r = parse(f); } catch (e) { missing.push(m); continue; }
    const { out, n, city } = r;
    if (n === 0) { missing.push(m); continue; }
    if (normAr(c.key) !== city) throw new Error(`city echo mismatch idx ${i}: ${city} vs ${c.key}`);
    Object.assign(all, out);
  }
  const days = Object.keys(all).sort();
  fs.writeFileSync(`${W}/data/eg-esa-${String(i).padStart(2, "0")}-2026.json`, JSON.stringify(all, null, 1));
  manifest.push({ i, key: c.key, days: days.length, first: days[0] || null, last: days.at(-1) || null, missingMonths: missing });
}
fs.writeFileSync(`${W}/data/manifest.json`, JSON.stringify(manifest, null, 1));
const bad = manifest.filter((m) => m.days < 360);
console.log(`cities ${manifest.length}, total days ${manifest.reduce((a, m) => a + m.days, 0)}`);
console.log(`cities with <360 days: ${bad.length}`);
for (const m of bad) console.log(" ", m.i, m.key, m.days, m.first, m.last, "missing", m.missingMonths.join(","));
