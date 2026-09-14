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

export interface ActivePill {
  /** The drawn row the pill slides to */
  row: number;
  /** The opacity it fades to */
  opacity: number;
}

/**
 * The active pill for a schedule's page
 *
 * @param prayers The whole sequence with statuses (usePrayerSequence)
 * @param displayDate The list day on screen
 * @param type The page's schedule
 * @param overlay The overlay's state
 * @param heldRow The row the pill was on at the last commit (0 before the first)
 */
export const placeActivePill = (
  prayers: PrayerWithStatus[],
  displayDate: string | null,
  type: ScheduleType,
  overlay: OverlayStore,
  heldRow: number
): ActivePill => {
  const todayPrayers = prayers.filter((p) => p.belongsToDate === displayDate);
  const nextPrayerIndex = todayPrayers.findIndex((p) => p.isNext);
  const nextPrayerVisualRow = canonicalDisplayOrder(todayPrayers, type).indexOf(nextPrayerIndex);

  // The pill fades out while the overlay is open on this page unless its row is the selected one, which keeps it
  const isHiddenByOverlay =
    overlay.isOn && overlay.scheduleType === type && overlay.selectedPrayerIndex !== nextPrayerIndex;

  return {
    row: getPillRow(nextPrayerVisualRow, heldRow),
    opacity: getPillOpacity(nextPrayerIndex, isHiddenByOverlay),
  };
};
