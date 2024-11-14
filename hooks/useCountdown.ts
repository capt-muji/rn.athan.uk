import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { todaysPrayersAtom, tomorrowsPrayersAtom, nextPrayerIndexAtom } from '@/store/store';
import { DaySelection } from '@/types/prayers';
import { getTimeDifference, getTodayOrTomorrow, formatTime } from '@/utils/time';

const THRESHOLD = 1000; // 1 second threshold

export const usePrayerCountdown = (prayerIndex: number, day: DaySelection) => {
  const [countdown, setCountdown] = useState('');
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [tomorrowsPrayers] = useAtom(tomorrowsPrayersAtom);
  const [nextPrayerIndex, setNextPrayerIndex] = useAtom(nextPrayerIndexAtom);

  useEffect(() => {
    const updateCountdown = () => {
      if (prayerIndex === -1) {
        setCountdown('');
        return;
      }

      const prayers = day === 'today' ? todaysPrayers : tomorrowsPrayers;
      const prayer = prayers[prayerIndex];

      const diff = getTimeDifference(prayer.time, getTodayOrTomorrow(day));
      
      if (diff <= THRESHOLD && day === 'today') {
        prayer.passed = true;
        setNextPrayerIndex(nextPrayerIndex === 6 ? -1 : nextPrayerIndex + 1);
        return;
      }

      setCountdown(formatTime(diff));
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    return () => clearInterval(intervalId);
  }, [prayerIndex, day, todaysPrayers, tomorrowsPrayers, nextPrayerIndex]);

  return countdown;
};