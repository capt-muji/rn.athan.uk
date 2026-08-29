/**
 * Hook for countdown to next prayer
 * Part of the new prayer-centric timing system
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';

import logger from '@/shared/logger';
import * as TimeUtils from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { extraNextPrayerAtom, standardNextPrayerAtom } from '@/stores/schedule';

interface UseCountdownResult {
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
      return TimeUtils.getSecondsBetween(now, nextPrayer.datetime);
    };

    setTimeLeft(calculateTimeLeft());

    // Set up interval
    const intervalId = setInterval(() => {
      const wall = Date.now();
      const seconds = calculateTimeLeft();

      // Hold the last shown second while the sequence refresh advances to the next
      // prayer (floor-rounding reaches 0 up to a second before the true time, and the
      // refresh itself takes a tick) - prevents the UI from freezing at "0s".
      logger.info('TICK: hook', {
        which: type === ScheduleType.Standard ? 'std' : 'extra',
        wall,
        computed: seconds,
        phase: wall % 1000,
        held: seconds <= 0,
      });
      setTimeLeft((previous) => (seconds > 0 ? seconds : previous));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [nextPrayer]);

  return {
    timeLeft,
    prayerName: nextPrayer?.english ?? '',
    isReady: nextPrayer !== null,
  };
};
