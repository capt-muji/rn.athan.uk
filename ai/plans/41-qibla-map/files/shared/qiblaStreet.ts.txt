/**
 * The street the qibla is stated against
 *
 * The screen's answer is a sentence about a street the user can see, because a street's bearing is a fact of the
 * ground held in the tile data and no magnetometer can bend it. Measured consequence: an error of 100 m in the
 * position names a different street four times out of five in Manhattan and still delivers the direction to three
 * decimal places, because the turn is recomputed for whichever street is named.
 */

import { normaliseHeading, type Position, shortestDelta } from '@/shared/qibla';
import { metresPerDegree, offsetInMetres, positionInTile, type TileAddress } from '@/shared/tileGeometry';
import type { TileLayer } from '@/shared/vectorTile';

const HALF_TURN = 180;
const QUARTER_TURN = 90;
const DEGREES_PER_RADIAN = HALF_TURN / Math.PI;

/** What the user standing on a pavement can actually see. Everything else in the layer is rail, path or service. */
const VISIBLE_KINDS = new Set(['highway', 'major_road', 'minor_road', 'other']);

/**
 * Detail values that carry a name but are not a street a person sights along
 *
 * A sidewalk and a crossing repeat their parent road's bearing under a different name, which would offer the user two
 * references for one street. Steps and corridors are not lines. Service covers car parks and delivery lanes.
 */
const EXCLUDED_DETAILS = new Set(['sidewalk', 'crossing', 'steps', 'corridor', 'service']);

/** Below this the segment is too short to sight along: measured against a 45 m London alley that read as usable */
const MINIMUM_LENGTH_METRES = 40;

/** Chord over path length. A bent road has no single direction, so a curve is refused rather than averaged. */
const MINIMUM_STRAIGHTNESS = 0.95;

/** How far from the user a street may be and still be the one in front of them */
export const SEARCH_RADIUS_METRES = 122;

/** A street near the user, with everything the sentence and the drawing need */
export interface NearbyStreet {
  name: string;
  /** Degrees clockwise from true north, in [0, 360). The direction the segment runs, either way along it. */
  bearing: number;
  /** Metres from the user to the nearest point of the segment */
  distance: number;
  /** The segment's end-to-end length in metres */
  length: number;
}

/** Which way to turn off a street to face the qibla, and by how much */
export interface QiblaFromStreet {
  street: NearbyStreet;
  /** The acute angle between the street's line and the qibla, in [0, 90] */
  turn: number;
  /** Which way to turn through that angle */
  side: 'left' | 'right';
}

const isTunnelName = (name: string): boolean => /\btunnel\b/i.test(name);

/**
 * Whether a road feature's tags describe something the user can see and name
 *
 * The tunnel test reads BOTH the tag and the name: `is_tunnel` is per segment, so a tunnel's approach ramps carry the
 * tunnel's name with the tag absent, which is how "Queensway Tunnel" survived a tag-only filter in Birmingham.
 */
const isVisibleStreet = (tags: Record<string, string | number | boolean>): boolean => {
  const name = tags.name;
  if (typeof name !== 'string' || name.length === 0) return false;
  if (!VISIBLE_KINDS.has(String(tags.kind))) return false;
  if (EXCLUDED_DETAILS.has(String(tags.kind_detail))) return false;
  if (tags.is_tunnel === true) return false;

  return !isTunnelName(name);
};

/**
 * The bearing a run of tile points travels, end to end
 *
 * End to end rather than segment by segment: the user sights along the whole street, and the straightness test has
 * already refused anything whose ends do not describe its middle.
 */
const bearingOfPart = (from: Position, to: Position): number => {
  const offset = offsetInMetres(from, to);

  return normaliseHeading(Math.atan2(offset.east, offset.north) * DEGREES_PER_RADIAN);
};

/**
 * How useful a street is as a reference
 *
 * Nearness dominates, because the reference has to be the street the user is looking at; length breaks ties, since a
 * long street is easier to sight along than a short one.
 */
const usefulness = (street: NearbyStreet): number => {
  const nearness = 1 / (1 + street.distance / 30);
  const reach = Math.min(street.length, 400) / 400;

  return nearness * 2 + reach;
};

/**
 * The streets worth naming, best first, with one entry per name
 *
 * Exported because the caller reads a GRID of tiles and each is searched separately: concatenating the
 * per-tile results leaves a street 100 m away in the first tile ahead of one 5 m away in the second, which
 * would name a road the user cannot see. Ranking the combined list is the caller's last step.
 *
 * @param streets Every candidate found, in any order
 * @returns The same streets, best first, deduplicated by name
 */
export const rankStreets = (streets: NearbyStreet[]): NearbyStreet[] => {
  const seen = new Set<string>();

  return [...streets]
    .sort((first, second) => usefulness(second) - usefulness(first))
    .filter((street) => {
      if (seen.has(street.name)) return false;
      seen.add(street.name);

      return true;
    });
};

/**
 * Every street near the user that is worth naming, best first
 *
 * @param roads The tile's `roads` layer
 * @param tile The address of the tile the layer came from
 * @param here Where the user is standing
 * @returns The usable streets, best first. Empty where the map has nothing to offer, which is the rural case.
 */
export const nearbyStreets = (roads: TileLayer, tile: TileAddress, here: Position): NearbyStreet[] => {
  const scale = metresPerDegree(here.latitude);
  const found: NearbyStreet[] = [];

  for (const feature of roads.features) {
    if (!isVisibleStreet(feature.tags)) continue;

    for (const part of feature.parts) {
      if (part.length < 2) continue;

      let distance = Number.POSITIVE_INFINITY;
      let travelled = 0;
      let previous: Position | null = null;

      for (const point of part) {
        const position = positionInTile(tile, point, roads.extent);
        const east = (position.longitude - here.longitude) * scale.longitude;
        const north = (position.latitude - here.latitude) * scale.latitude;
        const toPoint = Math.hypot(east, north);
        if (toPoint < distance) distance = toPoint;
        if (previous !== null) {
          const step = offsetInMetres(previous, position);
          travelled += Math.hypot(step.east, step.north);
        }
        previous = position;
      }

      if (distance > SEARCH_RADIUS_METRES) continue;

      const start = positionInTile(tile, part[0], roads.extent);
      const end = positionInTile(tile, part[part.length - 1], roads.extent);
      const span = offsetInMetres(start, end);
      const length = Math.hypot(span.east, span.north);
      if (length < MINIMUM_LENGTH_METRES) continue;
      if (travelled <= 0 || length / travelled < MINIMUM_STRAIGHTNESS) continue;

      found.push({ name: String(feature.tags.name), bearing: bearingOfPart(start, end), distance, length });
    }
  }

  return rankStreets(found);
};

/**
 * The turn from a street's line to the qibla
 *
 * A street is a line rather than an arrow, so the answer is always the acute angle: a user who sights along it in
 * either direction and turns by this reaches the same heading. That is also why this can never stand alone as a
 * sentence, and is read beside the drawn map.
 *
 * @param qibla The qibla bearing from the user, degrees clockwise from true north
 * @param street The street being turned from
 * @returns The street, the acute turn in [0, 90], and the side to turn
 */
export const qiblaFromStreet = (qibla: number, street: NearbyStreet): QiblaFromStreet => {
  const signed = shortestDelta(street.bearing, qibla);
  const isRight = signed > 0;
  const magnitude = Math.abs(signed);

  if (magnitude > QUARTER_TURN) {
    return { street, turn: HALF_TURN - magnitude, side: isRight ? 'left' : 'right' };
  }

  return { street, turn: magnitude, side: isRight ? 'right' : 'left' };
};
