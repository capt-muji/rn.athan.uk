/**
 * Decoding a Mapbox Vector Tile: layers, tags and geometry, with no Node builtins in the path
 */

import { decodeVectorTile } from '@/shared/vectorTile';

/** Protobuf writers, so every fixture is built from the wire format the decoder must read */
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

const tag = (field: number, wire: number): number[] => varint((field << 3) | wire);
const lengthPrefixed = (field: number, payload: number[]): number[] => [
  ...tag(field, 2),
  ...varint(payload.length),
  ...payload,
];
const text = (value: string): number[] => [...new TextEncoder().encode(value)];
const zigzag = (value: number): number => (value < 0 ? -value * 2 - 1 : value * 2);

const stringValue = (value: string) => lengthPrefixed(1, text(value));
const boolValue = (value: boolean) => [...tag(7, 0), ...varint(value ? 1 : 0)];

const moveTo = (count: number) => varint((1 & 0x7) | (count << 3));
const lineTo = (count: number) => varint((2 & 0x7) | (count << 3));
const closePath = () => varint((7 & 0x7) | (1 << 3));

const feature = (tagIndices: number[], geometry: number[]): number[] => [
  ...lengthPrefixed(2, tagIndices.flatMap(varint)),
  ...lengthPrefixed(4, geometry),
];

const layer = (name: string, keys: string[], values: number[][], features: number[][], extent?: number): number[] => [
  ...lengthPrefixed(1, text(name)),
  ...features.flatMap((f) => lengthPrefixed(2, f)),
  ...keys.flatMap((k) => lengthPrefixed(3, text(k))),
  ...values.flatMap((v) => lengthPrefixed(4, v)),
  ...(extent === undefined ? [] : [...tag(5, 0), ...varint(extent)]),
];

const tile = (layers: number[][]): Uint8Array => new Uint8Array(layers.flatMap((l) => lengthPrefixed(3, l)));

