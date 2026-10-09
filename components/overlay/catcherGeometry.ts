/**
 * Press-catcher geometry for the in-place overlay (ADR-014, per-element)
 *
 * The overlay layer holds no visuals over the content — non-selected content
 * fades itself out (per-element) while the veil backdrop darkens the
 * background behind everything. What the layer still owns is input: the
 * catcher covers the whole screen EXCEPT the selected row rect, so taps
 * anywhere close the overlay while the real row (its time and bell) stay
 * directly tappable.
 */

import { STYLES } from '@/shared/constants';
import type { PageCoordinates } from '@/shared/types';

export interface CatcherRegion {
  id: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface CatcherInput {
  windowWidth: number;
  windowHeight: number;
  list: PageCoordinates | null;
  rowIndex: number;
}

/**
 * Builds the press-catcher regions: the whole screen minus the selected-row
 * rect. Taps on any region close the overlay (as the old full-screen catcher
 * did); the row body, its time and its bell receive taps directly.
 */
export const buildCatcherRegions = (input: CatcherInput): CatcherRegion[] => {
  const { windowWidth, windowHeight, list, rowIndex } = input;

  if (!list || list.width <= 0) {
    return [{ id: 'full', top: 0, left: 0, width: windowWidth, height: windowHeight }];
  }

  const rowTop = list.pageY + rowIndex * STYLES.prayer.height;
  const rowBottom = rowTop + STYLES.prayer.height;
  const rowLeft = list.pageX;
  const rowRight = list.pageX + list.width;
  const rowSpan = rowBottom - rowTop;

  const regions = [
    { id: 'top', top: 0, left: 0, width: windowWidth, height: rowTop },
    { id: 'left', top: rowTop, left: 0, width: rowLeft, height: rowSpan },
    { id: 'right', top: rowTop, left: rowRight, width: windowWidth - rowRight, height: rowSpan },
    { id: 'bottom', top: rowBottom, left: 0, width: windowWidth, height: windowHeight - rowBottom },
  ];

  return regions.filter((region) => region.width > 0 && region.height > 0);
};
