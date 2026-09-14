/**
 * @file Hook for countdown to next prayer
 * Part of the new prayer-centric timing system
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { useAtomValue } from 'jotai';

import { ScheduleType } from '@/shared/types';
import { getCountdownDisplayAtom, getCountdownNameAtom } from '@/stores/countdown';
import { extraDisplayDateAtom, standardDisplayDateAtom } from '@/stores/schedule';

interface UseCountdownResult {
  /** Formatted countdown label (render-granular: changes only when the displayed string changes) */
  displayTime: string;
  /** Name of the next prayer */
  prayerName: string;
  /** Whether a list is on screen, so the countdown has something to show: a time, or --:-- */
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
  // Ready once a list is on screen, not only while a readable prayer is ahead. After the last readable prayer in
  // storage (31 December before next year is published) the countdown shows --:-- under the next row's name, and
  // Countdown.tsx rendering nothing instead pulled the date and the whole list up the page
  const displayDateAtom = type === ScheduleType.Standard ? standardDisplayDateAtom : extraDisplayDateAtom;
  const displayDate = useAtomValue(displayDateAtom);
  const prayerName = useAtomValue(getCountdownNameAtom(type));
  const displayTime = useAtomValue(getCountdownDisplayAtom(type));

  return {
    displayTime,
    prayerName,
    isReady: displayDate !== null,
  };
};
