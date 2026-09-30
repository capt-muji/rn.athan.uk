// Parse a London Unified Prayer Timetable .xlsx into a normalised year of times.
// Sheet 2 is the 24-hour Excel-time sheet; its columns are documented by the sheet's own header row.
// Only Node built-ins and one unzip pass, so this is independently auditable.

import fs from 'node:fs';
import zlib from 'node:zlib';

/** Read one member out of a zip archive by name, inflating it if it is deflated. */
const zipRead = (buf, name) => {
  // Walk the central directory from the end-of-central-directory record.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('no end-of-central-directory record');
  const entries = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);

  for (let e = 0; e < entries; e += 1) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central directory header');
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const entryName = buf.subarray(p + 46, p + 46 + nameLen).toString('latin1');

    if (entryName === name) {
      const lhNameLen = buf.readUInt16LE(localOffset + 26);
      const lhExtraLen = buf.readUInt16LE(localOffset + 28);
      const start = localOffset + 30 + lhNameLen + lhExtraLen;
      const raw = buf.subarray(start, start + compSize);
      return method === 0 ? raw : zlib.inflateRawSync(raw);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`member not found: ${name}`);
};

/** Excel serial day to an ISO date. Epoch 1899-12-30 absorbs the 1900 leap-year bug. */
const excelDate = (serial) => new Date(Date.UTC(1899, 11, 30) + serial * 86_400_000).toISOString().slice(0, 10);

const fmt = (minutes) => {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/**
 * One published year, keyed by ISO date, on the same field names the app's own API uses.
 * `asr` is Mithl 1 and `asr_2` is Mithl 2, matching the provider's own wire shape.
 */
export const readLupt = (path) => {
  const buf = fs.readFileSync(path);
  const xml = zipRead(buf, 'xl/worksheets/sheet2.xml').toString('utf8');

  const out = {};
  for (const rm of xml.matchAll(/<row[^>]*r="(\d+)"[^>]*>(.*?)<\/row>/gs)) {
    const cells = {};
    for (const cm of rm[2].matchAll(/<c[^>]*r="([A-Z]+)\d+"([^>]*)>(.*?)<\/c>/gs)) {
      if (/t="s"/.test(cm[2])) continue;
      const v = /<v>(.*?)<\/v>/s.exec(cm[3]);
      if (v) cells[cm[1]] = Number(v[1]);
    }
    // A data row carries a date serial in B and seven time fractions in D to J.
    if (typeof cells.B !== 'number' || cells.B < 40_000 || typeof cells.D !== 'number') continue;
    const date = excelDate(cells.B);
    out[date] = {
      date,
      fajr: fmt(cells.D * 1440),
      sunrise: fmt(cells.E * 1440),
      dhuhr: fmt(cells.F * 1440),
      asr: fmt(cells.G * 1440),
      asr_2: fmt(cells.H * 1440),
      magrib: fmt(cells.I * 1440),
      isha: fmt(cells.J * 1440),
    };
  }
  return out;
};
