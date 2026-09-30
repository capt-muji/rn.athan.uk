// R6: parse every authority feed into one common shape.
// Output: { authority, unit, tz, lat, lon, year, days: [{ date, fajr, sunrise, dhuhr, asr, maghrib, isha }] }
// Times are minutes since local midnight. Nothing here is used as a prayer time.

import { readFileSync, existsSync, readdirSync } from 'node:fs';

const A = 'auth';
const hm = (s) => { const m = /^(\d{1,2}):(\d{2})/.exec(String(s).trim()); return m ? +m[1] * 60 + +m[2] : null; };

const MS_MON = { Jan: 0, Feb: 1, Mac: 2, Mar: 2, Apr: 3, Mei: 4, May: 4, Jun: 5, Jul: 6,
  Ogos: 7, Aug: 7, Sep: 8, Okt: 9, Oct: 9, Nov: 10, Dis: 11, Dec: 11 };

export function jakim(zone, year = 2026) {
  const f = `${A}/jakim_${zone}_${year}.json`;
  if (!existsSync(f)) return null;
  const days = [];
  for (const d of JSON.parse(readFileSync(f, 'utf8')).prayerTime) {
    const [dd, mon, yyyy] = d.date.split('-');
    const mi = MS_MON[mon]; if (mi === undefined) continue;
    days.push({ date: `${yyyy}-${String(mi + 1).padStart(2, '0')}-${dd}`,
      fajr: hm(d.fajr), sunrise: hm(d.syuruk), dhuhr: hm(d.dhuhr),
      asr: hm(d.asr), maghrib: hm(d.maghrib), isha: hm(d.isha) });
  }
  return days;
}

export function muis(datasetId) {
  const f = `${A}/muis_${datasetId}.csv`;
  if (!existsSync(f)) return null;
  const lines = readFileSync(f, 'utf8').trim().split('\n').slice(1);
  const days = [];
  for (const L of lines) {
    const c = L.split(',');
    if (c.length < 8) continue;
    // Zohor/Asar/Maghrib/Isyak are printed as 12-hour in some years; normalise by monotonicity.
    let [date, , su, sy, zo, as, mg, is] = c;
    const t = [su, sy, zo, as, mg, is].map(hm);
    for (let i = 1; i < t.length; i++) while (t[i] < t[i - 1]) t[i] += 720;
    days.push({ date, fajr: t[0], sunrise: t[1], dhuhr: t[2], asr: t[3], maghrib: t[4], isha: t[5] });
  }
  return days;
}

const TR_MON = { Ocak: 0, Şubat: 1, Mart: 2, Nisan: 3, Mayıs: 4, Haziran: 5, Temmuz: 6,
  Ağustos: 7, Eylül: 8, Ekim: 9, Kasım: 10, Aralık: 11 };
const ent = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&nbsp;/g, ' ');

export function diyanet(id) {
  const f = `${A}/diyanet_${id}.html`;
  if (!existsSync(f)) return null;
  const h = readFileSync(f, 'utf8');
  const seg = h.slice(h.indexOf('table-caption-yearly'));
  const rows = seg.match(/<tr>[\s\S]*?<\/tr>/g) || [];
  const days = [];
  for (const r of rows) {
    const c = [...r.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => ent(m[1].replace(/<[^>]*>/g, '')).trim());
    if (c.length < 8) continue;
    const dm = /^(\d{1,2})\s+(\S+)\s+(\d{4})/.exec(c[0]);
    if (!dm) continue;
    const mi = TR_MON[dm[2]]; if (mi === undefined) continue;
    days.push({ date: `${dm[3]}-${String(mi + 1).padStart(2, '0')}-${dm[1].padStart(2, '0')}`,
      fajr: hm(c[2]), sunrise: hm(c[3]), dhuhr: hm(c[4]), asr: hm(c[5]), maghrib: hm(c[6]), isha: hm(c[7]) });
  }
  return days;
}

export function umq(city, yh) {
  const f = `${A}/umq_${city}_${yh}.json`;
  if (!existsSync(f)) return null;
  return JSON.parse(readFileSync(f, 'utf8')).map((r) => {
    const g = r.gregorianDate, p = r.prayerTimes;
    return { date: `${g.year}-${String(g.month).padStart(2, '0')}-${String(g.day).padStart(2, '0')}`,
      hijriMonth: r.hijriDate.month,
      fajr: hm(p.fajr), sunrise: hm(p.sunrise), dhuhr: hm(p.dhuhr),
      asr: hm(p.asr), maghrib: hm(p.maghrib), isha: hm(p.isha) };
  });
}

