// Shared fitter. Engine: adhan 4.4.6, Rounding.None at second resolution, explicit
// per-column rounding and margin applied afterwards. Clock comes from the literal
// capture dates and a pinned zone, never from the machine clock.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const BASE = "$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs";
const { Coordinates, CalculationMethod, PrayerTimes, Madhab, Rounding } = require(BASE + "/Adhan.js");
const SolarTime = require(BASE + "/SolarTime.js").default;
const TimeComponents = require(BASE + "/TimeComponents.js").default;

export const COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

export function tzOffset(date, tz) {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, hour12: false, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p = Object.fromEntries(f.formatToParts(date).filter((x) => x.type !== "literal")
    .map((x) => [x.type, x.value]));
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return Math.round((asUTC - date.getTime()) / 60000);
}

export function hhmm(v) {
  const [h, m] = String(v).trim().split(":").map(Number);
  return h * 60 + m;
}

export function diff(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Infinity;
  const d = Math.abs(a - b) % 1440;
  return Math.min(d, 1440 - d);
}

export function applyRounding(minutes, mode) {
  if (!Number.isFinite(minutes)) return NaN;
  if (mode === "floor") return Math.floor(minutes);
  if (mode === "ceil") return Math.ceil(minutes);
  return Math.round(minutes);
}

// One pass over every dated row, returning raw minute-of-day per column.
// The twilight columns are taken from the solar hour angle directly: adhan's
// PrayerTimes substitutes a night-portion value when the angle is unreachable,
// which would hide the publisher's own cap behind a phantom rule.
export function rawColumns(rows, opt) {
  const { lat, lon, fajrAngle, ishaAngle, ishaInterval, hanafi, tz, fixedOffset, dip } = opt;
  const out = [];
  for (const [day, row] of Object.entries(rows).sort()) {
    const offMin = fixedOffset != null ? fixedOffset : tzOffset(new Date(day + "T00:00:00Z"), tz);
    const date = new Date(day + "T00:00:00Z");
    const params = CalculationMethod.MuslimWorldLeague();
    params.fajrAngle = fajrAngle;
    params.ishaAngle = ishaAngle;
    params.rounding = Rounding.None;
    const coords = new Coordinates(lat, lon);
    const pt = new PrayerTimes(coords, date, params);
    pt.madhab = hanafi ? Madhab.Hanafi : Madhab.Shafi;
    const st = new SolarTime(date, coords);
    const y = date.getUTCFullYear(), m = date.getUTCMonth(), d = date.getUTCDate();
    const fajrDate = new TimeComponents(st.hourAngle(-1 * fajrAngle, false)).utcDate(y, m, d);
    const ishaDate = ishaInterval != null
      ? new Date(pt.maghrib.getTime() + ishaInterval * 60000)
      : new TimeComponents(st.hourAngle(-1 * ishaAngle, true)).utcDate(y, m, d);
    // A published horizon dip moves sunrise later and sunset earlier by the same angle.
    // adhan passes the horizon depression as a negative altitude, so the sign must match.
    const sunDate = dip != null
      ? new TimeComponents(st.hourAngle(-(0.833 + dip), false)).utcDate(y, m, d) : pt.sunrise;
    const setDate = dip != null
      ? new TimeComponents(st.hourAngle(-(0.833 + dip), true)).utcDate(y, m, d) : pt.maghrib;
    const raw = {};
    const times = {
      fajr: fajrDate, sunrise: sunDate, dhuhr: pt.dhuhr,
      asr: pt.asr, maghrib: setDate, isha: ishaDate,
    };
    for (const col of COLS) {
      const v = times[col].getTime() / 60000 + offMin;
      raw[col] = Number.isFinite(v) ? ((v % 1440) + 1440) % 1440 : NaN;
    }
    out.push({ day, row, raw });
  }
  return out;
}

// Score one column given margin/rounding, honouring an optional absolute ceiling in
// minutes. The ceiling is the publisher's printed cap and does not move with the margin.
export function scoreColumn(pass, col, margin, mode, ceil) {
  let exact = 0, within1 = 0, worst = 0, n = 0, signed = 0, capped = 0;
  for (const { row, raw } of pass) {
    let v = raw[col] + margin;
    if (ceil != null && (!Number.isFinite(v) || v > ceil)) { v = ceil; capped++; }
    const got = applyRounding(v, mode);
    const want = hhmm(row[col]);
    const d = diff(got, want);
    if (d === 0) exact++;
    if (d <= 1) within1++;
    if (d < Infinity) signed += got - want;
    worst = Math.max(worst, d);
    n++;
  }
  return { exact, within1, worst, n, capped, signedMean: n ? +(signed / n).toFixed(2) : null };
}

const MARGINS = [-8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 10];
const MODES = ["nearest", "floor", "ceil"];

export function bestColumn(pass, col, ceil) {
  let best = null;
  for (const mode of MODES) {
    for (const margin of MARGINS) {
      const s = scoreColumn(pass, col, margin, mode, ceil);
      const better = !best || s.within1 > best.s.within1 ||
        (s.within1 === best.s.within1 && s.exact > best.s.exact) ||
        (s.within1 === best.s.within1 && s.exact === best.s.exact && Math.abs(margin) < Math.abs(best.margin));
      if (better) best = { s, margin, mode };
    }
  }
  return best;
}

