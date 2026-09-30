/** Slippy-map tile arithmetic and small-distance geometry, shared by the tile reader and the street finder */

import type { Position } from '@/shared/qibla';

const DEGREES_PER_TURN = 360;
const HALF_TURN = 180;
const RADIANS_PER_DEGREE = Math.PI / HALF_TURN;
const DEGREES_PER_RADIAN = HALF_TURN / Math.PI;

/** Where a tile sits in the pyramid */
export interface TileAddress {
  zoom: number;
  x: number;
  y: number;
}

/** A point inside a decoded tile, in the tile's own integer coordinate space */
export interface TilePoint {
  x: number;
  y: number;
}

/**
 * The tile containing a position at a zoom level
 *
 * Web Mercator, the projection every slippy-map archive is built on. Latitudes beyond about 85 degrees have no tile,
 * which is why the archive's own bounds stop there.
 *
 * @param position Where the phone is standing
 * @param zoom The pyramid level, 0 the whole world
 * @returns The tile's address
 */
export const tileForPosition = (position: Position, zoom: number): TileAddress => {
  const tilesPerAxis = 2 ** zoom;
  const x = Math.floor(((position.longitude + HALF_TURN) / DEGREES_PER_TURN) * tilesPerAxis);
  const latitudeRadians = position.latitude * RADIANS_PER_DEGREE;
  const mercatorY = Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians));
  const y = Math.floor(((1 - mercatorY / Math.PI) / 2) * tilesPerAxis);

  return { zoom, x, y };
};

/**
 * A point inside a tile, as a position on Earth
 *
 * @param tile The tile the point belongs to
 * @param point The point in the tile's own coordinate space
 * @param extent The tile's coordinate extent, which the tile itself declares
 * @returns The position that point represents
 */
export const positionInTile = (tile: TileAddress, point: TilePoint, extent: number): Position => {
  const tilesPerAxis = 2 ** tile.zoom;
  const longitude = ((tile.x + point.x / extent) / tilesPerAxis) * DEGREES_PER_TURN - HALF_TURN;
  const mercatorY = Math.PI * (1 - (2 * (tile.y + point.y / extent)) / tilesPerAxis);
  const latitude = DEGREES_PER_RADIAN * Math.atan(Math.sinh(mercatorY));

  return { latitude, longitude };
};

/**
 * How many metres one degree of latitude and of longitude span here
 *
 * A local flat approximation, which holds to a few centimetres over the hundred metres this screen draws and avoids
 * a trigonometric distance for every vertex of every street.
 *
 * @param latitude Where the approximation is taken
 * @returns Metres per degree on each axis
 */
export const metresPerDegree = (latitude: number): { latitude: number; longitude: number } => {
  const doubled = 2 * latitude * RADIANS_PER_DEGREE;

  return {
    latitude: 111132.92 - 559.82 * Math.cos(doubled),
    longitude: 111412.84 * Math.cos(latitude * RADIANS_PER_DEGREE),
  };
};

/**
 * The local east and north offset of one position from another, in metres
 *
 * @param from The origin, which the offset is measured from
 * @param to The position being offset
 * @returns Metres east and metres north, either of which may be negative
 */
export const offsetInMetres = (from: Position, to: Position): { east: number; north: number } => {
  const scale = metresPerDegree(from.latitude);

  return {
    east: (to.longitude - from.longitude) * scale.longitude,
    north: (to.latitude - from.latitude) * scale.latitude,
  };
};

/**
 * The straight-line distance between two nearby positions, in metres
 *
 * @param from One position
 * @param to The other
 * @returns The distance in metres
 */
export const distanceInMetres = (from: Position, to: Position): number => {
  const offset = offsetInMetres(from, to);

  return Math.hypot(offset.east, offset.north);
};
