/**
 * Choosing the street the qibla is stated against, and the turn from it
 */

import { nearbyStreets, qiblaFromStreet, SEARCH_RADIUS_METRES } from '@/shared/qiblaStreet';
import { positionInTile, type TileAddress } from '@/shared/tileGeometry';
import type { TileLayer } from '@/shared/vectorTile';

// The real London tile the pipeline was proven on, so tile coordinates map to real ground
const LONDON_TILE: TileAddress = { zoom: 15, x: 16372, y: 10896 };
const EXTENT = 4096;
const CENTRE = EXTENT / 2;

/** Measured at z15 tile (16372, 10896): 100 tile units span 18.6 m on both axes */
const UNITS_PER_METRE = 5.376;

const street = (name: string, tags: Record<string, string | number | boolean>, points: { x: number; y: number }[]) => ({
  tags: { name, kind: 'minor_road', ...tags },
  parts: [points],
});

const layer = (features: ReturnType<typeof street>[]): TileLayer => ({ name: 'roads', extent: EXTENT, features });

/**
 * A line running due north, offset east of the user and centred on their latitude
 *
 * Tile y grows SOUTHWARD, so the northern end is the smaller y. Writing it the other way round is what made the
 * first draft of this helper produce a street bearing of 180 where it meant 0.
 *
 * The nearest point of a line centred this way is its middle, so the offset IS the distance the finder measures.
 */
const northSouth = (offsetMetres: number, lengthMetres = 200) => [
  { x: CENTRE + offsetMetres * UNITS_PER_METRE, y: CENTRE + (lengthMetres / 2) * UNITS_PER_METRE },
  { x: CENTRE + offsetMetres * UNITS_PER_METRE, y: CENTRE },
  { x: CENTRE + offsetMetres * UNITS_PER_METRE, y: CENTRE - (lengthMetres / 2) * UNITS_PER_METRE },
];

/**
 * The user stands at the tile's own centre, so a street's offset in the helper above is its distance
 *
 * Taken from `positionInTile` rather than written as a literal: a hand-picked nearby position sits tens of metres
 * from the centre, which silently compresses every distance the fixtures mean to set.
 */
const HERE = positionInTile(LONDON_TILE, { x: CENTRE, y: CENTRE }, EXTENT);