// Brunei stores 12-hour dot strings with no meridiem. `Date` is `T16:00:00Z`, which is Brunei
// midnight of the NEXT day, so the local date is the date part plus one. Confirmed by
// measurement: the +1 reading halves the residual sd on Fajr and sunrise. The list also
// carries authority-side typos
// (`69.11`, `741`, `7..52`) and duplicate dates; both are reported, not silently repaired.
export function brunei(year, keepBad = false) {
  const f = `${A}/brunei_${year}.json`;
  if (!existsSync(f)) return null;
  const pm = (s, afternoon) => {
    const m = /^(\d{1,2})\.(\d{2})$/.exec(String(s).trim()); if (!m) return null;
    let h = +m[1]; const mi = +m[2];
    if (h > 12 || mi > 59) return null;
    if (afternoon && h < 12) h += 12;
    return h * 60 + mi;
  };
  const seen = new Set();
  const out = [];
  for (const r of JSON.parse(readFileSync(f, 'utf8')).value) {
    const d0 = new Date(`${r.Date.slice(0, 10)}T00:00:00Z`);
    d0.setUTCDate(d0.getUTCDate() + 1);
    const date = d0.toISOString().slice(0, 10);
    if (seen.has(date)) continue;
    seen.add(date);
    const row = { date,
      fajr: pm(r.Suboh, false), sunrise: pm(r.Syuruk, false), dhuhr: pm(r.Zohor, true),
      asr: pm(r.Asar, true), maghrib: pm(r.Maghrib, true), isha: pm(r.Isyak, true) };
    // A prayer sequence that is not monotonic is a typed-in error in the source list.
    const seq = [row.fajr, row.sunrise, row.dhuhr, row.asr, row.maghrib, row.isha];
    const ok = seq.every((x, i) => x !== null && (i === 0 || x > seq[i - 1]));
    if (!ok && !keepBad) { row.bad = true; for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) row[k] = null; }
    out.push(row);
  }
  return out;
}

export function bruneiAudit(year) {
  const f = `${A}/brunei_${year}.json`;
  if (!existsSync(f)) return null;
  const rows = JSON.parse(readFileSync(f, 'utf8')).value;
  const seen = new Map(), dups = [], typos = [];
  for (const r of rows) {
    const d = r.Date.slice(0, 10);
    if (seen.has(d)) dups.push(d); else seen.set(d, r);
    for (const k of ['Suboh', 'Syuruk', 'Zohor', 'Asar', 'Maghrib', 'Isyak']) {
      if (!/^\d{1,2}\.\d{2}$/.test(String(r[k]).trim())) typos.push([d, k, r[k]]);
    }
  }
  // A single value that jumps more than 4 minutes from both neighbours is a keying error,
  // not a rule: a prayer time never moves that fast day to day at this latitude.
  const days = brunei(year).filter((x) => !x.bad);
  const jumps = [];
  for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    for (let i = 1; i < days.length - 1; i++) {
      const a = days[i - 1][k], b = days[i][k], c = days[i + 1][k];
      if (a === null || b === null || c === null) continue;
      if (Math.abs(b - a) > 4 && Math.abs(b - c) > 4) jumps.push([days[i].date, k, b, a, c]);
    }
  }
  return { rows: rows.length, unique: seen.size, dups, typos, jumps };
}

