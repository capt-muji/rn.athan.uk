/**
 * What a tap on a prayer row does. Pure, so it can be tested without a renderer (same split as
 * components/overlay/catcherGeometry.ts).
 */

import type { PrayerId } from '@/shared/constants';

export type RowPressAction = 'open' | 'close' | 'none';

/** The tapped row, by name, so two of its flags cannot be passed in each other's place */
interface TappedRow {
  /** Whether the row is on the Standard page */
  isStandard: boolean;
  /** The row's prayer id */
  id: PrayerId;
  /** Whether the row has passed */
  isPassed: boolean;
  /** Whether the open overlay highlights this row */
  isSelectedForOverlay: boolean;
}

/**
 * A tap closes the overlay on the row it highlights and opens it on any other row, except a passed Istijaba,
 * which has no later occurrence in the sequence for the overlay to show (Istijaba is on Fridays only)
 *
 * By id rather than index: an index is only a row's place on its day's list, which depends on the list's order
 * and on which rows that day has, while the id is the prayer itself.
 */
export const getRowPressAction = ({ isStandard, id, isPassed, isSelectedForOverlay }: TappedRow): RowPressAction => {
  if (!isStandard && id === 'istijaba' && isPassed) return 'none';
  return isSelectedForOverlay ? 'close' : 'open';
};
