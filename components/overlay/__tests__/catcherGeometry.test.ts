/**
 * Unit tests for components/overlay/catcherGeometry.ts
 *
 * The catcher contract: every screen point is caught EXACTLY when it is
 * outside the selected row rect — taps anywhere close the overlay, the row
 * body/time/bell receive taps directly.
 */

import { STYLES } from '@/shared/constants';

import { buildCatcherRegions, type CatcherRegion } from '../catcherGeometry';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

const WINDOW_WIDTH = 400;
const WINDOW_HEIGHT = 800;

const listMeasurement = { pageX: 12, pageY: 300, width: 376, height: 342 };
const ROW_INDEX = 2;

const rowRect = (rowIndex: number, list = listMeasurement): Rect => ({
  top: list.pageY + rowIndex * STYLES.prayer.height,
  left: list.pageX,
  width: list.width,
  height: STYLES.prayer.height,
});

const contains = (rect: Rect, point: Point): boolean =>
  point.x >= rect.left && point.x < rect.left + rect.width && point.y >= rect.top && point.y < rect.top + rect.height;

/** Samples the screen on a staggered grid (step 7px) so edges are probed densely */
const samplePoints = (): Point[] => {
  const points: Point[] = [];
  for (let y = 3; y < WINDOW_HEIGHT; y += 7) {
    for (let x = 3; x < WINDOW_WIDTH; x += 7) {
      points.push({ x, y });
    }
  }
  return points;
};

describe('buildCatcherRegions', () => {
  it('covers the screen except the selected row rect', () => {
    const regions: CatcherRegion[] = buildCatcherRegions({
      windowWidth: WINDOW_WIDTH,
      windowHeight: WINDOW_HEIGHT,
      list: listMeasurement,
      rowIndex: ROW_INDEX,
    });

    const row = rowRect(ROW_INDEX);
    for (const point of samplePoints()) {
      const caught = regions.some((region) => contains(region, point));
      expect(caught).toBe(!contains(row, point));
    }
  });

  it('falls back to one full-screen region when the list is unmeasured', () => {
    const regions = buildCatcherRegions({
      windowWidth: WINDOW_WIDTH,
      windowHeight: WINDOW_HEIGHT,
      list: null,
      rowIndex: ROW_INDEX,
    });

    expect(regions).toHaveLength(1);
    expect(regions[0]).toEqual({ id: 'full', top: 0, left: 0, width: WINDOW_WIDTH, height: WINDOW_HEIGHT });
  });
});