export function fitOne(rows, opt) {
  const pass = rawColumns(rows, opt);
  const per = {};
  for (const col of COLS) per[col] = bestColumn(pass, col, opt.ceil ? opt.ceil[col] : null);
  const joint = { exact: 0, within1: 0, of: 0, worst: 0 };
  for (const { row, raw } of pass) {
    let worst = 0;
    for (const col of COLS) {
      if (col === "sunrise") continue;
      const { margin, mode } = per[col];
      const ceil = opt.ceil ? opt.ceil[col] : null;
      let v = raw[col] + margin;
      if (ceil != null && (!Number.isFinite(v) || v > ceil)) v = ceil;
      worst = Math.max(worst, diff(applyRounding(v, mode), hhmm(row[col])));
    }
    joint.of++;
    if (worst === 0) joint.exact++;
    if (worst <= 1) joint.within1++;
    joint.worst = Math.max(joint.worst, worst);
  }
  const recipe = {
    fajrAngle: opt.fajrAngle,
    ishaAngle: opt.ishaInterval != null ? null : opt.ishaAngle,
    ishaInterval: opt.ishaInterval ?? null,
    asr: opt.hanafi ? "Hanafi" : "Shafi",
    margins: Object.fromEntries(COLS.map((c) => [c, per[c].margin])),
    rounding: Object.fromEntries(COLS.map((c) => [c, per[c].mode])),
    ceil: opt.ceil ?? null,
  };
  const cols = Object.fromEntries(COLS.map((c) => [c, {
    exact: per[c].s.exact, within1: per[c].s.within1, n: per[c].s.n,
    worst: per[c].s.worst, capped: per[c].s.capped, signedMean: per[c].s.signedMean,
  }]));
  return { recipe, cols, joint, rows: pass.length };
}

// The two twilight columns depend on their own angle alone, so the joint optimum
// decomposes: scan each angle against its own column, then score everything at the pair.
export function fitTwilights(rows, base, faRange, iaRange, schools = [false, true]) {
  const step = 0.05;
  let best = null;
  for (const hanafi of schools) {
    let bestFajr = null, bestIsha = null;
    for (let fa = faRange[0]; fa <= faRange[1] + 1e-9; fa += step) {
      const pass = rawColumns(rows, { ...base, fajrAngle: +fa.toFixed(2), ishaAngle: 17, hanafi });
      const b = bestColumn(pass, "fajr", base.ceil ? base.ceil.fajr : null);
      const better = !bestFajr || b.s.within1 > bestFajr.s.within1 ||
        (b.s.within1 === bestFajr.s.within1 && b.s.exact > bestFajr.s.exact);
      if (better) bestFajr = { ...b, angle: +fa.toFixed(2) };
    }
    for (let ia = iaRange[0]; ia <= iaRange[1] + 1e-9; ia += step) {
      const pass = rawColumns(rows, { ...base, fajrAngle: 18, ishaAngle: +ia.toFixed(2), hanafi });
      const b = bestColumn(pass, "isha", base.ceil ? base.ceil.isha : null);
      const better = !bestIsha || b.s.within1 > bestIsha.s.within1 ||
        (b.s.within1 === bestIsha.s.within1 && b.s.exact > bestIsha.s.exact);
      if (better) bestIsha = { ...b, angle: +ia.toFixed(2) };
    }
    const r = fitOne(rows, {
      ...base, fajrAngle: bestFajr.angle, ishaAngle: bestIsha.angle, hanafi,
    });
    const better = !best || r.joint.within1 > best.joint.within1 ||
      (r.joint.within1 === best.joint.within1 && r.joint.exact > best.joint.exact);
    if (better) best = r;
  }
  return best;
}

// Solve the reference point from the surface's own solar columns: latitude from the
// day length and asr shadow, longitude from the dhuhr transit. Reported as DERIVED.
export function solvePoint(rows, opt) {
  const cols = opt.cols ?? ["sunrise", "dhuhr", "maghrib", "asr"];
  const step = opt.step ?? 0.05;
  let best = null;
  for (let lat = opt.lat[0]; lat <= opt.lat[1] + 1e-9; lat += step) {
    for (let lon = opt.lon[0]; lon <= opt.lon[1] + 1e-9; lon += step) {
      const pass = rawColumns(rows, { ...opt, lat: +lat.toFixed(2), lon: +lon.toFixed(2), fajrAngle: 18, ishaAngle: 17, hanafi: false });
      let sum = 0, worst = 0, n = 0;
      for (const { row, raw } of pass) {
        for (const col of cols) {
          const d = diff(Math.round(raw[col]), hhmm(row[col]));
          sum += d; worst = Math.max(worst, d); n++;
        }
      }
      const mae = sum / n;
      if (!best || mae < best.mae) best = { lat: +lat.toFixed(2), lon: +lon.toFixed(2), mae: +mae.toFixed(3), worst };
    }
  }
  return best;
}

