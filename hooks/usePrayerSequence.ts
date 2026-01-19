/**
 * Hook for accessing the full prayer sequence
 * Part of the new prayer-centric timing system
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { useAtomValue } from 'jotai';

import * as TimeUtils from '@/shared/time';
import { Prayer, ScheduleType } from '@/shared/types';
import {
  standardSequenceAtom,
  extraSequenceAtom,
  standardDisplayDateAtom,
  extraDisplayDateAtom,
} from '@/stores/schedule';

/**
 * Prayer with derived status fields
 * Extends Prayer with isPassed and isNext computed from current time
 */
export interface PrayerWithStatus extends Prayer {
  /** Whether this prayer has passed (datetime < now) */
  isPassed: boolean;
  /** Whether this is the next upcoming prayer */
  isNext: boolean;
}

export interface UsePrayerSequenceResult {
  /** All prayers with derived isPassed and isNext status */
  prayers: PrayerWithStatus[];
  /** The display date (belongsToDate of next prayer) */
  displayDate: string | null;
  /** Index of the next prayer in the prayers array (-1 if all passed) */
  nextPrayerIndex: number;
  /** Whether the sequence is initialized */
  isReady: boolean;
}

/**
 * Returns the full prayer sequence for rendering prayer lists
 * Uses sequence atoms for automatic updates when prayers change
 * Each prayer includes derived isPassed and isNext fields
 *
 * @param type Schedule type (Standard or Extra)
 * @returns Object with prayers array (with status), displayDate, nextPrayerIndex, and isReady
 *
 * @example
 * const { prayers, displayDate, isReady } = usePrayerSequence(ScheduleType.Standard);
 * if (isReady) {
 *   prayers.forEach((prayer) => {
 *     // isPassed and isNext are derived from datetime comparison
 *     logger.debug({ prayer: prayer.english, isPassed: prayer.isPassed, isNext: prayer.isNext }, 'Prayer sequence state');
 *   });
 * }
 */

export const usePrayerSequence = (type: ScheduleType): UsePrayerSequenceResult => {
  const sequenceAtom = type === ScheduleType.Standard ? standardSequenceAtom : extraSequenceAtom;
  const displayDateAtom = type === ScheduleType.Standard ? standardDisplayDateAtom : extraDisplayDateAtom;

  const sequence = useAtomValue(sequenceAtom);
  const displayDate = useAtomValue(displayDateAtom);

  // Calculate from current time
  const now = TimeUtils.createLondonDate();
  const rawPrayers = sequence?.prayers ?? [];
  const nextPrayerIndex = rawPrayers.findIndex((p) => p.datetime > now);

  // Add derived isPassed and isNext to each prayer
  // isPassed = datetime < now (simple comparison, no date string needed)
  const prayers: PrayerWithStatus[] = rawPrayers.map((prayer, index) => ({
    ...prayer,
    isPassed: prayer.datetime < now,
    isNext: index === nextPrayerIndex,
  }));

  return {
    prayers,
    displayDate,
    nextPrayerIndex: nextPrayerIndex >= 0 ? nextPrayerIndex : -1,
    isReady: sequence !== null,
  };
};
