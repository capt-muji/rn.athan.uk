/**
 * Finding one tile inside a 138 GB PMTiles archive, without downloading it
 */

import {
  decodeDirectory,
  findEntry,
  holdsVectorTiles,
  PMTILES_HEADER_BYTES,
  parseHeader,
  pointsAtLeaf,
  tileIdFor,
} from '@/shared/pmtiles';

/** Writes the little-endian 64-bit fields the header uses */
const uint64 = (value: number): number[] => {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setUint32(0, value % 4294967296, true);
  new DataView(bytes.buffer).setUint32(4, Math.floor(value / 4294967296), true);

  return [...bytes];
};

const int32 = (value: number): number[] => {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setInt32(0, value, true);

  return [...bytes];
};

/**
 * A header carrying the real values the live archive reported on 2026-09-30
 *
 * Built field by field rather than captured as a blob, so a wrong field POSITION fails here rather than being
 * baked into the fixture alongside the reader that produced it.
 */
const realHeader = (overrides: { version?: number; magic?: string } = {}): Uint8Array => {
  const bytes = new Uint8Array(PMTILES_HEADER_BYTES);
  bytes.set(new TextEncoder().encode(overrides.magic ?? 'PMTiles'), 0);
  bytes[7] = overrides.version ?? 3;
  bytes.set(uint64(127), 8);
  bytes.set(uint64(15559), 16);
  bytes.set(uint64(138095620652), 40);
  bytes.set(uint64(16384), 56);
  bytes[99] = 1;
  bytes[100] = 0;
  bytes[101] = 15;
  bytes.set(int32(-1800000000), 102);
  bytes.set(int32(-850511287), 106);
  bytes.set(int32(1800000000), 110);
  bytes.set(int32(850511287), 114);

  return bytes;
};

/** Writes a directory in the format's column-at-a-time layout */
const directory = (entries: { tileId: number; runLength: number; length: number; offset: number }[]): Uint8Array => {
  const varint = (value: number): number[] => {
    const out: number[] = [];
    let rest = value;
    while (rest >= 0x80) {
      out.push((rest & 0x7f) | 0x80);
      rest = Math.floor(rest / 128);
    }
    out.push(rest);

    return out;
  };

  const bytes: number[] = [...varint(entries.length)];
  let previous = 0;
  for (const entry of entries) {
    bytes.push(...varint(entry.tileId - previous));
    previous = entry.tileId;
  }
  for (const entry of entries) bytes.push(...varint(entry.runLength));
  for (const entry of entries) bytes.push(...varint(entry.length));
  for (const entry of entries) bytes.push(...varint(entry.offset));

  return new Uint8Array(bytes);
};

describe('the archive header', () => {
  it('reads the layout the live planet archive reported', () => {
    const header = parseHeader(realHeader());

    expect(header).toEqual({
      rootOffset: 127,
      rootLength: 15559,
      leafOffset: 138095620652,
      tileDataOffset: 16384,
      tileType: 1,
      minZoom: 0,
      maxZoom: 15,
      minLongitude: -180,
      minLatitude: -85.0511287,
      maxLongitude: 180,
      maxLatitude: 85.0511287,
    });
  });

  it('refuses a file that is not a PMTiles archive', () => {
    expect(() => parseHeader(realHeader({ magic: 'NOTPMTI' }))).toThrow('PMTiles: unexpected magic NOTPMTI');
  });

  it('refuses a version it does not understand', () => {
    expect(() => parseHeader(realHeader({ version: 4 }))).toThrow('PMTiles: unsupported version 4');
  });

  it('recognises an archive of vector tiles', () => {
    expect(holdsVectorTiles(parseHeader(realHeader()))).toBe(true);
  });

  it('refuses an archive of raster tiles, which this app cannot decode', () => {
    const raster = realHeader();
    raster[99] = 2;

    expect(holdsVectorTiles(parseHeader(raster))).toBe(false);
  });
});

