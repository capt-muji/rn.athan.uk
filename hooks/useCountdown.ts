/**
 * Hook for countdown to next prayer
 * Part of the new prayer-centric timing system
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';

import * as TimeUtils from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { standardNextPrayerAtom, extraNextPrayerAtom } from '@/stores/schedule';

export interface UseCountdownResult {
  /** Seconds remaining until the next prayer */
  timeLeft: number;
  /** Name of the next prayer */
  prayerName: string;
  /** Whether the countdown is ready (sequence initialized) */
  isReady: boolean;
}

/**
 * Returns a live countdown to the next prayer
 * Updates every second via internal interval
 *
 * @param type Schedule type (Standard or Extra)
 * @returns Object with timeLeft (seconds), prayerName, and isReady
 *
 * @example
 * const { timeLeft, prayerName, isReady } = useCountdown(ScheduleType.Standard);
 * if (isReady) {
 *   logger.info({ prayerName, timeLeft: TimeUtils.formatTime(timeLeft) }, 'Countdown');
 * }
 */

export const useCountdown = (type: ScheduleType): UseCountdownResult => {
  const nextPrayerAtom = type === ScheduleType.Standard ? standardNextPrayerAtom : extraNextPrayerAtom;
  const nextPrayer = useAtomValue(nextPrayerAtom);

  // State for countdown (updated every second)
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!nextPrayer) return 0;
    return TimeUtils.getSecondsBetween(TimeUtils.createLondonDate(), nextPrayer.datetime);
  });

  // Update countdown every second
  useEffect(() => {
    if (!nextPrayer) return;

    // Initial calculation
    const calculateTimeLeft = () => {
      const now = TimeUtils.createLondonDate();
      return Math.max(0, TimeUtils.getSecondsBetween(now, nextPrayer.datetime));
    };

    setTimeLeft(calculateTimeLeft());

    // Set up interval
    const intervalId = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [nextPrayer]);

  return {
    timeLeft,
    prayerName: nextPrayer?.english ?? '',
    isReady: nextPrayer !== null,
  };
};
