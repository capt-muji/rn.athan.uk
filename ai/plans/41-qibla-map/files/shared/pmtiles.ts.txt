/**
 * A PMTiles v3 archive reader: enough to find one tile's bytes in a 138 GB file
 *
 * The archive is never downloaded. Its header names where the directories live, and a tile is found in two or
 * three reads of a few kilobytes each, which is what makes a planet-scale source usable from a phone.
 *
 * Spec: https://github.com/protomaps/PMTiles/blob/main/spec/v3/spec.md
 */

import type { TileAddress } from '@/shared/tileGeometry';

/** The fixed-size header at the front of every archive */
export const PMTILES_HEADER_BYTES = 127;

const COORDINATE_SCALE = 1e7;
const MVT_TILE_TYPE = 1;
const SUPPORTED_VERSION = 3;

export interface PmTilesHeader {
  rootOffset: number;
  rootLength: number;
  leafOffset: number;
  tileDataOffset: number;
  tileType: number;
  minZoom: number;
  maxZoom: number;
  minLongitude: number;
  minLatitude: number;
  maxLongitude: number;
  maxLatitude: number;
}

/** One directory row: either a tile's location, or a pointer to a leaf directory when `runLength` is 0 */
export interface DirectoryEntry {
  tileId: number;
  offset: number;
  length: number;
  runLength: number;
}

/**
 * A little-endian 64-bit offset
 *
 * Read as two 32-bit halves rather than a BigInt: the planet archive is about 138 GB, far below 2^53, so a
 * JavaScript number holds every offset exactly and Hermes never has to carry a BigInt.
 */
const readUint64 = (bytes: Uint8Array, at: number): number => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  return view.getUint32(at + 4, true) * 4294967296 + view.getUint32(at, true);
};

const readInt32 = (bytes: Uint8Array, at: number): number =>
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getInt32(at, true);

/**
 * The archive's layout, from its first 127 bytes
 *
 * Every offset the reader uses comes from here rather than being hardcoded, because the daily builds move them.
 * An off-by-one in these field positions reported "minzoom 15, maxzoom 0" with impossible bounds during
 * development, which is the kind of wrong-but-plausible result that ships as a bug.
 *
 * @param bytes At least the first 127 bytes of the archive
 * @returns Where the directories and the tile data live, and what the archive covers
 * @throws When the magic or the version is not a PMTiles v3 archive
 */
export const parseHeader = (bytes: Uint8Array): PmTilesHeader => {
  const magic = new TextDecoder().decode(bytes.subarray(0, 7));
  if (magic !== 'PMTiles') throw new Error(`PMTiles: unexpected magic ${magic}`);

  const version = bytes[7];
  if (version !== SUPPORTED_VERSION) throw new Error(`PMTiles: unsupported version ${version}`);

  return {
    rootOffset: readUint64(bytes, 8),
    rootLength: readUint64(bytes, 16),
    leafOffset: readUint64(bytes, 40),
    tileDataOffset: readUint64(bytes, 56),
    tileType: bytes[99],
    minZoom: bytes[100],
    maxZoom: bytes[101],
    minLongitude: readInt32(bytes, 102) / COORDINATE_SCALE,
    minLatitude: readInt32(bytes, 106) / COORDINATE_SCALE,
    maxLongitude: readInt32(bytes, 110) / COORDINATE_SCALE,
    maxLatitude: readInt32(bytes, 114) / COORDINATE_SCALE,
  };
};

/** Whether an archive holds the vector tiles this app can decode */
export const holdsVectorTiles = (header: PmTilesHeader): boolean => header.tileType === MVT_TILE_TYPE;

/**
 * A tile's position on the Hilbert curve, which is how a PMTiles archive orders its tiles
 *
 * A Hilbert curve keeps neighbouring tiles near each other in the file, so the nine tiles this app wants sit
 * close together and often share a directory read.
 *
 * @param tile The tile's address
 * @returns Its tile id
 */
export const tileIdFor = (tile: TileAddress): number => {
  let id = 0;
  for (let level = 0; level < tile.zoom; level += 1) id += 4 ** level;

  const size = 2 ** tile.zoom;
  let x = tile.x;
  let y = tile.y;
  let position = 0;

  for (let span = size / 2; span > 0; span /= 2) {
    const right = (x & span) > 0 ? 1 : 0;
    const up = (y & span) > 0 ? 1 : 0;
    position += span * span * ((3 * right) ^ up);

    if (up === 0) {
      if (right === 1) {
        x = span - 1 - x;
        y = span - 1 - y;
      }
      const swap = x;
      x = y;
      y = swap;
    }
  }

  return id + position;
};

const readVarint = (bytes: Uint8Array, cursor: { offset: number }): number => {
  let result = 0;
  let shift = 0;
  let byte = 0;

  do {
    byte = bytes[cursor.offset];
    cursor.offset += 1;
    result += (byte & 0x7f) * 2 ** shift;
    shift += 7;
  } while (byte >= 0x80);

  return result;
};

/**
 * A directory's entries
 *
 * The format stores each column of the table in full before the next, and tile ids as deltas, so the whole
 * directory must be read to know any single entry.
 *
 * @param bytes The directory, already decompressed
 * @returns Its entries, in tile-id order
 */
export const decodeDirectory = (bytes: Uint8Array): DirectoryEntry[] => {
  const cursor = { offset: 0 };
  const count = readVarint(bytes, cursor);
  const entries: DirectoryEntry[] = [];

  let tileId = 0;
  for (let index = 0; index < count; index += 1) {
    tileId += readVarint(bytes, cursor);
    entries.push({ tileId, offset: 0, length: 0, runLength: 0 });
  }
  for (let index = 0; index < count; index += 1) entries[index].runLength = readVarint(bytes, cursor);
  for (let index = 0; index < count; index += 1) entries[index].length = readVarint(bytes, cursor);
  for (let index = 0; index < count; index += 1) {
    const stored = readVarint(bytes, cursor);
    // Zero is the format's shorthand for "directly after the entry before", which is how a clustered archive
    // avoids repeating a running total
    entries[index].offset =
      stored === 0 && index > 0 ? entries[index - 1].offset + entries[index - 1].length : stored - 1;
  }

  return entries;
};

/**
 * The entry covering a tile id, by binary search
 *
 * An entry with a `runLength` above 1 stands for a run of identical tiles, which is how the archive stores empty
 * ocean once rather than thousands of times.
 *
 * @param entries A decoded directory
 * @param tileId The tile being looked for
 * @returns The entry holding it, or null when the directory does not cover it
 */
export const findEntry = (entries: DirectoryEntry[], tileId: number): DirectoryEntry | null => {
  let low = 0;
  let high = entries.length - 1;
  let candidate: DirectoryEntry | null = null;

  while (low <= high) {
    const middle = (low + high) >> 1;
    if (entries[middle].tileId <= tileId) {
      candidate = entries[middle];
      low = middle + 1;
    } else high = middle - 1;
  }

  if (candidate === null) return null;
  if (candidate.runLength === 0) return candidate;

  return tileId < candidate.tileId + candidate.runLength ? candidate : null;
};

/** A leaf directory rather than a tile: the archive is two levels deep at planet scale */
export const pointsAtLeaf = (entry: DirectoryEntry): boolean => entry.runLength === 0;
