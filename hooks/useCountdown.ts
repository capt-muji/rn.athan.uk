/**
 * @file Hook for countdown to next prayer
 * Part of the new prayer-centric timing system
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { useAtomValue } from 'jotai';

import { ScheduleType } from '@/shared/types';
import { getCountdownDisplayAtom, getCountdownNameAtom } from '@/stores/countdown';
import { extraNextPrayerAtom, standardNextPrayerAtom } from '@/stores/schedule';

interface UseCountdownResult {
  /** Formatted countdown label (render-granular: changes only when the displayed string changes) */
  displayTime: string;
  /** Name of the next prayer */
  prayerName: string;
  /** Whether the countdown is ready (sequence initialized) */
  isReady: boolean;
}

/**
 * Returns a live countdown to the next prayer
 *
 * Subscribes to render-granular selectors over the store countdown atom, which
 * the store-level wall-clock ticker (stores/countdown.ts startSequenceCountdown)
 * updates every wall-clock second with the same ceil-rounded values on the same
 * :000-aligned cadence — a second hook-owned timer chain per mounted Countdown
 * used to duplicate that work 3× (std page, extra page, overlay) as pure idle
 * burn (#4), and the raw atom's per-second object identity re-rendered all of
 * them even when the displayed string was unchanged (#10). The display string
 * changes per second only when seconds render (user preference, or the final
 * 10 minutes) and per minute otherwise.
 *
 * @param type Schedule type (Standard or Extra)
 * @returns Object with displayTime (formatted string), prayerName, and isReady
 *
 * @example
 * const { displayTime, prayerName, isReady } = useCountdown(ScheduleType.Standard);
 */
export const useCountdown = (type: ScheduleType): UseCountdownResult => {
  const nextPrayerAtom = type === ScheduleType.Standard ? standardNextPrayerAtom : extraNextPrayerAtom;
  const nextPrayer = useAtomValue(nextPrayerAtom);
  const prayerName = useAtomValue(getCountdownNameAtom(type));
  const displayTime = useAtomValue(getCountdownDisplayAtom(type));

  return {
    displayTime,
    prayerName,
    isReady: nextPrayer !== null,
  };
};
