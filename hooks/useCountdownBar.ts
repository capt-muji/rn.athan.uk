/**
 * Hook for countdown bar calculation
 * Part of the new prayer-centric timing system
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { useAtomValue } from 'jotai';

import { ScheduleType } from '@/shared/types';
import { getBarAvailableAtom, getBarProgressAtom, getBarWarningAtom } from '@/stores/countdown';
import { extraNextPrayerAtom, standardNextPrayerAtom } from '@/stores/schedule';

interface UseCountdownBarResult {
  /** Elapsed progress percentage (0-100), recomputed every wall-clock second */
  progress: number;
  /** Whether the countdown bar is ready to display */
  isReady: boolean;
  /** Whether remaining time is within the warning threshold (exact, flips at second resolution) */
  isWarning: boolean;
  /** Whether the bar can be worked out: a readable row before next, and next itself (R14) */
  isAvailable: boolean;
}

/**
 * Opacity the bar heads for
 *
 * A preview always shows. Otherwise the bar hides under the overlay, and while it cannot be worked out,
 * where a bar would measure from a time nobody could read (R14). Opacity alone, so its space is kept and
 * nothing below it moves.
 */
export const getBarOpacity = (isPreviewMode: boolean, overlayIsOn: boolean, isAvailable: boolean): number =>
  isPreviewMode || (!overlayIsOn && isAvailable) ? 1 : 0;

/**
 * Returns progress percentage between previous and next prayer
 * Simple calculation: (now - prev.datetime) / (next.datetime - prev.datetime) * 100
 * No special "first prayer" or "yesterday" logic needed with the new model
 *
 * Raw per-second resolution: the bar re-issues its width animation on every
 * change, so no dropped or stale animation can survive longer than one tick
 * (a suspended host can drop the resume write; the next tick replaces it).
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
  const isAvailable = useAtomValue(getBarAvailableAtom(type));

  return {
    progress,
    isReady: nextPrayer !== null,
    isWarning,
    isAvailable,
  };
};
