/**
 * A Mapbox Vector Tile reader, holding only what the qibla map draws
 *
 * Hand-written rather than taken from a library because the published readers reach for Node's `Buffer` and the
 * browser builds carry a renderer this screen never uses. Everything here is `Uint8Array` and `TextDecoder`, both of
 * which Hermes has.
 *
 * Format: https://github.com/mapbox/vector-tile-spec/tree/master/2.1
 */

const WIRE_VARINT = 0;
const WIRE_BYTES = 2;

/** Bytes a fixed-width wire type occupies. Anything absent here is variable length. */
const FIXED_WIDTHS: Record<number, number> = { 1: 8, 5: 4 };

// LineTo (2) needs no constant: it is the only remaining command, so it is the loop's default
const COMMAND_MOVE_TO = 1;
const COMMAND_CLOSE_PATH = 7;

const DEFAULT_EXTENT = 4096;

/** What a feature's tags resolve to once the layer's key and value tables are applied */
export type TagValue = string | number | boolean;

/** One geometry part: a line string, or one ring of a polygon */
export type FeaturePart = { x: number; y: number }[];

export interface TileFeature {
  tags: Record<string, TagValue>;
  parts: FeaturePart[];
}

export interface TileLayer {
  name: string;
  extent: number;
  features: TileFeature[];
}

/** A cursor over the tile's bytes. Protobuf is self-describing, so every read advances it. */
interface Cursor {
  bytes: Uint8Array;
  offset: number;
}

const readVarint = (cursor: Cursor): number => {
  let result = 0;
  let shift = 0;
  let byte = 0;

  do {
    byte = cursor.bytes[cursor.offset];
    cursor.offset += 1;
    result += (byte & 0x7f) * 2 ** shift;
    shift += 7;
  } while (byte >= 0x80);

  return result;
};

const readLengthPrefixed = (cursor: Cursor): Uint8Array => {
  const length = readVarint(cursor);
  const slice = cursor.bytes.subarray(cursor.offset, cursor.offset + length);
  cursor.offset += length;

  return slice;
};

const skipField = (cursor: Cursor, wireType: number): void => {
  if (wireType === WIRE_VARINT) readVarint(cursor);
  else if (wireType === WIRE_BYTES) readLengthPrefixed(cursor);
  else cursor.offset += FIXED_WIDTHS[wireType];
};

const decoder = new TextDecoder();

/** Zigzag: protobuf encodes a signed delta as an unsigned varint with the sign in the low bit */
const zigzagToSigned = (encoded: number): number => (encoded >> 1) ^ -(encoded & 1);

/**
 * A feature's geometry, as parts in the tile's own coordinate space
 *
 * Geometry is a command stream of relative moves, so a part is only meaningful read in order from its start.
 */
const readGeometry = (bytes: Uint8Array): FeaturePart[] => {
  const cursor: Cursor = { bytes, offset: 0 };
  const parts: FeaturePart[] = [];
  let current: FeaturePart = [];
  let x = 0;
  let y = 0;

  while (cursor.offset < bytes.length) {
    const header = readVarint(cursor);
    const command = header & 0x7;
    const repeats = header >> 3;

    if (command === COMMAND_CLOSE_PATH) {
      if (current.length > 0) {
        parts.push(current);
        current = [];
      }
      continue;
    }

    for (let repeat = 0; repeat < repeats; repeat += 1) {
      if (command === COMMAND_MOVE_TO && current.length > 0) {
        parts.push(current);
        current = [];
      }
      x += zigzagToSigned(readVarint(cursor));
      y += zigzagToSigned(readVarint(cursor));
      current.push({ x, y });
    }
  }

  if (current.length > 0) parts.push(current);

  return parts;
};

const readValue = (bytes: Uint8Array): TagValue | null => {
  const cursor: Cursor = { bytes, offset: 0 };
  let value: TagValue | null = null;

  while (cursor.offset < bytes.length) {
    const key = readVarint(cursor);
    const field = key >> 3;
    const wireType = key & 0x7;

    if (field === 1 && wireType === WIRE_BYTES) value = decoder.decode(readLengthPrefixed(cursor));
    else if (field === 4 || field === 5) value = readVarint(cursor);
    else if (field === 7) value = readVarint(cursor) !== 0;
    else skipField(cursor, wireType);
  }

  return value;
};

const readFeature = (bytes: Uint8Array): { tagIndices: number[]; parts: FeaturePart[] } => {
  const cursor: Cursor = { bytes, offset: 0 };
  const tagIndices: number[] = [];
  let parts: FeaturePart[] = [];

  while (cursor.offset < bytes.length) {
    const key = readVarint(cursor);
    const field = key >> 3;
    const wireType = key & 0x7;

    if (field === 2 && wireType === WIRE_BYTES) {
      const packed: Cursor = { bytes: readLengthPrefixed(cursor), offset: 0 };
      while (packed.offset < packed.bytes.length) tagIndices.push(readVarint(packed));
    } else if (field === 4 && wireType === WIRE_BYTES) parts = readGeometry(readLengthPrefixed(cursor));
    else skipField(cursor, wireType);
  }

  return { tagIndices, parts };
};

const readLayer = (bytes: Uint8Array): TileLayer => {
  const cursor: Cursor = { bytes, offset: 0 };
  const keys: string[] = [];
  const values: (TagValue | null)[] = [];
  const raw: { tagIndices: number[]; parts: FeaturePart[] }[] = [];
  let name = '';
  let extent = DEFAULT_EXTENT;

  while (cursor.offset < bytes.length) {
    const key = readVarint(cursor);
    const field = key >> 3;
    const wireType = key & 0x7;

    if (field === 1 && wireType === WIRE_BYTES) name = decoder.decode(readLengthPrefixed(cursor));
    else if (field === 2 && wireType === WIRE_BYTES) raw.push(readFeature(readLengthPrefixed(cursor)));
    else if (field === 3 && wireType === WIRE_BYTES) keys.push(decoder.decode(readLengthPrefixed(cursor)));
    else if (field === 4 && wireType === WIRE_BYTES) values.push(readValue(readLengthPrefixed(cursor)));
    else if (field === 5) extent = readVarint(cursor);
    else skipField(cursor, wireType);
  }

  const features = raw.map((feature) => {
    const tags: Record<string, TagValue> = {};
    for (let index = 0; index + 1 < feature.tagIndices.length; index += 2) {
      const tagKey = keys[feature.tagIndices[index]];
      const tagValue = values[feature.tagIndices[index + 1]];
      if (tagKey !== undefined && tagValue !== null && tagValue !== undefined) tags[tagKey] = tagValue;
    }

    return { tags, parts: feature.parts };
  });

  return { name, extent, features };
};

/**
 * Every layer in a decoded vector tile, by name
 *
 * @param bytes The tile's uncompressed protobuf
 * @returns The layers, keyed by the name the tile gives each one
 */
export const decodeVectorTile = (bytes: Uint8Array): Record<string, TileLayer> => {
  const cursor: Cursor = { bytes, offset: 0 };
  const layers: Record<string, TileLayer> = {};

  while (cursor.offset < bytes.length) {
    const key = readVarint(cursor);
    const field = key >> 3;
    const wireType = key & 0x7;

    if (field === 3 && wireType === WIRE_BYTES) {
      const layer = readLayer(readLengthPrefixed(cursor));
      layers[layer.name] = layer;
    } else skipField(cursor, wireType);
  }

  return layers;
};
