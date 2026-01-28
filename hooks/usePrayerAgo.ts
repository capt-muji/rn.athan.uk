import { useState, useEffect, useCallback } from 'react';

import { formatTimeAgo } from '@/shared/time';
import { createLondonDate } from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { getPrevPrayer } from '@/stores/schedule';

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
export const usePrayerAgo = (type: ScheduleType): { prayerAgo: string; minutesElapsed: number; isReady: boolean } => {
  const [prayerAgo, setPrayerAgo] = useState<string>('');
  const [minutesElapsed, setMinutesElapsed] = useState<number>(0);
  const [isReady, setIsReady] = useState(false);

  const updatePrayerAgo = useCallback(() => {
    try {
      const prevPrayer = getPrevPrayer(type);
      if (!prevPrayer) {
        setIsReady(false);
        return;
      }

      const now = createLondonDate();
      const secondsElapsed = Math.floor((now.getTime() - prevPrayer.datetime.getTime()) / 1000);
      const minutes = Math.floor(secondsElapsed / 60);
      const timeAgo = formatTimeAgo(secondsElapsed);

      const agoText = secondsElapsed < 60 ? `${prevPrayer.english} now` : `${prevPrayer.english} ${timeAgo} ago`;

      setPrayerAgo(agoText);
      setMinutesElapsed(minutes);
      setIsReady(true);
    } catch {
      setIsReady(false);
    }
  }, [type]);

  useEffect(() => {
    updatePrayerAgo();

    const interval = setInterval(updatePrayerAgo, 1000);
    return () => clearInterval(interval);
  }, [updatePrayerAgo]);

  return { prayerAgo, minutesElapsed, isReady };
};
