/**
 * Hook for countdown bar calculation
 * Part of the new prayer-centric timing system
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { useAtomValue } from 'jotai';

import { ScheduleType } from '@/shared/types';
import { getBarProgressAtom, getBarWarningAtom } from '@/stores/countdown';
import { extraNextPrayerAtom, standardNextPrayerAtom } from '@/stores/schedule';

interface UseCountdownBarResult {
  /** Elapsed progress percentage (0-100), quantized to bar-pixel steps (#10) */
  progress: number;
  /** Whether the countdown bar is ready to display */
  isReady: boolean;
  /** Whether remaining time is within the warning threshold (exact, flips at second resolution) */
  isWarning: boolean;
}

/**
 * Returns progress percentage between previous and next prayer
 * Simple calculation: (now - prev.datetime) / (next.datetime - prev.datetime) * 100
 * No special "first prayer" or "yesterday" logic needed with the new model
 *
 * Render-granular (#10): progress is quantized to bar-pixel steps (the bar's
 * visible resolution — per-second creep is sub-pixel) and the warning flip is
 * an exact boolean, so the subscriber re-renders ~once per pixel-step or
 * threshold crossing instead of every second. The underlying derived atoms
 * still recompute each store tick for boundary correctness.
 *
 * @param type Schedule type (Standard or Extra)
 * @returns Object with progress, isReady, and isWarning
 *
 * @example
 * const { progress, isReady, isWarning } = useCountdownBar(ScheduleType.Standard);
 * if (isReady) {
 *   // Render countdown bar at {100 - progress}% remaining
 * }
 */
export const useCountdownBar = (type: ScheduleType): UseCountdownBarResult => {
  const nextPrayerAtom = type === ScheduleType.Standard ? standardNextPrayerAtom : extraNextPrayerAtom;

  const nextPrayer = useAtomValue(nextPrayerAtom);
  const progress = useAtomValue(getBarProgressAtom(type));
  const isWarning = useAtomValue(getBarWarningAtom(type));

  return {
    progress,
    isReady: nextPrayer !== null,
    isWarning,
  };
};