// Point search scored on SHAPE, not on absolute offset: a published table may carry a
// constant margin on every column, which would otherwise drag the point away. Residuals
// are taken against their own median, so only the seasonal geometry is scored.
export function solveShape(rows, opt) {
  const cols = opt.cols ?? ["sunrise", "maghrib", "dhuhr", "asr"];
  const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  let best = null;
  for (let lat = opt.lat[0]; lat <= opt.lat[1] + 1e-9; lat += opt.step) {
    for (let lon = opt.lon[0]; lon <= opt.lon[1] + 1e-9; lon += opt.step) {
      for (let dip = opt.dip[0]; dip <= opt.dip[1] + 1e-9; dip += opt.dipStep) {
        const pass = rawColumns(rows, {
          ...opt, lat: +lat.toFixed(2), lon: +lon.toFixed(2), dip: +dip.toFixed(2),
          fajrAngle: 18, ishaAngle: 17, hanafi: false,
        });
        let sum = 0, n = 0, worst = 0;
        for (const col of cols) {
          const res = pass.map((p) => {
            const d = p.raw[col] - hhmm(p.row[col]);
            return d > 720 ? d - 1440 : d < -720 ? d + 1440 : d;
          });
          const m = median(res);
          for (const r of res) { const a = Math.abs(r - m); sum += a; worst = Math.max(worst, a); n++; }
        }
        const mae = sum / n;
        if (!best || mae < best.mae) best = { lat: +lat.toFixed(2), lon: +lon.toFixed(2), dip: +dip.toFixed(2), mae: +mae.toFixed(3), worst: +worst.toFixed(1) };
      }
    }
  }
  return best;
}
// Latitude-only solve at a fixed longitude. Longitude is degenerate with the dhuhr
// margin on every zone-degenerate surface, so it is never claimed from the columns.
export function solveLat(rows, opt) {
  const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  const cols = opt.cols ?? ["sunrise", "maghrib", "asr"];
  let best = null;
  for (let lat = opt.lat[0]; lat <= opt.lat[1] + 1e-9; lat += opt.step) {
    for (let dip = opt.dip[0]; dip <= opt.dip[1] + 1e-9; dip += opt.dipStep) {
      const pass = rawColumns(rows, {
        ...opt, lat: +lat.toFixed(2), dip: +dip.toFixed(2), fajrAngle: 18, ishaAngle: 17, hanafi: false,
      });
      let sum = 0, n = 0, worst = 0;
      for (const col of cols) {
        const res = pass.map((p) => {
          const d = p.raw[col] - hhmm(p.row[col]);
          return d > 720 ? d - 1440 : d < -720 ? d + 1440 : d;
        });
        const m = median(res);
        for (const r of res) { const a = Math.abs(r - m); sum += a; worst = Math.max(worst, a); n++; }
      }
      const mae = sum / n;
      if (!best || mae < best.mae) best = { lat: +lat.toFixed(2), dip: +dip.toFixed(2), mae: +mae.toFixed(3), worst: +worst.toFixed(1) };
    }
  }
  return best;
}

// Median dhuhr residual at a trial point: the longitude that makes it zero is the point
// the table would print at if it carried no dhuhr margin. Reported, never asserted.
export function dhuhrResidual(rows, opt) {
  const res = rawColumns(rows, { ...opt, fajrAngle: 18, ishaAngle: 17, hanafi: false })
    .map((p) => { const d = p.raw.dhuhr - hhmm(p.row.dhuhr); return d > 720 ? d - 1440 : d < -720 ? d + 1440 : d; })
    .sort((a, b) => a - b);
  return res[Math.floor(res.length / 2)];
}

export function solveDip(rows, opt) {
  let best = null;
  for (let dip = 0; dip <= 2.5 + 1e-9; dip += 0.05) {    const pass = rawColumns(rows, { ...opt, dip: +dip.toFixed(2), fajrAngle: 18, ishaAngle: 17, hanafi: false });
    let sum = 0, n = 0, worst = 0;
    for (const { row, raw } of pass) {
      const d = diff(Math.round(raw.sunrise), hhmm(row.sunrise));
      sum += d; worst = Math.max(worst, d); n++;
    }
    if (!best || sum / n < best.mae) best = { dip: +dip.toFixed(2), mae: +(sum / n).toFixed(3), worst };
  }
  return best;
}

// Seasonal amplitude of the fitted recipe at its own point: Jan 15 vs Jul 15 fajr.
export function amplitude(opt, year) {
  const blank = { fajr: "00:00", sunrise: "00:00", dhuhr: "00:00", asr: "00:00", maghrib: "00:00", isha: "00:00" };
  const pass = rawColumns({ [`${year}-01-15`]: blank, [`${year}-07-15`]: blank }, opt);
  const jan = pass[0].raw.fajr, jul = pass[1].raw.fajr;
  return {
    fajrJan: Number.isFinite(jan) ? +(jan % 1440).toFixed(1) : null,
    fajrJul: Number.isFinite(jul) ? +(jul % 1440).toFixed(1) : null,
    fajrAmplitude: Number.isFinite(jan) && Number.isFinite(jul) ? +(Math.abs(jan - jul)).toFixed(1) : null,
  };
}
