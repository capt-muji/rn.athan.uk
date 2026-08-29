/**
 * Hook for countdown bar calculation
 * Part of the new prayer-centric timing system
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { useAtomValue } from 'jotai';

import { ScheduleType } from '@/shared/types';
import {
  extraNextPrayerAtom,
  extraPrevPrayerAtom,
  standardNextPrayerAtom,
  standardPrevPrayerAtom,
} from '@/stores/schedule';

interface UseCountdownBarResult {
  /** Progress percentage (0-100) */
  progress: number;
  /** Whether the countdown bar is ready to display */
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
 * const { progress, isReady } = useCountdownBar(ScheduleType.Standard);
 * if (isReady) {
 *   // Render countdown bar at {progress}%
 * }
 */
export const useCountdownBar = (type: ScheduleType): UseCountdownBarResult => {
  const nextPrayerAtom = type === ScheduleType.Standard ? standardNextPrayerAtom : extraNextPrayerAtom;
  const prevPrayerAtom = type === ScheduleType.Standard ? standardPrevPrayerAtom : extraPrevPrayerAtom;

  const nextPrayer = useAtomValue(nextPrayerAtom);
  const prevPrayer = useAtomValue(prevPrayerAtom);

  // Cannot calculate progress without both prayers
  if (!nextPrayer || !prevPrayer) {
    return { progress: 0, isReady: false };
  }

  // True UTC instants on both sides (prayer datetimes + Date.now): the offset
  // cancels in the ratio, no timezone conversion needed
  const nowMs = Date.now();

  // Calculate progress: (elapsed / total) * 100
  const totalMs = nextPrayer.datetime.getTime() - prevPrayer.datetime.getTime();
  const elapsedMs = nowMs - prevPrayer.datetime.getTime();

  // Clamp to 0-100 range
  const progress = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));

  return {
    progress,
    isReady: true,
  };
};
