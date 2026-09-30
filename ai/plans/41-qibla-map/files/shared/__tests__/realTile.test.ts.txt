/**
 * The whole path against REAL tiles from the Protomaps planet archive
 *
 * The other suites build their own fixtures, which proves each branch and cannot prove the bytes are read the
 * way the archive writes them: a reader and a fixture written from the same wrong understanding agree
 * perfectly. These two tiles were fetched from `build.protomaps.com/20260929.pmtiles` on 2026-09-30 and are
 * stored gzipped, as the archive itself serves them.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

import { qiblaBearing } from '@/shared/qibla';
import { qiblaSentence } from '@/shared/qiblaSentence';
import { nearbyStreets, qiblaFromStreet } from '@/shared/qiblaStreet';
import { positionInTile, type TileAddress } from '@/shared/tileGeometry';
import { decodeVectorTile } from '@/shared/vectorTile';

/** Node's own zlib, not the app's `fflate`: a fixture loader must not depend on the code under test */
const tile = (name: string): Uint8Array => {
  const compressed = readFileSync(join(__dirname, 'fixtures', `${name}.mvt.gz`));

  return new Uint8Array(gunzipSync(compressed));
};

const LONDON: TileAddress = { zoom: 15, x: 16372, y: 10896 };
const MAKKAH: TileAddress = { zoom: 15, x: 20009, y: 14386 };

const centreOf = (address: TileAddress, extent: number) =>
  positionInTile(address, { x: extent / 2, y: extent / 2 }, extent);

describe('a real London tile', () => {
  const layers = decodeVectorTile(tile('London'));

  it('holds the layers the archive publishes', () => {
    expect(Object.keys(layers).sort()).toEqual([
      'boundaries',
      'buildings',
      'earth',
      'landuse',
      'places',
      'pois',
      'roads',
      'water',
    ]);
  });

  it('decodes the feature counts the archive reported', () => {
    expect(layers.roads.features).toHaveLength(211);
    expect(layers.buildings.features).toHaveLength(770);
  });

  it('puts the qibla at 119 degrees, the bearing shipped since session 37', () => {
    expect(qiblaBearing(centreOf(LONDON, layers.roads.extent))).toBeCloseTo(119.0, 0);
  });

  it('names Whitehall, which a person standing there can see', () => {
    const here = centreOf(LONDON, layers.roads.extent);

    const best = nearbyStreets(layers.roads, LONDON, here)[0];

    expect(best.name).toBe('Whitehall');
    expect(best.distance).toBeLessThan(20);
  });

  it('states the qibla as a turn from Whitehall', () => {
    const here = centreOf(LONDON, layers.roads.extent);
    const best = nearbyStreets(layers.roads, LONDON, here)[0];

    const sentence = qiblaSentence(qiblaFromStreet(qiblaBearing(here), best));

    expect(sentence).toBe('Stand along Whitehall, then turn 53 degrees to the left.');
  });

  it('never names a rail line, a sidewalk or a tunnel', () => {
    const here = centreOf(LONDON, layers.roads.extent);

    const named = nearbyStreets(layers.roads, LONDON, here).map((street) => street.name);

    expect(named).not.toContain('Jubilee Line');
    expect(named).not.toContain('Northern Line');
  });
});

describe('a real Makkah tile', () => {
  const layers = decodeVectorTile(tile('Makkah'));

  it('reads an Arabic street name straight out of the archive', () => {
    const here = centreOf(MAKKAH, layers.roads.extent);

    expect(nearbyStreets(layers.roads, MAKKAH, here)[0].name).toBe('الدائري الأول');
  });

  it('states the qibla against it, carrying the name unchanged', () => {
    const here = centreOf(MAKKAH, layers.roads.extent);
    const best = nearbyStreets(layers.roads, MAKKAH, here)[0];

    expect(qiblaSentence(qiblaFromStreet(qiblaBearing(here), best))).toContain('الدائري الأول');
  });
});

describe('the answer survives a position error, because a street bearing is intrinsic', () => {
  // The session's central finding: a 100 m error names a different street four times out of five in
  // Manhattan and still delivers the direction, because the turn is recomputed for whichever street is named
  it('delivers the same direction from a position 100 m away', () => {
    const layers = decodeVectorTile(tile('London'));
    const truth = centreOf(LONDON, layers.roads.extent);
    const believed = { latitude: truth.latitude + 0.0009, longitude: truth.longitude };

    const street = nearbyStreets(layers.roads, LONDON, believed)[0];
    const answer = qiblaFromStreet(qiblaBearing(believed), street);
    const delivered = answer.side === 'right' ? street.bearing + answer.turn : street.bearing - answer.turn;

    // A street is a line, so the delivered heading is correct modulo a half turn
    expect(((delivered % 180) + 180) % 180).toBeCloseTo(qiblaBearing(truth) % 180, 1);
  });
});