// Egypt prints "5:18 ص" (AM) and "2:47 م" (PM), with no zero padding on minutes.
export function egypt(tag) {
  const days = [];
  for (let m = 1; m <= 12; m++) {
    const f = `${A}/eg/${tag}_m${m}.html`;
    if (!existsSync(f)) continue;
    const h = readFileSync(f, 'utf8');
    for (const r of h.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || []) {
      const c = [...r.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((x) => ent(x[1].replace(/<[^>]*>/g, '')).trim());
      if (c.length < 9 || !/^\d{4}-\d{2}-\d{2}$/.test(c[1])) continue;
      const t = c.slice(3).map((s) => {
        const mm = /^(\d{1,2}):(\d{1,2})\s*(ص|م)?/.exec(s); if (!mm) return null;
        let hh = +mm[1];
        if (mm[3] === 'م' && hh < 12) hh += 12;
        if (mm[3] === 'ص' && hh === 12) hh = 0;
        return hh * 60 + +mm[2];
      });
      days.push({ date: c[1], fajr: t[0], sunrise: t[1], dhuhr: t[2], asr: t[3], maghrib: t[4], isha: t[5] });
    }
  }
  return days.length ? days : null;
}

// Oman prints d/m/yyyy and 12-hour times with no meridiem.
export function oman(city, dir = 'om', year = 2026) {
  const days = [];
  for (let m = 1; m <= 12; m++) {
    const f = `${A}/${dir}/om_${city}_${m}.html`;
    if (!existsSync(f)) continue;
    const h = readFileSync(f, 'utf8');
    for (const r of h.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || []) {
      const c = [...r.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((x) => ent(x[1].replace(/<[^>]*>/g, '')).trim());
      if (c.length !== 7) continue;
      const dm = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(c[0]); if (!dm) continue;
      const t = c.slice(1).map(hm);
      // fajr and sunrise are morning; dhuhr onward run past noon.
      const out = [t[0], t[1], t[2], t[3], t[4], t[5]];
      for (let i = 1; i < out.length; i++) while (out[i] !== null && out[i] < out[i - 1]) out[i] += 720;
      days.push({ date: `${dm[3]}-${dm[2].padStart(2, '0')}-${dm[1].padStart(2, '0')}`,
        fajr: out[0], sunrise: out[1], dhuhr: out[2], asr: out[3], maghrib: out[4], isha: out[5] });
    }
  }
  return days.length ? days : null;
}

export function indonesia(id) {
  const days = [];
  for (let m = 1; m <= 12; m++) {
    const f = `${A}/id_${id}_${String(m).padStart(2, '0')}.json`;
    if (!existsSync(f)) continue;
    for (const d of JSON.parse(readFileSync(f, 'utf8')).data.jadwal) {
      days.push({ date: d.date, fajr: hm(d.subuh), sunrise: hm(d.terbit), dhuhr: hm(d.dzuhur),
        asr: hm(d.ashar), maghrib: hm(d.maghrib), isha: hm(d.isya) });
    }
  }
  return days.length ? days : null;
}

export function uae(areaId, year = 2026) {
  const f = `${A}/ae_${year}.json`;
  if (!existsSync(f)) return null;
  const rows = JSON.parse(readFileSync(f, 'utf8')).data[String(areaId)];
  if (!rows) return null;
  return rows.map((r) => ({ date: r[0], fajr: hm(r[1]), sunrise: hm(r[2]), dhuhr: hm(r[3]),
    asr: hm(r[4]), maghrib: hm(r[5]), isha: hm(r[6]) }));
}

// Morocco Habous serves one Hijri month, dated by two Gregorian month names in the header.
const AR_MON = { 'يناير': 1, 'فبراير': 2, 'مارس': 3, 'أبريل': 4, 'ابريل': 4, 'ماي': 5, 'مايو': 5,
  'يونيو': 6, 'يونيه': 6, 'يوليوز': 7, 'يوليو': 7, 'غشت': 8, 'أغسطس': 8, 'شتنبر': 9, 'سبتمبر': 9,
  'أكتوبر': 10, 'اكتوبر': 10, 'نونبر': 11, 'نوفمبر': 11, 'دجنبر': 12, 'ديسمبر': 12 };

export function morocco(ville, year = 2026) {
  const f = `${A}/ma_idx${ville}.html`;
  if (!existsSync(f)) return null;
  const h = readFileSync(f, 'utf8');
  const rows = h.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
  const head = [...rows[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1].replace(/<[^>]*>/g, '').trim());
  const months = (head[2] || '').split('/').map((s) => AR_MON[s.trim()]).filter(Boolean);
  if (!months.length) return null;
  const days = [];
  let mi = 0, prev = 0;
  for (const r of rows.slice(1)) {
    const c = [...r.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1].replace(/<[^>]*>/g, '').trim());
    if (c.length < 9) continue;
    const g = +c[2];
    if (g < prev && months.length > 1) mi = 1;
    prev = g;
    days.push({ date: `${year}-${String(months[mi]).padStart(2, '0')}-${String(g).padStart(2, '0')}`,
      fajr: hm(c[3]), sunrise: hm(c[4]), dhuhr: hm(c[5]), asr: hm(c[6]), maghrib: hm(c[7]), isha: hm(c[8]) });
  }
  return days.length ? days : null;
}

// Qatar Calendar House perpetual CSV, digitised MIT. "d/m,isha,maghrib,asr,dhuhr,sunrise,fajr".
export function qatarPerpetual() {
  const f = `${A}/qa_taqweem.csv`;
  if (!existsSync(f)) return null;
  return readFileSync(f, 'utf8').trim().split('\n').map((L) => {
    const c = L.split(',');
    const [d, m] = c[0].split('/');
    return { date: `0000-${m.padStart(2, '0')}-${d.padStart(2, '0')}`,
      fajr: hm(c[6]), sunrise: hm(c[5]), dhuhr: hm(c[4]), asr: hm(c[3]), maghrib: hm(c[2]), isha: hm(c[1]) };
  });
}

// London unified timetable, from wave 1's saved API year and the East London Mosque PDFs.
// The app's own current provider. Its Fajr and Isha come from the 1989 Blackburn chart with
// 21 hand-edited slots, so this is the deliberate category-4 control case.
export function london(year) {
  const f = year === 2026 ? `${A}/london_2026.json` : `${A}/london_elm_${year}.json`;
  if (!existsSync(f)) return null;
  const raw = JSON.parse(readFileSync(f, 'utf8'));
  const rows = raw.times ?? raw;
  return Object.entries(rows).map(([date, r]) => ({ date,
    fajr: hm(r.fajr), sunrise: hm(r.sunrise), dhuhr: hm(r.dhuhr),
    asr: hm(r.asr ?? r.asr_1), maghrib: hm(r.magrib), isha: hm(r.isha) }));
}
