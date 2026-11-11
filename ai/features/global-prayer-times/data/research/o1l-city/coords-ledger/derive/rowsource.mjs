// Fallback row reader. The census index normalises each surface to six column names; a table
// that names its columns fajr_athan / dhuhr_jamaah or syuruk / zohor loses all but sunrise
// there. When the index holds fewer than two solar columns, the surface's own file is read
// here and the same four columns are recovered by name.
import fs from "node:fs";

const FIELDS = {
  sunrise: ["sunrise", "sun_rise", "syuruk", "shuruq", "chourouk", "chorouk", "terbit"],
  dhuhr: ["dhuhr", "zuhr", "dhohr", "zohor", "dzuhur", "duhr", "dohr", "noon", "transit"],
  asr: ["asr", "aser", "ashar", "assr"],
  maghrib: ["maghrib", "magrib", "maghreb", "sunset", "iftar"],
};

const clock = (v) => {
  if (typeof v !== "string") return null;
  const m = v.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  const h = +m[1], mi = +m[2], s = +(m[3] || 0);
  const ap = v.match(/(am|pm|ص|م)/i);
  let hh = h;
  if (ap && /pm|م/i.test(ap[1]) && hh < 12) hh += 12;
  if (ap && /am|ص/i.test(ap[1]) && hh === 12) hh = 0;
  return `${String(hh).padStart(2, "0")}:${String(mi).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

// A column name may carry a suffix (dhuhr_athan, maghrib_jamaah) or a digit (asr2_mithl).
// An exact name wins over a suffixed one, so the Shafi asr is never replaced by asr2.
function fieldOf(key) {
  const lower = key.toLowerCase();
  const stem = (lower.match(/^[a-z]+/) || [""])[0];
  for (const [col, names] of Object.entries(FIELDS)) {
    if (names.includes(lower)) return { col, rank: 0 };
    if (names.includes(stem)) return { col, rank: /\d/.test(lower) ? 2 : 1 };
  }
  return null;
}

function fromRecord(obj) {
  const date = obj.date || obj.Date || obj.gregorian || obj.day;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(date)) return null;
  const row = { date: date.slice(0, 10) };
  const rank = {};
  for (const [k, v] of Object.entries(obj)) {
    const f = fieldOf(k);
    if (!f || row[f.col]) continue;
    const t = clock(v);
    if (!t) continue;
    row[f.col] = t;
    rank[f.col] = f.rank;
  }
  for (const [k, v] of Object.entries(obj)) {
    const f = fieldOf(k);
    if (!f || rank[f.col] === undefined || f.rank >= rank[f.col]) continue;
    const t = clock(v);
    if (t) { row[f.col] = t; rank[f.col] = f.rank; }
  }
  return Object.keys(row).length > 1 ? row : null;
}

function walk(node, out) {
  if (Array.isArray(node)) { for (const n of node) walk(n, out); return; }
  if (!node || typeof node !== "object") return;
  const keys = Object.keys(node);
  const dated = keys.filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k));
  if (dated.length) {
    for (const d of dated) {
      const row = { date: d };
      for (const [k, v] of Object.entries(node[d] || {})) {
        const f = fieldOf(k);
        if (f && !row[f.col]) row[f.col] = clock(v);
      }
      if (Object.keys(row).length > 1) out.push(row);
    }
    return;
  }
  const rec = fromRecord(node);
  if (rec) out.push(rec);
  for (const v of Object.values(node)) walk(v, out);
}

export function rowsFromFile(path) {
  try {
    const text = fs.readFileSync(path, "utf8");
    if (!text.trimStart().startsWith("{") && !text.trimStart().startsWith("[")) return [];
    const out = [];
    walk(JSON.parse(text), out);
    return out;
  } catch {
    return [];
  }
}
