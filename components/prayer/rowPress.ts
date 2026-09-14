/**
 * What a tap on a prayer row does. Pure, so it can be tested without a renderer (same split as
 * components/overlay/catcherGeometry.ts).
 */

export type RowPressAction = 'open' | 'close' | 'none';

/**
 * A tap closes the overlay on the row it highlights and opens it on any other row, except a passed Istijaba,
 * which has no later occurrence in the sequence for the overlay to show (Istijaba is on Fridays only)
 *
 * By name rather than index: an index is only a row's place on its day's list, which depends on the list's order
 * and on which rows that day has, while the name is the prayer itself.
 *
 * @param isStandard Whether the row is on the Standard page
 * @param english The row's English name
 * @param isPassed Whether the row has passed
 * @param isSelectedForOverlay Whether the open overlay highlights this row
 */
export const getRowPressAction = (
  isStandard: boolean,
  english: string,
  isPassed: boolean,
  isSelectedForOverlay: boolean
): RowPressAction => {
  if (!isStandard && english === 'Istijaba' && isPassed) return 'none';
  return isSelectedForOverlay ? 'close' : 'open';
};
