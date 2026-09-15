/**
 * Where the active pill sits and whether it shows. Pure, so it can be tested without a renderer (same split as
 * components/overlay/catcherGeometry.ts).
 *
 * The next prayer is found as an index into its day's rows as the sequence holds them, while List draws Extras
 * rows by name, so the pill's row is looked up in the order List draws. The overlay's selection is an index of
 * the same kind, so it is compared with the next prayer's index, never with the drawn row.
 */

import type { PrayerWithStatus } from '@/hooks/usePrayerSequence';
import { getPillOpacity, getPillRow } from '@/hooks/useSchedule';
import { canonicalDisplayOrder } from '@/shared/prayer';
import type { OverlayStore, ScheduleType } from '@/shared/types';

/** The rows of the list day on screen, and the next prayer's index among them (-1 when none is next) */
const findNextOnList = (prayers: PrayerWithStatus[], displayDate: string | null) => {
  const todayPrayers = prayers.filter((p) => p.belongsToDate === displayDate);
  const nextPrayerIndex = todayPrayers.findIndex((p) => p.isNext);
  return { todayPrayers, nextPrayerIndex };
};

/**
 * The drawn row the active pill slides to
 *
 * @param prayers The whole sequence with statuses (usePrayerSequence)
 * @param displayDate The list day on screen
 * @param type The page's schedule
 * @param heldRow The row the pill was on at the last commit (0 before the first)
 */
export const getActivePillRow = (
  prayers: PrayerWithStatus[],
  displayDate: string | null,
  type: ScheduleType,
  heldRow: number
): number => {
  const { todayPrayers, nextPrayerIndex } = findNextOnList(prayers, displayDate);
  const nextPrayerVisualRow = canonicalDisplayOrder(todayPrayers, type).indexOf(nextPrayerIndex);
  return getPillRow(nextPrayerVisualRow, heldRow);
};

/**
 * The opacity the active pill fades to
 *
 * @param prayers The whole sequence with statuses (usePrayerSequence)
 * @param displayDate The list day on screen
 * @param type The page's schedule
 * @param overlay The overlay's state
 */
export const getActivePillOpacity = (
  prayers: PrayerWithStatus[],
  displayDate: string | null,
  type: ScheduleType,
  overlay: OverlayStore
): number => {
  const { nextPrayerIndex } = findNextOnList(prayers, displayDate);

  // The pill fades out while the overlay is open on this page unless its row is the selected one, which keeps it
  const isHiddenByOverlay =
    overlay.isOn && overlay.scheduleType === type && overlay.selectedPrayerIndex !== nextPrayerIndex;

  return getPillOpacity(nextPrayerIndex, isHiddenByOverlay);
};
