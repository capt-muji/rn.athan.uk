/**
 * The map tiles around a position, from the cache or from the planet archive
 *
 * The archive is 138 GB and is never downloaded: a tile is found in two or three HTTP range requests of a few
 * kilobytes each. Tiles are kept once fetched, so a place the user has opened before needs no network at all,
 * which is what lets an offline app draw a map.
 */

import { gunzipSync } from 'fflate';

import logger from '@/shared/logger';
import {
  decodeDirectory,
  findEntry,
  holdsVectorTiles,
  PMTILES_HEADER_BYTES,
  parseHeader,
  pointsAtLeaf,
  tileIdFor,
} from '@/shared/pmtiles';
import type { Position } from '@/shared/qibla';
import { readTile, writeTile } from '@/shared/tileCache';
import { type TileAddress, tileForPosition } from '@/shared/tileGeometry';
import { decodeVectorTile, type TileLayer } from '@/shared/vectorTile';

/** z15 is the level where the user's own building appears, which is what makes the picture checkable */
export const TILE_ZOOM = 15;

/** A 3 by 3 grid, so the drawn ray never runs off the data whatever direction it points */
const GRID_RADIUS = 1;

/** The daily planet build this app reads. Protomaps retains recent builds; a missing one is a STOP, not a fallback. */
const TILE_ARCHIVE_URL = 'https://build.protomaps.com/20260929.pmtiles';

const PARTIAL_CONTENT = 206;

/** A tile that was fetched and decoded, with the address it came from so its points can be placed on the ground */
export interface DecodedTile {
  address: TileAddress;
  layers: Record<string, TileLayer>;
}

const cacheKey = (tile: TileAddress): string => `${tile.zoom}-${tile.x}-${tile.y}`;

/**
 * A byte range of the archive
 *
 * @returns The bytes, or null when the archive refused or could not be reached
 */
const readRange = async (start: number, length: number): Promise<Uint8Array | null> => {
  try {
    const response = await fetch(TILE_ARCHIVE_URL, { headers: { Range: `bytes=${start}-${start + length - 1}` } });
    if (response.status !== PARTIAL_CONTENT) {
      logger.warn('QIBLA: Tile archive refused a range request');
      return null;
    }

    return new Uint8Array(await response.arrayBuffer());
  } catch (error) {
    logger.warn('QIBLA: Could not reach the tile archive', { error });
    return null;
  }
};

/** The archive stores its directories gzipped, as it does its tiles */
const inflate = (bytes: Uint8Array): Uint8Array => gunzipSync(bytes);

/**
 * One tile's raw bytes from the archive, walking the directory tree to find it
 *
 * @returns The tile's uncompressed bytes, or null when the archive has no tile there
 */
const fetchTile = async (tile: TileAddress): Promise<Uint8Array | null> => {
  const headerBytes = await readRange(0, PMTILES_HEADER_BYTES);
  if (!headerBytes) return null;

  const header = parseHeader(headerBytes);
  if (!holdsVectorTiles(header)) {
    logger.warn('QIBLA: Tile archive refused a range request');
    return null;
  }

  const rootBytes = await readRange(header.rootOffset, header.rootLength);
  if (!rootBytes) return null;

  const wanted = tileIdFor(tile);
  let entry = findEntry(decodeDirectory(inflate(rootBytes)), wanted);

  while (entry !== null && pointsAtLeaf(entry)) {
    const leafBytes = await readRange(header.leafOffset + entry.offset, entry.length);
    if (!leafBytes) return null;
    entry = findEntry(decodeDirectory(inflate(leafBytes)), wanted);
  }

  if (entry === null) return null;

  const tileBytes = await readRange(header.tileDataOffset + entry.offset, entry.length);
  if (!tileBytes) return null;

  return inflate(tileBytes);
};

/** A tile from the cache, or from the archive and then into the cache */
const loadTile = async (tile: TileAddress): Promise<DecodedTile | null> => {
  const key = cacheKey(tile);
  const cached = readTile(key);
  if (cached) return { address: tile, layers: decodeVectorTile(cached) };

  const fetched = await fetchTile(tile);
  if (!fetched) return null;

  writeTile(key, fetched);

  return { address: tile, layers: decodeVectorTile(fetched) };
};

/**
 * The tiles around a position, cache first
 *
 * Never throws: a map that cannot be drawn is a state the screen shows, not an error it raises.
 *
 * @param position Where the user is standing
 * @returns Every tile that could be loaded. Empty when the archive is unreachable and nothing is cached.
 */
export const tilesAround = async (position: Position): Promise<DecodedTile[]> => {
  const centre = tileForPosition(position, TILE_ZOOM);
  const wanted: TileAddress[] = [];

  for (let dx = -GRID_RADIUS; dx <= GRID_RADIUS; dx += 1) {
    for (let dy = -GRID_RADIUS; dy <= GRID_RADIUS; dy += 1) {
      wanted.push({ zoom: TILE_ZOOM, x: centre.x + dx, y: centre.y + dy });
    }
  }

  const loaded = await Promise.all(wanted.map(loadTile));
  const tiles = loaded.filter((tile): tile is DecodedTile => tile !== null);

  if (tiles.length === 0) logger.warn('QIBLA: No map data for this location');

  return tiles;
};
