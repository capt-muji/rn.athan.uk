/**
 * Fetching the tiles around a position: the cache first, then the archive, and never a crash
 */

import { gzipSync } from 'fflate';

import { TILE_ZOOM, tilesAround } from '@/device/tiles';
import logger from '@/shared/logger';
import { readTile, writeTile } from '@/shared/tileCache';
import { tileForPosition } from '@/shared/tileGeometry';
import { database } from '@/stores/database';

const LONDON = { latitude: 51.5074, longitude: -0.1278 };

/** Protobuf writers, so a fixture tile is real bytes rather than a mock object */
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
const lengthPrefixed = (field: number, payload: number[]): number[] => [
  ...varint((field << 3) | 2),
  ...varint(payload.length),
  ...payload,
];
const text = (value: string): number[] => [...new TextEncoder().encode(value)];

/** A tile holding one empty named layer, which is enough to prove the bytes reached the decoder */
const tileBytes = (layerName: string): Uint8Array =>
  new Uint8Array(lengthPrefixed(3, lengthPrefixed(1, text(layerName))));

/** A PMTiles header whose directories and tile data sit immediately after it */
const HEADER_LENGTH = 127;
const ROOT_OFFSET = 127;
const TILE_DATA_OFFSET = 4096;

const headerBytes = (rootLength: number): Uint8Array => {
  const bytes = new Uint8Array(HEADER_LENGTH);
  bytes.set(new TextEncoder().encode('PMTiles'), 0);
  bytes[7] = 3;
  const view = new DataView(bytes.buffer);
  view.setUint32(8, ROOT_OFFSET, true);
  view.setUint32(16, rootLength, true);
  view.setUint32(40, 2048, true);
  view.setUint32(56, TILE_DATA_OFFSET, true);
  bytes[99] = 1;
  bytes[101] = 15;

  return bytes;
};

/**
 * A directory of one entry covering every tile id, so any requested tile resolves to the same bytes
 *
 * A `runLength` of 0 makes the entry point at a LEAF directory instead, which is the shape the real planet
 * archive uses: its root holds 2,917 entries, every one of them a leaf pointer.
 */
const directoryBytes = (length: number, runLength = 4 ** 16): Uint8Array =>
  new Uint8Array([...varint(1), ...varint(0), ...varint(runLength), ...varint(length), ...varint(1)]);

const LEAF_OFFSET = 2048;

const ok = (body: Uint8Array) => ({ status: 206, arrayBuffer: async () => body.buffer.slice(0) as ArrayBuffer });

/** Answers the three reads `fetchTile` makes, in the order it makes them */
const archiveResponding = (tile: Uint8Array) => {
  const compressed = gzipSync(tile);
  const directory = gzipSync(directoryBytes(compressed.length));

  return jest.fn(async (_url: string, init?: { headers?: { Range?: string } }) => {
    const range = init?.headers?.Range ?? '';
    const start = Number(range.replace('bytes=', '').split('-')[0]);
    if (start === 0) return ok(headerBytes(directory.length));
    if (start === ROOT_OFFSET) return ok(directory);

    return ok(compressed);
  });
};

