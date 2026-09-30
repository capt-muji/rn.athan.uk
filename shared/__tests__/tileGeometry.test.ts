/**
 * Slippy-map tile arithmetic: which tile a position falls in, and what a point inside one means on the ground
 */

import {
  distanceInMetres,
  metresPerDegree,
  offsetInMetres,
  positionInTile,
  tileForPosition,
} from '@/shared/tileGeometry';

const LONDON = { latitude: 51.5074, longitude: -0.1278 };
const EXTENT = 4096;

describe('the tile a position falls in', () => {
  // Every expected tile was read out of the live Protomaps archive, so these pin the app against real tile ids
  it.each([
    // place, latitude, longitude, zoom, x, y
    ['London', 51.5074, -0.1278, 15, 16372, 10896],
    ['Jakarta', -6.2088, 106.8456, 15, 26109, 16950],
    ['Makkah', 21.4225, 39.8262, 15, 20009, 14386],
    ['New York', 40.7128, -74.006, 15, 9647, 12320],
  ])('%s sits in tile z%s (%s, %s)', (_place, latitude, longitude, zoom, x, y) => {
    expect(tileForPosition({ latitude, longitude }, zoom)).toEqual({ zoom, x, y });
  });

  it('puts the whole world in one tile at zoom 0', () => {
    expect(tileForPosition(LONDON, 0)).toEqual({ zoom: 0, x: 0, y: 0 });
  });

  it('puts a position west of the meridian in a lower tile column than one east of it', () => {
    const west = tileForPosition({ latitude: 51.5, longitude: -0.5 }, 12);
    const east = tileForPosition({ latitude: 51.5, longitude: 0.5 }, 12);

    expect(west.x).toBeLessThan(east.x);
  });

  it('puts a northern position in a lower tile row, because tile y grows southward', () => {
    const north = tileForPosition({ latitude: 60, longitude: 0 }, 12);
    const south = tileForPosition({ latitude: 40, longitude: 0 }, 12);

    expect(north.y).toBeLessThan(south.y);
  });
});

describe('a point inside a tile, as a position', () => {
  it('returns the position the tile was found for, to within half a tile', () => {
    const tile = tileForPosition(LONDON, 15);

    const centre = positionInTile(tile, { x: EXTENT / 2, y: EXTENT / 2 }, EXTENT);

    expect(centre.latitude).toBeCloseTo(LONDON.latitude, 2);
    expect(centre.longitude).toBeCloseTo(LONDON.longitude, 2);
  });

  it('reverses tileForPosition exactly at a tile corner', () => {
    const tile = { zoom: 15, x: 16372, y: 10896 };

    const corner = positionInTile(tile, { x: 0, y: 0 }, EXTENT);

    expect(tileForPosition(corner, 15)).toEqual(tile);
  });

  it('reads a larger y as further south', () => {
    const tile = { zoom: 15, x: 16372, y: 10896 };
    const top = positionInTile(tile, { x: 0, y: 0 }, EXTENT);
    const bottom = positionInTile(tile, { x: 0, y: EXTENT }, EXTENT);

    expect(bottom.latitude).toBeLessThan(top.latitude);
  });
});

describe('local distances', () => {
  it('measures a degree of latitude at about 111 km', () => {
    expect(metresPerDegree(51.5).latitude).toBeCloseTo(111258.85, 1);
  });

  it('shrinks a degree of longitude toward the pole', () => {
    expect(metresPerDegree(60).longitude).toBeLessThan(metresPerDegree(0).longitude / 1.9);
  });

  it('reports a position to the north east as positive on both axes', () => {
    const offset = offsetInMetres(LONDON, { latitude: LONDON.latitude + 0.001, longitude: LONDON.longitude + 0.001 });

    expect(offset.north).toBeGreaterThan(0);
    expect(offset.east).toBeGreaterThan(0);
  });

  it('reports a position to the south west as negative on both axes', () => {
    const offset = offsetInMetres(LONDON, { latitude: LONDON.latitude - 0.001, longitude: LONDON.longitude - 0.001 });

    expect(offset.north).toBeLessThan(0);
    expect(offset.east).toBeLessThan(0);
  });

  it('measures a thousandth of a degree of latitude at about 111 m', () => {
    const north = { latitude: LONDON.latitude + 0.001, longitude: LONDON.longitude };

    expect(distanceInMetres(LONDON, north)).toBeCloseTo(111.3, 1);
  });

  it('measures no distance from a position to itself', () => {
    expect(distanceInMetres(LONDON, LONDON)).toBe(0);
  });
});
