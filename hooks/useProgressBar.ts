/**
 * Hook for progress bar calculation
 * Part of the new prayer-centric timing system
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { useAtomValue } from 'jotai';

import * as TimeUtils from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import {
  standardNextPrayerAtom,
  extraNextPrayerAtom,
  standardPrevPrayerAtom,
  extraPrevPrayerAtom,
} from '@/stores/schedule';

export interface UseProgressBarResult {
  /** Progress percentage (0-100) */
  progress: number;
  /** Whether the progress bar is ready to display */
  isReady: boolean;
}

/**
 * Returns progress percentage between previous and next prayer
 * Simple calculation: (now - prev.datetime) / (next.datetime - prev.datetime) * 100
 * No special "first prayer" or "yesterday" logic needed with the new model
 *
 * @param type Schedule type (Standard or Extra)
 * @returns Object with progress (0-100) and isReady
 *
 * @example
 * const { progress, isReady } = useProgressBar(ScheduleType.Standard);
 * if (isReady) {
 *   // Render progress bar at {progress}%
 * }
 */
export const useProgressBar = (type: ScheduleType): UseProgressBarResult => {
  const nextPrayerAtom = type === ScheduleType.Standard ? standardNextPrayerAtom : extraNextPrayerAtom;
  const prevPrayerAtom = type === ScheduleType.Standard ? standardPrevPrayerAtom : extraPrevPrayerAtom;

  const nextPrayer = useAtomValue(nextPrayerAtom);
  const prevPrayer = useAtomValue(prevPrayerAtom);

  // Cannot calculate progress without both prayers
  if (!nextPrayer || !prevPrayer) {
    return { progress: 0, isReady: false };
  }

  const now = TimeUtils.createLondonDate();

  // Calculate progress: (elapsed / total) * 100
  const totalMs = nextPrayer.datetime.getTime() - prevPrayer.datetime.getTime();
  const elapsedMs = now.getTime() - prevPrayer.datetime.getTime();

  // Clamp to 0-100 range
  const progress = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));

  return {
    progress,
    isReady: true,
  };
};