describe('the tiles around a position', () => {
  beforeEach(() => {
    database.clearAll();
  });

  it('serves a cached tile without going to the network', async () => {
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;
    const centre = tileForPosition(LONDON, TILE_ZOOM);
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        writeTile(`${TILE_ZOOM}-${centre.x + dx}-${centre.y + dy}`, tileBytes('roads'));
      }
    }

    const tiles = await tilesAround(LONDON);

    expect(tiles).toHaveLength(9);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetches a tile the cache does not hold, and keeps it', async () => {
    global.fetch = archiveResponding(tileBytes('roads')) as unknown as typeof fetch;

    const tiles = await tilesAround(LONDON);

    expect(tiles).toHaveLength(9);
    expect(tiles[0].layers.roads).toBeDefined();
    const centre = tileForPosition(LONDON, TILE_ZOOM);
    expect(readTile(`${TILE_ZOOM}-${centre.x - 1}-${centre.y - 1}`)).not.toBeNull();
  });

  it('asks only for the byte range it needs, never the whole archive', async () => {
    const fetchSpy = archiveResponding(tileBytes('roads'));
    global.fetch = fetchSpy as unknown as typeof fetch;

    await tilesAround(LONDON);

    for (const call of fetchSpy.mock.calls) {
      expect(call[1]?.headers?.Range).toMatch(/^bytes=\d+-\d+$/);
    }
  });

  it('gives up when the archive answers anything but a partial read', async () => {
    global.fetch = jest.fn(async () => ({
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(0),
    })) as unknown as typeof fetch;

    const tiles = await tilesAround(LONDON);

    expect(tiles).toEqual([]);
    expect(logger.warn).toHaveBeenCalledWith('QIBLA: Tile archive refused a range request');
  });

  it('gives up when the network throws, because offline is a state rather than a crash', async () => {
    global.fetch = jest.fn(async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;

    const tiles = await tilesAround(LONDON);

    expect(tiles).toEqual([]);
    expect(logger.warn).toHaveBeenCalledWith('QIBLA: Could not reach the tile archive', expect.anything());
  });

  it('reports that there is no map data when nothing could be loaded', async () => {
    global.fetch = jest.fn(async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;

    await tilesAround(LONDON);

    expect(logger.warn).toHaveBeenCalledWith('QIBLA: No map data for this location');
  });

  it('refuses an archive of raster tiles, which the decoder cannot read', async () => {
    const raster = headerBytes(10);
    raster[99] = 2;
    global.fetch = jest.fn(async () => ok(raster)) as unknown as typeof fetch;

    const tiles = await tilesAround(LONDON);

    expect(tiles).toEqual([]);
    expect(logger.warn).toHaveBeenCalledWith('QIBLA: Tile archive refused a range request');
  });

  it('returns the tiles that arrived when the archive holds no entry for the others', async () => {
    const empty = new Uint8Array([...varint(0)]);
    global.fetch = jest.fn(async (_url: string, init?: { headers?: { Range?: string } }) => {
      const start = Number((init?.headers?.Range ?? '').replace('bytes=', '').split('-')[0]);
      if (start === 0) return ok(headerBytes(gzipSync(empty).length));

      return ok(gzipSync(empty));
    }) as unknown as typeof fetch;

    expect(await tilesAround(LONDON)).toEqual([]);
  });

  it('walks a leaf directory, which is how the real planet archive is built', async () => {
    const tile = gzipSync(tileBytes('roads'));
    const leaf = gzipSync(directoryBytes(tile.length));
    const root = gzipSync(directoryBytes(leaf.length, 0));
    global.fetch = jest.fn(async (_url: string, init?: { headers?: { Range?: string } }) => {
      const start = Number((init?.headers?.Range ?? '').replace('bytes=', '').split('-')[0]);
      if (start === 0) return ok(headerBytes(root.length));
      if (start === ROOT_OFFSET) return ok(root);
      if (start === LEAF_OFFSET) return ok(leaf);

      return ok(tile);
    }) as unknown as typeof fetch;

    const tiles = await tilesAround(LONDON);

    expect(tiles).toHaveLength(9);
    expect(tiles[0].layers.roads).toBeDefined();
  });

  it('gives up when a leaf directory cannot be read', async () => {
    const root = gzipSync(directoryBytes(10, 0));
    global.fetch = jest.fn(async (_url: string, init?: { headers?: { Range?: string } }) => {
      const start = Number((init?.headers?.Range ?? '').replace('bytes=', '').split('-')[0]);
      if (start === 0) return ok(headerBytes(root.length));
      if (start === ROOT_OFFSET) return ok(root);

      return { status: 500, arrayBuffer: async () => new ArrayBuffer(0) };
    }) as unknown as typeof fetch;

    expect(await tilesAround(LONDON)).toEqual([]);
  });

  it('gives up when the root directory cannot be read', async () => {
    global.fetch = jest.fn(async (_url: string, init?: { headers?: { Range?: string } }) => {
      const start = Number((init?.headers?.Range ?? '').replace('bytes=', '').split('-')[0]);
      if (start === 0) return ok(headerBytes(10));

      return { status: 500, arrayBuffer: async () => new ArrayBuffer(0) };
    }) as unknown as typeof fetch;

    expect(await tilesAround(LONDON)).toEqual([]);
  });

  it('gives up when the tile bytes themselves cannot be read', async () => {
    const root = gzipSync(directoryBytes(10));
    global.fetch = jest.fn(async (_url: string, init?: { headers?: { Range?: string } }) => {
      const start = Number((init?.headers?.Range ?? '').replace('bytes=', '').split('-')[0]);
      if (start === 0) return ok(headerBytes(root.length));
      if (start === ROOT_OFFSET) return ok(root);

      return { status: 500, arrayBuffer: async () => new ArrayBuffer(0) };
    }) as unknown as typeof fetch;

    expect(await tilesAround(LONDON)).toEqual([]);
  });

  it('reads the grid at the zoom where a building appears', () => {
    expect(TILE_ZOOM).toBe(15);
  });
});
