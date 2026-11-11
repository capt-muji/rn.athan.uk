// Independent re-fit harness for the O1l verify round (agent O1l-71).
// Engine: adhan 4.4.6 at Rounding.None, second resolution, explicit per-column rounding.
// TZ never read from the ambient clock: offsets come from Intl for the named zone.

const HOME = process.env.HOME;
const ADHAN = `${HOME}/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js`;
import { readFileSync } from "node:fs";
export const adhan = await import(ADHAN);

export const PRAYERS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

const dtfCache = new Map();
function offsetSeconds(tz, date) {
  let dtf = dtfCache.get(tz);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    dtfCache.set(tz, dtf);
  }
  const p = {};
  for (const part of dtf.formatToParts(date)) p[part.type] = part.value;
  const asUTC = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour) % 24,
    Number(p.minute),
    Number(p.second)
  );
  return Math.round((asUTC - Math.floor(date.getTime() / 1000) * 1000) / 1000);
}

// Seconds after local midnight, float, for one date at one point.
export function localSeconds(instant, tz) {
  const sec = instant.getTime() / 1000;
  const off = offsetSeconds(tz, instant);
  return (((sec + off) % 86400) + 86400) % 86400;
}

export function dateAt(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export function rawTimes({ lat, lon, iso, tz, params }) {
  const pt = new adhan.PrayerTimes(
    new adhan.Coordinates(lat, lon),
    dateAt(iso),
    params
  );
  const out = {};
  for (const k of PRAYERS) out[k] = localSeconds(pt[k], tz);
  return out;
}

export function makeParams(fajrAngle, ishaAngle, adjustments = {}) {
  const p = new adhan.CalculationParameters("Other", fajrAngle, ishaAngle);
  p.rounding = adhan.Rounding.None;
  p.madhab = adhan.Madhab.Shafi;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  for (const [k, v] of Object.entries(adjustments)) p.adjustments[k] = v;
  return p;
}

export const ROUND = {
  nearest: (x) => Math.ceil(x - 0.5),
  ceil: (x) => Math.ceil(x),
  floorPlus1: (x) => Math.floor(x + 1),
  floor: (x) => Math.floor(x),
};

export function parseHM(s) {
  if (typeof s !== "string") return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function score(pairs) {
  // pairs: [{model, printed}] in minutes
  let n = 0, exact = 0, w1 = 0, worst = 0, sum = 0;
  for (const { model, printed } of pairs) {
    if (model == null || printed == null || Number.isNaN(model)) continue;
    const d = Math.abs(model - printed);
    n++;
    if (d < 1e-9) exact++;
    if (d <= 1 + 1e-9) w1++;
    if (d > worst) worst = d;
    sum += d;
  }
  return { n, exact, w1, worst, mae: n ? sum / n : null };
}

export function pct(a, b) {
  return b ? (100 * a) / b : null;
}

export function readJSON(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}
