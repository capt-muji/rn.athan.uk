/**
 * The map tiles kept on the phone, bounded by the owner's 25 MB cap
 *
 * Tiles are fetched once per place and kept, because the map must work with no network in use. The cap is what
 * stops a traveller's phone filling up: 🐋  "if it goes above 25 megabytes, then we should start clearing... the
 * old values". Deliberately NOT in `clearAllExcept`'s keep list, since a cache is rebuildable and a stale tile
 * outliving a format change is worse than a refetch.
 */

import { database } from '@/stores/database';

/** The owner's ruling of 2026-09-30, about 15 locations at the measured 1.7 MB worst case */
export const TILE_CACHE_CAP_BYTES = 25 * 1024 * 1024;

const TILE_PREFIX = 'tile_';
const ORDER_KEY = 'tile_order';

/** A cached tile's key and size, least recently used first, so eviction takes from the front */
interface CacheEntry {
  key: string;
  bytes: number;
}

/** The size is carried here rather than measured from storage, so eviction never reads a megabyte to weigh it */
const readOrder = (): CacheEntry[] => {
  const raw = database.getString(ORDER_KEY);

  return raw ? JSON.parse(raw) : [];
};

const writeOrder = (order: CacheEntry[]): void => {
  database.set(ORDER_KEY, JSON.stringify(order));
};

const storageKey = (key: string): string => `${TILE_PREFIX}${key}`;

const totalBytes = (order: CacheEntry[]): number => order.reduce((sum, entry) => sum + entry.bytes, 0);

/**
 * A cached tile's bytes
 *
 * Reading counts as a use, so the tile a user keeps opening survives eviction.
 *
 * @param key The tile's cache key
 * @returns The tile's bytes, or null when it is not cached
 */
export const readTile = (key: string): Uint8Array | null => {
  const buffer = database.getBuffer(storageKey(key));
  if (!buffer) return null;

  const others = readOrder().filter((held) => held.key !== key);
  writeOrder([...others, { key, bytes: buffer.byteLength }]);

  return new Uint8Array(buffer);
};

/**
 * Stores a tile, evicting least-recently-used tiles until it fits
 *
 * A tile larger than the whole cap is refused rather than stored, because accepting it would empty the cache to
 * make room for something that still would not fit.
 *
 * @param key The tile's cache key
 * @param bytes The tile's bytes
 */
export const writeTile = (key: string, bytes: Uint8Array): void => {
  if (bytes.length > TILE_CACHE_CAP_BYTES) return;

  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  database.set(storageKey(key), buffer);

  let order = [...readOrder().filter((held) => held.key !== key), { key, bytes: bytes.length }];

  // Never evicts the tile just written, so a cache under pressure still answers the place the user is standing
  while (totalBytes(order) > TILE_CACHE_CAP_BYTES && order.length > 1) {
    database.remove(storageKey(order[0].key));
    order = order.slice(1);
  }

  writeOrder(order);
};
