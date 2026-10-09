/**
 * What the overlay shows for its selected row: the row it sits on and the Extras explanation. Pure, so it can
 * be tested without a renderer (same split as catcherGeometry.ts).
 *
 * `selectedPrayerIndex` is the row's place on its day's list as the sequence holds it, while List draws the
 * rows in canonical order. The two agree only because the sequence is built that way, so the row is looked up
 * in the order List draws, and the explanation by the prayer's name.
 */

import { EXTRAS_ENGLISH, EXTRAS_EXPLANATIONS, EXTRAS_EXPLANATIONS_ARABIC } from '@/shared/constants';
import { canonicalDisplayOrder } from '@/shared/prayer';
import { type Prayer, ScheduleType } from '@/shared/types';

export interface OverlayExplanation {
  /** The Extras prayer's name; null on Standard */
  prayerName: string | null;
  /** Null on Standard, undefined for a name with no explanation (a row still loading) */
  explanation: string | null | undefined;
  explanationArabic: string | null | undefined;
}

/**
 * The row on screen the overlay's selection sits on, which the press-catcher leaves open and the explanation
 * box is placed against
 *
 * @param prayers The whole sequence
 * @param displayDate The list day on screen
 * @param type The overlay's schedule
 * @param selectedPrayerIndex The selected row's place on its day's list as the sequence holds it
 * @returns The row as drawn, or the selected index itself when that row is no longer on the list, so the
 *   geometry never receives -1
 */
export const getOverlayRow = (
  prayers: Prayer[],
  displayDate: string | null,
  type: ScheduleType,
  selectedPrayerIndex: number
): number => {
  const todayPrayers = prayers.filter((p) => p.belongsToDate === displayDate);
  const displayRow = canonicalDisplayOrder(todayPrayers, type).indexOf(selectedPrayerIndex);
  return displayRow >= 0 ? displayRow : selectedPrayerIndex;
};

/**
 * The explanation box's text for the selected prayer: Extras only, looked up by name because the explanations
 * follow EXTRAS_ENGLISH order
 *
 * @param type The overlay's schedule
 * @param english The selected prayer's English name
 */
export const getOverlayExplanation = (type: ScheduleType, english: string): OverlayExplanation => {
  const isExtra = type === ScheduleType.Extra;
  const explanationIndex = EXTRAS_ENGLISH.indexOf(english);

  return {
    prayerName: isExtra ? english : null,
    explanation: isExtra ? EXTRAS_EXPLANATIONS[explanationIndex] : null,
    explanationArabic: isExtra ? EXTRAS_EXPLANATIONS_ARABIC[explanationIndex] : null,
  };
};
