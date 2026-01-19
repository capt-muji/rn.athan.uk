/**
 * Hook for accessing the next upcoming prayer from the sequence
 * Part of the new prayer-centric timing system
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { useAtomValue } from 'jotai';

import * as TimeUtils from '@/shared/time';
import { Prayer, ScheduleType } from '@/shared/types';
import { standardNextPrayerAtom, extraNextPrayerAtom } from '@/stores/schedule';

export interface UseNextPrayerResult {
  /** The next upcoming prayer, or null if sequence not initialized */
  prayer: Prayer | null;
  /** Seconds remaining until the prayer time */
  secondsRemaining: number;
  /** Always false for next prayer (by definition, it hasn't passed) */
  isPassed: false;
  /** Whether the sequence is initialized */
  isReady: boolean;
}

/**
 * Returns the next upcoming prayer and time remaining
 * Uses the sequence-based derived atoms for automatic updates
 *
 * @param type Schedule type (Standard or Extra)
 * @returns Object with prayer, secondsRemaining, isPassed (always false), and isReady
 *
 * @example
 * const { prayer, secondsRemaining, isReady } = useNextPrayer(ScheduleType.Standard);
 * if (isReady && prayer) {
 *   console.log(`Next: ${prayer.english} in ${secondsRemaining}s`);
 * }
 */
export const useNextPrayer = (type: ScheduleType): UseNextPrayerResult => {
  const nextPrayerAtom = type === ScheduleType.Standard ? standardNextPrayerAtom : extraNextPrayerAtom;
  const prayer = useAtomValue(nextPrayerAtom);

  // Calculate seconds remaining
  const now = TimeUtils.createLondonDate();
  const secondsRemaining = prayer ? TimeUtils.getSecondsBetween(now, prayer.datetime) : 0;

  return {
    prayer,
    secondsRemaining,
    isPassed: false, // Next prayer is by definition not passed
    isReady: prayer !== null,
  };
};
