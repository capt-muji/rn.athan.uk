'use strict';
// PMTiles v3 reader, written from the spec rather than from the previous session's hardcoded offsets.
// spec: https://github.com/protomaps/PMTiles/blob/main/spec/v3/spec.md

const HEADER_BYTES = 127;

function u64(buf, off) {
  // JS numbers hold these exactly: the planet archive is ~138 GB, far below 2^53
  const lo = buf.readUInt32LE(off);
  const hi = buf.readUInt32LE(off + 4);
  return hi * 4294967296 + lo;
}

function parseHeader(buf) {
  const magic = buf.subarray(0, 7).toString('ascii');
  if (magic !== 'PMTiles') throw new Error(`bad magic: ${JSON.stringify(magic)}`);
  const version = buf.readUInt8(7);
  if (version !== 3) throw new Error(`unsupported version ${version}`);
  return {
    version,
    rootOffset: u64(buf, 8),
    rootLength: u64(buf, 16),
    metadataOffset: u64(buf, 24),
    metadataLength: u64(buf, 32),
    leafOffset: u64(buf, 40),
    leafLength: u64(buf, 48),
    tileDataOffset: u64(buf, 56),
    tileDataLength: u64(buf, 64),
    addressedTiles: u64(buf, 72),
    tileEntries: u64(buf, 80),
    tileContents: u64(buf, 88),
    clustered: buf.readUInt8(96),
    internalCompression: buf.readUInt8(97),
    tileCompression: buf.readUInt8(98),
    tileType: buf.readUInt8(99),
    minZoom: buf.readUInt8(100),
    maxZoom: buf.readUInt8(101),
    minLon: buf.readInt32LE(102) / 1e7,
    minLat: buf.readInt32LE(106) / 1e7,
    maxLon: buf.readInt32LE(110) / 1e7,
    maxLat: buf.readInt32LE(114) / 1e7,
  };
}

function readVarint(b, p) {
  let r = 0;
  let s = 0;
  let by;
  do {
    by = b[p.i++];
    r += (by & 0x7f) * 2 ** s;
    s += 7;
  } while (by >= 0x80);
  return r;
}

function deserializeDir(buf) {
  const p = { i: 0 };
  const n = readVarint(buf, p);
  const e = [];
  let last = 0;
  for (let i = 0; i < n; i++) {
    const v = readVarint(buf, p);
    last += v;
    e.push({ tileId: last, offset: 0, length: 0, runLength: 0 });
  }
  for (let i = 0; i < n; i++) e[i].runLength = readVarint(buf, p);
  for (let i = 0; i < n; i++) e[i].length = readVarint(buf, p);
  for (let i = 0; i < n; i++) {
    const v = readVarint(buf, p);
    e[i].offset = v === 0 && i > 0 ? e[i - 1].offset + e[i - 1].length : v - 1;
  }
  return e;
}

function zxyToTileId(z, x, y) {
  let acc = 0;
  for (let t = 0; t < z; t++) acc += 4 ** t;
  const n = 2 ** z;
  let rx;
  let ry;
  let d = 0;
  let tx = x;
  let ty = y;
  for (let s = n / 2; s > 0; s = s / 2) {
    rx = (tx & s) > 0 ? 1 : 0;
    ry = (ty & s) > 0 ? 1 : 0;
    d += s * s * ((3 * rx) ^ ry);
    if (ry === 0) {
      if (rx === 1) {
        tx = s - 1 - tx;
        ty = s - 1 - ty;
      }
      const t = tx;
      tx = ty;
      ty = t;
    }
  }
  return acc + d;
}

function findEntry(entries, tileId) {
  let lo = 0;
  let hi = entries.length - 1;
  let res = null;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (entries[m].tileId <= tileId) {
      res = entries[m];
      lo = m + 1;
    } else hi = m - 1;
  }
  if (res && (res.runLength === 0 || tileId < res.tileId + res.runLength)) return res;
  return null;
}

function lonLatToTile(lat, lon, z) {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const lr = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(lr) + 1 / Math.cos(lr)) / Math.PI) / 2) * n);
  return { x, y };
}

module.exports = { HEADER_BYTES, parseHeader, deserializeDir, zxyToTileId, findEntry, lonLatToTile };
