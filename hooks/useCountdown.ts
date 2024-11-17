import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { todaysPrayersAtom, tomorrowsPrayersAtom, nextPrayerIndexAtom, dateAtom } from '@/stores/state';
import { DaySelection } from '@/shared/types';
import { getTimeDifference, getTodayOrTomorrowDate, formatTime } from '@/shared/time';
import { PRAYERS_ENGLISH } from '@/shared/constants';
import { usePrayerState } from './usePrayer';

const THRESHOLD = 1000; // seconds

export const usePrayerCountdown = (prayerIndex: number, day: DaySelection) => {
  const [countdown, setCountdown] = useState('');
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [tomorrowsPrayers] = useAtom(tomorrowsPrayersAtom);
  const [date, setDate] = useAtom(dateAtom);
  const [nextPrayerIndex, setNextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const { incrementNextPrayer, markPrayerAsPassed } = usePrayerState();

  useEffect(() => {
    const updateCountdown = () => {
      const prayers = day === 'today' ? todaysPrayers : tomorrowsPrayers;
      const prayer = prayers[prayerIndex];
      const nowDate = getTodayOrTomorrowDate('today');
      const lastPrayerIndex = PRAYERS_ENGLISH.length - 1;

      // Check if date has changed and last prayer has passed
      if (date !== nowDate && todaysPrayers[lastPrayerIndex]?.passed) {
        setDate(nowDate);
      }

      const diff = getTimeDifference(prayer.time, getTodayOrTomorrowDate(day));
      
      // Check if prayer has passed
      if (diff <= THRESHOLD && day === 'today') {
        markPrayerAsPassed(prayerIndex);
        incrementNextPrayer();
        return;
      }

      setCountdown(formatTime(diff));
    };

    // Update countdown every second
    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    return () => clearInterval(intervalId);
  }, [prayerIndex, day, todaysPrayers, tomorrowsPrayers, nextPrayerIndex, date]);

  return countdown;
};