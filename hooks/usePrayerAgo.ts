import { getDefaultStore } from 'jotai/vanilla';
import { useCallback, useEffect, useState } from 'react';

import { createInstant, formatTimeAgo } from '@/shared/time';
import type { ScheduleType } from '@/shared/types';
import { getCountdownAtom } from '@/stores/countdown';
import { getPrevPrayer } from '@/stores/schedule';

interface PrayerAgoState {
  prayerAgo: string;
  minutesElapsed: number;
  isReady: boolean;
}

/**
 * Pure function to calculate prayer-ago state
 *
 * Exported so tests can call the real thing. There is no renderer in the
 * dependency tree, so a test that cannot reach this function has to
 * re-implement it — which is what the previous test did, leaving the hook
 * itself with no coverage at all.
 */
export const calculatePrayerAgo = (type: ScheduleType): PrayerAgoState => {
  try {
    const prevPrayer = getPrevPrayer(type);
    if (!prevPrayer) {
      return { prayerAgo: '', minutesElapsed: 0, isReady: false };
    }

    const now = createInstant();
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
    // Ride the shared wall-clock tick rather than owning a second one. The
    // countdown store already writes its atom once per wall second (ADR-013's
    // tick consolidation: exactly two timers app-wide), and this badge mounts
    // once per page, so an interval here added one more timer per page for the
    // same cadence. store.sub does NOT subscribe React — deliberately, since
    // useAtomValue would re-render every second — so the bail-out above stays
    // the only thing that decides whether anything re-renders. No initial call
    // needed: the lazy initializer already calculated.
    return getDefaultStore().sub(getCountdownAtom(type), updatePrayerAgo);
  }, [updatePrayerAgo, type]);

  return state;
};
