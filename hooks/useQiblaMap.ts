/**
 * The Qibla screen's whole state, computed from the position and the map data alone
 *
 * Nothing here reads a sensor. The bearing is arithmetic and the street's direction is a fact of the ground
 * held in the tile, so no steel in the room can move either.
 */

import { useCallback, useState } from 'react';

import { readPosition } from '@/device/qibla';
import { tilesAround } from '@/device/tiles';
import { type Position, qiblaBearing } from '@/shared/qibla';
import { type NearbyStreet, nearbyStreets, type QiblaFromStreet, qiblaFromStreet } from '@/shared/qiblaStreet';
import { distanceInMetres, positionInTile } from '@/shared/tileGeometry';

/** What the screen is showing. `ready` is the only state that carries an answer. */
export type QiblaMapState =
  | { status: 'looking' }
  | { status: 'unavailable' }
  | { status: 'nomap' }
  | {
      status: 'ready';
      here: Position;
      /** The qibla itself, which is what the map's ray is drawn at */
      qibla: number;
      answer: QiblaFromStreet;
      streets: NearbyStreet[];
      roads: StreetShape[];
    };

/** A street as the map draws it: the positions of its line on the ground */
export interface StreetShape {
  points: Position[];
}

/** Only these are drawn. Rail is underground or fenced, and a path repeats a road it runs beside. */
const DRAWN_KINDS = new Set(['highway', 'major_road', 'minor_road', 'other']);

/** Wider than the search radius, so a street the sentence names is never cut off at the edge of the picture */
const DRAW_RADIUS_METRES = 200;

/**
 * Every road line near the user, as ground positions
 *
 * Taken from the same tiles the street finder reads, so the drawn picture and the named street can never
 * disagree about where a road runs.
 */
const roadShapes = (tiles: Awaited<ReturnType<typeof tilesAround>>, here: Position): StreetShape[] => {
  const shapes: StreetShape[] = [];

  for (const tile of tiles) {
    const roads = tile.layers.roads;
    if (!roads) continue;

    for (const feature of roads.features) {
      if (!DRAWN_KINDS.has(String(feature.tags.kind))) continue;

      for (const part of feature.parts) {
        const points = part.map((point) => positionInTile(tile.address, point, roads.extent));
        if (points.some((point) => distanceInMetres(here, point) <= DRAW_RADIUS_METRES)) shapes.push({ points });
      }
    }
  }

  return shapes;
};

/**
 * The Qibla screen's state, and the call that fills it
 *
 * Nothing runs until `start` is called, because every sheet in this app is mounted from launch and a
 * mount-time read would fetch tiles on every device for a screen the user may never open.
 *
 * @returns The state, and the call the sheet makes when it opens
 */
export const useQiblaMap = (): { state: QiblaMapState; start: () => Promise<void> } => {
  const [state, setState] = useState<QiblaMapState>({ status: 'looking' });

  const start = useCallback(async () => {
    setState({ status: 'looking' });

    const here = await readPosition();
    if (!here) {
      setState({ status: 'unavailable' });
      return;
    }

    const tiles = await tilesAround(here);
    const streets = tiles.flatMap((tile) =>
      tile.layers.roads ? nearbyStreets(tile.layers.roads, tile.address, here) : []
    );

    if (streets.length === 0) {
      setState({ status: 'nomap' });
      return;
    }

    const qibla = qiblaBearing(here);
    const answer = qiblaFromStreet(qibla, streets[0]);
    setState({ status: 'ready', here, qibla, answer, streets, roads: roadShapes(tiles, here) });
  }, []);

  return { state, start };
};