describe('the Hilbert tile id', () => {
  // The spec's own worked examples, so a rewrite of this function is checked against the format rather than
  // against whatever the previous implementation happened to produce
  it.each([
    [0, 0, 0, 0],
    [1, 0, 0, 1],
    [1, 0, 1, 2],
    [1, 1, 1, 3],
    [1, 1, 0, 4],
    [2, 0, 0, 5],
  ])('z%s (%s, %s) is tile %s', (zoom, x, y, expected) => {
    expect(tileIdFor({ zoom, x, y })).toBe(expected);
  });

  it("indexes London's own z15 tile as the live archive does", () => {
    expect(tileIdFor({ zoom: 15, x: 16372, y: 10896 })).toBe(518974351);
  });

  it('gives neighbouring tiles nearby ids, which is the whole point of the curve', () => {
    const here = tileIdFor({ zoom: 15, x: 16372, y: 10896 });
    const next = tileIdFor({ zoom: 15, x: 16373, y: 10896 });

    expect(Math.abs(next - here)).toBeLessThan(16);
  });
});

describe('a directory', () => {
  it('reads its entries back, with tile ids as running totals', () => {
    const bytes = directory([
      { tileId: 100, runLength: 1, length: 500, offset: 1 },
      { tileId: 140, runLength: 1, length: 600, offset: 501 },
    ]);

    const entries = decodeDirectory(bytes);

    expect(entries).toHaveLength(2);
    expect(entries[0].tileId).toBe(100);
    expect(entries[1].tileId).toBe(140);
  });

  it('treats a zero offset after the first entry as following the one before', () => {
    const bytes = directory([
      { tileId: 10, runLength: 1, length: 500, offset: 1 },
      { tileId: 11, runLength: 1, length: 600, offset: 0 },
    ]);

    const entries = decodeDirectory(bytes);

    expect(entries[0].offset).toBe(0);
    expect(entries[1].offset).toBe(500);
  });

  it('finds the entry holding a tile', () => {
    const entries = decodeDirectory(
      directory([
        { tileId: 10, runLength: 1, length: 100, offset: 1 },
        { tileId: 20, runLength: 1, length: 100, offset: 101 },
      ])
    );

    expect(findEntry(entries, 20)?.tileId).toBe(20);
  });

  it('reads a run-length entry as covering a span of tiles, which is how empty ocean is stored once', () => {
    const entries = decodeDirectory(directory([{ tileId: 10, runLength: 4, length: 100, offset: 1 }]));

    expect(findEntry(entries, 13)?.tileId).toBe(10);
  });

  it('reports no entry for a tile past the end of a run', () => {
    const entries = decodeDirectory(directory([{ tileId: 10, runLength: 4, length: 100, offset: 1 }]));

    expect(findEntry(entries, 14)).toBeNull();
  });

  it('reports no entry for a tile before the directory starts', () => {
    const entries = decodeDirectory(directory([{ tileId: 10, runLength: 1, length: 100, offset: 1 }]));

    expect(findEntry(entries, 9)).toBeNull();
  });

  it('reports no entry when the directory is empty', () => {
    expect(findEntry(decodeDirectory(directory([])), 10)).toBeNull();
  });

  it('recognises an entry that points at a leaf directory rather than a tile', () => {
    const entries = decodeDirectory(directory([{ tileId: 10, runLength: 0, length: 100, offset: 1 }]));

    expect(pointsAtLeaf(entries[0])).toBe(true);
    expect(findEntry(entries, 10)?.tileId).toBe(10);
  });

  it('reads a tile id that needs a multi-byte varint', () => {
    const entries = decodeDirectory(directory([{ tileId: 518974351, runLength: 1, length: 61808, offset: 1 }]));

    expect(entries[0].tileId).toBe(518974351);
    expect(entries[0].length).toBe(61808);
  });
});
