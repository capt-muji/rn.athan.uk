/**
 * The PMTiles reader against the REAL header bytes the live planet archive served
 *
 * The synthetic fixtures prove each branch. This proves the field positions are right, which is the one thing a
 * self-built fixture cannot: a reader and a fixture written from the same wrong understanding agree with each
 * other perfectly. The bytes below were fetched from `build.protomaps.com/20260929.pmtiles` on 2026-09-30 and
 * are checked in as a base64 string, so the suite needs no network.
 */

import { holdsVectorTiles, parseHeader, tileIdFor } from '@/shared/pmtiles';
import { tileForPosition } from '@/shared/tileGeometry';

/** The first 127 bytes of the 20260929 planet build, base64 */
const REAL_HEADER_BASE64 =
  'UE1UaWxlcwN/AAAAAAAAAMc8AAAAAAAAke0jJyAAAACbBAAAAAAAACzyIycgAAAAwKUBFQAAAAAAQAAAAAAAAJGtIycgAAAAVVVVVQAAAAB+KZwKAAAAAILaHAgAAAAAAQICAQAPAC62lEk6Ts0A0klrt8WxMgAAAAAAAAAAAA==';

const decodeBase64 = (value: string): Uint8Array => Uint8Array.from(Buffer.from(value, 'base64'));

describe('the real planet archive header', () => {
  const header = parseHeader(decodeBase64(REAL_HEADER_BASE64));

  it('is a PMTiles v3 archive of vector tiles', () => {
    expect(holdsVectorTiles(header)).toBe(true);
  });

  it('covers the whole world up to zoom 15', () => {
    expect(header.minZoom).toBe(0);
    expect(header.maxZoom).toBe(15);
  });

  it('reports the Web Mercator bounds, which is how a wrong field position shows itself', () => {
    expect(header.minLongitude).toBeCloseTo(-180, 4);
    expect(header.maxLongitude).toBeCloseTo(180, 4);
    expect(header.minLatitude).toBeCloseTo(-85.0511287, 4);
    expect(header.maxLatitude).toBeCloseTo(85.0511287, 4);
  });

  it('puts its root directory immediately after the header', () => {
    expect(header.rootOffset).toBe(127);
  });

  it('puts its tile data and its leaf directories where a 138 GB archive would', () => {
    expect(header.tileDataOffset).toBeGreaterThan(0);
    expect(header.leafOffset).toBeGreaterThan(header.tileDataOffset);
  });
});

describe('the tile the app would ask for', () => {
  it("resolves London's position to the tile id the live archive served", () => {
    const tile = tileForPosition({ latitude: 51.5074, longitude: -0.1278 }, 15);

    expect(tile).toEqual({ zoom: 15, x: 16372, y: 10896 });
    expect(tileIdFor(tile)).toBe(518974351);
  });
});