describe('finding the street to state the qibla against', () => {
  it('names a road the user can see and never the subway beneath it', () => {
    const roads = layer([
      street('IRT Lexington Avenue Line', { kind: 'rail', kind_detail: 'subway' }, northSouth(5)),
      street('Maiden Lane', { kind: 'minor_road', kind_detail: 'residential' }, northSouth(20)),
    ]);

    const found = nearbyStreets(roads, LONDON_TILE, HERE);

    expect(found.map((entry) => entry.name)).toEqual(['Maiden Lane']);
  });

  it('refuses a tunnel named as one even when the segment carries no tunnel tag', () => {
    const roads = layer([
      street('Queensway Tunnel', { kind: 'major_road', kind_detail: 'trunk' }, northSouth(10)),
      street('Nelson Street', { kind: 'minor_road', kind_detail: 'residential' }, northSouth(30)),
    ]);

    const found = nearbyStreets(roads, LONDON_TILE, HERE);

    expect(found.map((entry) => entry.name)).toEqual(['Nelson Street']);
  });

  it('refuses a tunnel the tile tags as one even when its name does not say so', () => {
    const roads = layer([
      street('King Abdulaziz Road', { kind: 'major_road', kind_detail: 'trunk', is_tunnel: true }, northSouth(10)),
      street('Shiab Amir Street', { kind: 'major_road', kind_detail: 'tertiary' }, northSouth(30)),
    ]);

    const found = nearbyStreets(roads, LONDON_TILE, HERE);

    expect(found.map((entry) => entry.name)).toEqual(['Shiab Amir Street']);
  });

  it('ignores a road whose name is present but empty', () => {
    const roads = layer([street('', { kind_detail: 'residential' }, northSouth(15))]);

    expect(nearbyStreets(roads, LONDON_TILE, HERE)).toEqual([]);
  });

  it('refuses a sidewalk, which would name the same street twice', () => {
    const roads = layer([
      street('The Mall', { kind: 'path', kind_detail: 'sidewalk' }, northSouth(8)),
      street('The Mall', { kind: 'major_road', kind_detail: 'primary' }, northSouth(25)),
    ]);

    const found = nearbyStreets(roads, LONDON_TILE, HERE);

    expect(found).toHaveLength(1);
    expect(found[0].length).toBeGreaterThan(190);
  });

  it('refuses a service lane, which is a real road kind but not one anybody signposts', () => {
    const roads = layer([
      street('Lower Robert Street', { kind: 'minor_road', kind_detail: 'service' }, northSouth(10)),
      street('Whitehall Place', { kind: 'minor_road', kind_detail: 'residential' }, northSouth(30)),
    ]);

    const found = nearbyStreets(roads, LONDON_TILE, HERE);

    expect(found.map((entry) => entry.name)).toEqual(['Whitehall Place']);
  });

  it('refuses a road that bends, because a curve has no single direction', () => {
    const bent = [
      { x: CENTRE, y: CENTRE - 100 * UNITS_PER_METRE },
      { x: CENTRE + 90 * UNITS_PER_METRE, y: CENTRE },
      { x: CENTRE, y: CENTRE + 100 * UNITS_PER_METRE },
    ];
    const roads = layer([street('Crescent Way', { kind_detail: 'residential' }, bent)]);

    expect(nearbyStreets(roads, LONDON_TILE, HERE)).toEqual([]);
  });

  it('refuses an alley too short to sight along', () => {
    const roads = layer([street('Scotland Place', { kind_detail: 'residential' }, northSouth(10, 30))]);

    expect(nearbyStreets(roads, LONDON_TILE, HERE)).toEqual([]);
  });

  it('refuses a street beyond the search radius', () => {
    const roads = layer([street('Victoria Embankment', { kind_detail: 'primary' }, northSouth(400))]);

    expect(nearbyStreets(roads, LONDON_TILE, HERE)).toEqual([]);
  });

  // Both are inside the radius and the FAR one is much longer, so only nearness can decide this.
  // The offsets are chosen from the measured distances the helper produces, not from its arguments.
  it('prefers the nearer street even when a longer one is also in range', () => {
    const roads = layer([
      street('Far Road', { kind_detail: 'primary' }, northSouth(100, 400)),
      street('Near Road', { kind_detail: 'residential' }, northSouth(12, 130)),
    ]);

    const found = nearbyStreets(roads, LONDON_TILE, HERE);

    expect(found).toHaveLength(2);
    expect(found[0].name).toBe('Near Road');
  });

  it('prefers the longer of two streets the same distance away', () => {
    const roads = layer([
      street('Short Road', { kind_detail: 'residential' }, northSouth(20, 60)),
      street('Long Road', { kind_detail: 'primary' }, northSouth(-20, 380)),
    ]);

    const found = nearbyStreets(roads, LONDON_TILE, HERE);

    expect(found).toHaveLength(2);
    expect(found[0].name).toBe('Long Road');
  });

  it('reports one entry for a street the tile splits into several segments', () => {
    const roads = layer([
      street('Whitehall', { kind_detail: 'primary' }, northSouth(15, 200)),
      street('Whitehall', { kind_detail: 'primary' }, northSouth(18, 180)),
    ]);

    expect(nearbyStreets(roads, LONDON_TILE, HERE)).toHaveLength(1);
  });

  it('measures a north-south street as running due north', () => {
    const roads = layer([street('Whitehall', { kind_detail: 'primary' }, northSouth(15))]);

    expect(nearbyStreets(roads, LONDON_TILE, HERE)[0].bearing).toBeCloseTo(0, 1);
  });

  it('ignores a feature with a single point, which has no direction', () => {
    const roads = layer([street('Dot', { kind_detail: 'residential' }, [{ x: CENTRE, y: CENTRE }])]);

    expect(nearbyStreets(roads, LONDON_TILE, HERE)).toEqual([]);
  });

  it('ignores an unnamed road, which cannot be stated in a sentence', () => {
    const roads: TileLayer = {
      name: 'roads',
      extent: EXTENT,
      features: [{ tags: { kind: 'minor_road', kind_detail: 'residential' }, parts: [northSouth(15)] }],
    };

    expect(nearbyStreets(roads, LONDON_TILE, HERE)).toEqual([]);
  });

  it('keeps a Jakarta living street, which is what a kampung lane is tagged as', () => {
    const roads = layer([street('Gang Remaja VI', { kind: 'other', kind_detail: 'living_street' }, northSouth(20))]);

    expect(nearbyStreets(roads, LONDON_TILE, HERE)).toHaveLength(1);
  });

  it('searches no further than the published radius', () => {
    expect(SEARCH_RADIUS_METRES).toBe(122);
  });
});

describe('the turn from a street to the qibla', () => {
  // A street is a line, so every case asserts the acute reading a user can follow either way along it
  it.each([
    // street bearing, qibla, expected turn, expected side
    [0, 53, 53, 'right'],
    [0, 307, 53, 'left'],
    // the same line digitised the other way must give the same instruction, not a mirrored one
    [180, 53, 53, 'right'],
    [172, 119, 53, 'left'],
    [90, 119, 29, 'right'],
    [0, 179, 1, 'left'],
    [0, 90, 90, 'right'],
  ])('a street at %s degrees with the qibla at %s turns %s to the %s', (bearing, qibla, turn, side) => {
    const result = qiblaFromStreet(qibla, { name: 'Test Road', bearing, distance: 10, length: 200 });

    expect(result.turn).toBeCloseTo(turn, 6);
    expect(result.side).toBe(side);
  });

  it('carries the street through so the sentence and the drawing agree', () => {
    const street = { name: 'Whitehall', bearing: 172, distance: 15, length: 289 };

    expect(qiblaFromStreet(119, street).street).toBe(street);
  });
});