describe('decoding a vector tile', () => {
  it('reads a layer by name with the features it holds', () => {
    const line = [
      ...moveTo(1),
      ...varint(zigzag(10)),
      ...varint(zigzag(20)),
      ...lineTo(1),
      ...varint(zigzag(5)),
      ...varint(zigzag(0)),
    ];
    const bytes = tile([layer('roads', ['name'], [stringValue('Whitehall')], [feature([0, 0], line)], 4096)]);

    const layers = decodeVectorTile(bytes);

    expect(Object.keys(layers)).toEqual(['roads']);
    expect(layers.roads.features[0].tags).toEqual({ name: 'Whitehall' });
  });

  it('reads coordinates as running totals, because geometry is relative', () => {
    const line = [
      ...moveTo(1),
      ...varint(zigzag(10)),
      ...varint(zigzag(20)),
      ...lineTo(2),
      ...varint(zigzag(5)),
      ...varint(zigzag(0)),
      ...varint(zigzag(-3)),
      ...varint(zigzag(7)),
    ];
    const bytes = tile([layer('roads', [], [], [feature([], line)])]);

    expect(decodeVectorTile(bytes).roads.features[0].parts[0]).toEqual([
      { x: 10, y: 20 },
      { x: 15, y: 20 },
      { x: 12, y: 27 },
    ]);
  });

  it('splits a feature into separate parts at each move', () => {
    const two = [
      ...moveTo(1),
      ...varint(zigzag(1)),
      ...varint(zigzag(1)),
      ...lineTo(1),
      ...varint(zigzag(2)),
      ...varint(zigzag(0)),
      ...moveTo(1),
      ...varint(zigzag(50)),
      ...varint(zigzag(50)),
      ...lineTo(1),
      ...varint(zigzag(2)),
      ...varint(zigzag(0)),
    ];
    const bytes = tile([layer('roads', [], [], [feature([], two)])]);

    expect(decodeVectorTile(bytes).roads.features[0].parts).toHaveLength(2);
  });

  it('closes a polygon ring into its own part', () => {
    const ring = [
      ...moveTo(1),
      ...varint(zigzag(0)),
      ...varint(zigzag(0)),
      ...lineTo(2),
      ...varint(zigzag(10)),
      ...varint(zigzag(0)),
      ...varint(zigzag(0)),
      ...varint(zigzag(10)),
      ...closePath(),
    ];
    const bytes = tile([layer('buildings', [], [], [feature([], ring)])]);

    expect(decodeVectorTile(bytes).buildings.features[0].parts).toHaveLength(1);
  });

  it('reads a boolean tag, which is how the archive marks a tunnel', () => {
    const bytes = tile([
      layer('roads', ['is_tunnel'], [boolValue(true)], [feature([0, 0], [...moveTo(1), ...varint(0), ...varint(0)])]),
    ]);

    expect(decodeVectorTile(bytes).roads.features[0].tags.is_tunnel).toBe(true);
  });

  it('reads an integer tag', () => {
    const intValue = [...tag(5, 0), ...varint(42)];
    const bytes = tile([
      layer('roads', ['min_zoom'], [intValue], [feature([0, 0], [...moveTo(1), ...varint(0), ...varint(0)])]),
    ]);

    expect(decodeVectorTile(bytes).roads.features[0].tags.min_zoom).toBe(42);
  });

  it('defaults the extent to 4096 when the layer does not declare one', () => {
    expect(decodeVectorTile(tile([layer('roads', [], [], [])])).roads.extent).toBe(4096);
  });

  it('reads the extent a layer declares', () => {
    expect(decodeVectorTile(tile([layer('roads', [], [], [], 8192)])).roads.extent).toBe(8192);
  });

  it('keeps every layer in a tile that holds several', () => {
    const bytes = tile([layer('roads', [], [], []), layer('water', [], [], []), layer('buildings', [], [], [])]);

    expect(Object.keys(decodeVectorTile(bytes)).sort()).toEqual(['buildings', 'roads', 'water']);
  });

  it('skips a field it does not use rather than misreading the rest of the tile', () => {
    // A feature id (field 1, varint) sits before the tags the decoder wants
    const withId = [...tag(1, 0), ...varint(99), ...lengthPrefixed(2, [...varint(0), ...varint(0)])];
    const bytes = tile([layer('roads', ['name'], [stringValue('Strand')], [withId])]);

    expect(decodeVectorTile(bytes).roads.features[0].tags).toEqual({ name: 'Strand' });
  });

  it('skips an unknown length-prefixed field without losing its place', () => {
    const withBytes = [...lengthPrefixed(9, text('ignored')), ...lengthPrefixed(2, [...varint(0), ...varint(0)])];
    const bytes = tile([layer('roads', ['name'], [stringValue('Strand')], [withBytes])]);

    expect(decodeVectorTile(bytes).roads.features[0].tags).toEqual({ name: 'Strand' });
  });

  it('skips a varint field inside a feature without losing its place', () => {
    const withVarint = [...tag(9, 0), ...varint(300), ...lengthPrefixed(2, [...varint(0), ...varint(0)])];
    const bytes = tile([layer('roads', ['name'], [stringValue('Strand')], [withVarint])]);

    expect(decodeVectorTile(bytes).roads.features[0].tags).toEqual({ name: 'Strand' });
  });

  it('ignores a close command that arrives before any point', () => {
    const leadingClose = [...closePath(), ...moveTo(1), ...varint(zigzag(4)), ...varint(zigzag(6))];
    const bytes = tile([layer('buildings', [], [], [feature([], leadingClose)])]);

    expect(decodeVectorTile(bytes).buildings.features[0].parts).toEqual([[{ x: 4, y: 6 }]]);
  });

  it('skips a fixed-width field without losing its place', () => {
    const withDouble = [...tag(9, 1), ...new Array(8).fill(0), ...lengthPrefixed(2, [...varint(0), ...varint(0)])];
    const bytes = tile([layer('roads', ['name'], [stringValue('Strand')], [withDouble])]);

    expect(decodeVectorTile(bytes).roads.features[0].tags).toEqual({ name: 'Strand' });
  });

  it('skips a 32-bit field without losing its place', () => {
    const withFloat = [...tag(9, 5), 0, 0, 0, 0, ...lengthPrefixed(2, [...varint(0), ...varint(0)])];
    const bytes = tile([layer('roads', ['name'], [stringValue('Strand')], [withFloat])]);

    expect(decodeVectorTile(bytes).roads.features[0].tags).toEqual({ name: 'Strand' });
  });

  it('skips an unknown layer field and a value of an unsupported kind', () => {
    const floatValue = [...tag(2, 5), 0, 0, 0, 0];
    const body = [...layer('roads', ['ratio'], [floatValue], []), ...tag(15, 0), ...varint(2)];

    expect(decodeVectorTile(tile([body])).roads.features).toEqual([]);
  });

  it('reads a multi-byte varint, which every real tile relies on', () => {
    const bytes = tile([layer('roads', [], [], [], 4096)]);

    expect(decodeVectorTile(bytes).roads.extent).toBe(4096);
  });

  it('drops a tag whose value the layer does not carry', () => {
    const bytes = tile([layer('roads', ['name'], [], [feature([0, 0], [...moveTo(1), ...varint(0), ...varint(0)])])]);

    expect(decodeVectorTile(bytes).roads.features[0].tags).toEqual({});
  });

  it('decodes a UTF-8 name outside the Latin alphabet', () => {
    const bytes = tile([
      layer(
        'roads',
        ['name'],
        [stringValue('طريق المسجد الحرام')],
        [feature([0, 0], [...moveTo(1), ...varint(0), ...varint(0)])]
      ),
    ]);

    expect(decodeVectorTile(bytes).roads.features[0].tags.name).toBe('طريق المسجد الحرام');
  });

  it('returns nothing for an empty tile rather than throwing', () => {
    expect(decodeVectorTile(new Uint8Array(0))).toEqual({});
  });

  it('skips an unknown top-level field and still reads the layers after it', () => {
    const unknown = [...tag(1, 0), ...varint(7)];
    const bytes = new Uint8Array([...unknown, ...lengthPrefixed(3, layer('roads', [], [], [], 4096))]);

    expect(decodeVectorTile(bytes).roads.extent).toBe(4096);
  });
});
