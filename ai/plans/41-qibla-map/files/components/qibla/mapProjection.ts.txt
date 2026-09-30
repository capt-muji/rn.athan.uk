/** Placing the map's ground positions on the canvas, and the qibla ray across it */

import type { Position } from '@/shared/qibla';
import { offsetInMetres } from '@/shared/tileGeometry';

const HALF_TURN = 180;
const RADIANS_PER_DEGREE = Math.PI / HALF_TURN;

/**
 * The ground radius drawn around the user
 *
 * Measured on the floor device: a 122 m view is 49 paths and 92 ms to record, and it still holds 16 roads,
 * where the whole tile is 953 paths and 1.8 seconds. Drawing more is both slower and less useful, since the
 * part a user can check is the part they can see.
 */
export const DRAWN_RADIUS_METRES = 122;

/** A point on the drawn canvas, in points from its top left */
export interface CanvasPoint {
  x: number;
  y: number;
}

/**
 * Where a position falls on the canvas
 *
 * The user is always at the centre, and north is always up: the map never rotates, because rotating it would
 * need the magnetometer this screen exists to avoid.
 *
 * @param here Where the user is standing
 * @param target The position being placed
 * @param canvas The canvas's width and height in points
 * @returns The point to draw at
 */
export const projectToCanvas = (here: Position, target: Position, canvas: number): CanvasPoint => {
  const offset = offsetInMetres(here, target);
  const pointsPerMetre = canvas / 2 / DRAWN_RADIUS_METRES;

  return {
    x: canvas / 2 + offset.east * pointsPerMetre,
    y: canvas / 2 - offset.north * pointsPerMetre,
  };
};

/**
 * Where the qibla ray ends
 *
 * Drawn as a short ray at the great-circle initial bearing, never as a line toward Makkah: a straight line on
 * a Mercator map IS the rhumb line, which is wrong by 14.84 degrees in London and 71.31 in Los Angeles, and a
 * shipped app has been caught at exactly that. Over this radius the geodesic and the initial bearing differ
 * by 0.010 degrees.
 *
 * @param bearing The qibla, in degrees clockwise from true north
 * @param canvas The canvas's width and height in points
 * @returns The ray's far end, on the canvas
 */
export const rayEndpoint = (bearing: number, canvas: number): CanvasPoint => {
  const radians = bearing * RADIANS_PER_DEGREE;
  const reach = canvas / 2;

  return {
    x: canvas / 2 + Math.sin(radians) * reach,
    y: canvas / 2 - Math.cos(radians) * reach,
  };
};
