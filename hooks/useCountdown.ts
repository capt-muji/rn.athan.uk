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
 * Updates every wall-clock second, flipping just after :000
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
  const which = type === ScheduleType.Standard ? 'std' : 'extra';
  const nextPrayer = useAtomValue(nextPrayerAtom);

  // State for countdown (updated every second; ceil rounding, never 0s)
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!nextPrayer) return 0;
    return TimeUtils.getSecondsRemaining(nextPrayer.datetime);
  });

  // Update countdown every wall-clock second
  useEffect(() => {
    if (!nextPrayer) return;

    // Initial calculation
    setTimeLeft(TimeUtils.getSecondsRemaining(nextPrayer.datetime));

    // Wall-second-aligned ticks: each next tick is scheduled against the next
    // :000 boundary, so JS-thread delivery latency self-corrects instead of
    // compounding (a plain 1s interval measured +17ms/s of phase drift) and
    // digits flip with the system clock. Each tick recomputes from the clock —
    // countdown targets are true UTC instants, so the diff needs no timezone
    // conversion (the offset cancels).
    const tick = () => {
      const wall = Date.now();
      const seconds = TimeUtils.getSecondsRemaining(nextPrayer.datetime);

      // seconds clamps at 1: while the sequence refresh advances to the next
      // prayer, the display holds the last digit ("1s") instead of "0s"
      logger.info('TICK: hook', {
        which,
        wall,
        computed: seconds,
        phase: wall % 1000,
        held: wall >= nextPrayer.datetime.getTime(),
      });
      setTimeLeft(seconds);
    };

    let timeoutId: ReturnType<typeof setTimeout>;
    const loop = () => {
      tick();
      timeoutId = setTimeout(loop, TimeUtils.getWallSecondDelay());
    };

    timeoutId = setTimeout(loop, TimeUtils.getWallSecondDelay());

    return () => clearTimeout(timeoutId);
  }, [nextPrayer, which]);

  return {
    timeLeft,
    prayerName: nextPrayer?.english ?? '',
    isReady: nextPrayer !== null,
  };
};
