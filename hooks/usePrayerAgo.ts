import { useCallback, useEffect, useState } from 'react';

import { createLondonDate, formatTimeAgo } from '@/shared/time';
import type { ScheduleType } from '@/shared/types';
import { getPrevPrayer } from '@/stores/schedule';

interface PrayerAgoState {
  prayerAgo: string;
  minutesElapsed: number;
  isReady: boolean;
}

/**
 * Pure function to calculate prayer-ago state
 * Extracted outside hook for use in lazy initializer
 */
const calculatePrayerAgo = (type: ScheduleType): PrayerAgoState => {
  try {
    const prevPrayer = getPrevPrayer(type);
    if (!prevPrayer) {
      return { prayerAgo: '', minutesElapsed: 0, isReady: false };
    }

    const now = createLondonDate();
    const secondsElapsed = Math.floor((now.getTime() - prevPrayer.datetime.getTime()) / 1000);
    const minutes = Math.floor(secondsElapsed / 60);
    const timeAgo = formatTimeAgo(secondsElapsed);

    const agoText = secondsElapsed < 60 ? `${prevPrayer.english} now` : `${prevPrayer.english} ${timeAgo} ago`;

    return { prayerAgo: agoText, minutesElapsed: minutes, isReady: true };
  } catch {
    return { prayerAgo: '', minutesElapsed: 0, isReady: false };
  }
};

/**
 * Returns formatted prayer-ago text showing how long ago the previous prayer was
 *
 * @param type - Schedule type (Standard or Extra)
 * @returns Object with:
 *   - prayerAgo: Formatted string (e.g., "Fajr now", "Dhuhr 10h 15m ago")
 *   - minutesElapsed: Minutes since previous prayer (for styling)
 *   - isReady: Whether prayer data is loaded
 *
 * @example
 * const { prayerAgo, minutesElapsed, isReady } = usePrayerAgo(ScheduleType.Standard);
 * // prayerAgo: "Fajr now" (if <60s since Fajr)
 * // prayerAgo: "Asr 2h 30m ago" (if 2.5h since Asr)
 * // minutesElapsed: 150 (if 2.5h since Asr)
 */
export const usePrayerAgo = (type: ScheduleType): PrayerAgoState => {
  // Single object state with lazy initializer - calculates synchronously on mount
  const [state, setState] = useState(() => calculatePrayerAgo(type));

  const updatePrayerAgo = useCallback(() => {
    setState((prev) => {
      const next = calculatePrayerAgo(type);
      // The ago text changes once per minute (or once per second only inside
      // the first-minute "now" window) — re-rendering the page every second
      // for an identical string is pure idle burn, so bail out on no-change
      const unchanged =
        next.prayerAgo === prev.prayerAgo &&
        next.minutesElapsed === prev.minutesElapsed &&
        next.isReady === prev.isReady;
      return unchanged ? prev : next;
    });
  }, [type]);

  useEffect(() => {
    // No initial call needed - lazy initializer already calculated
    const interval = setInterval(updatePrayerAgo, 1000);
    return () => clearInterval(interval);
  }, [updatePrayerAgo]);

  return state;
};
