import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import Store from '@/stores/store';
import { DaySelection } from '@/shared/types';
import { getTimeDifference, getTodayOrTomorrowDate, formatTime } from '@/shared/time';
import { PRAYERS_ENGLISH } from '@/shared/constants';
import PrayerHook from '@/hooks/usePrayer';

const THRESHOLD = 1000; // seconds

export const usePrayerCountdown = (prayerIndex: number, day: DaySelection) => {
  const [countdown, setCountdown] = useState('');
  const [todaysPrayers] = useAtom(Store.schedule.standard.today);
  const [tomorrowsPrayers] = useAtom(Store.schedule.standard.tomorrow);
  const [date, setDate] = useAtom(Store.app.date);
  const [nextPrayerIndex] = useAtom(Store.schedule.standard.nextIndex);
  // const { incrementNextPrayer, markPrayerAsPassed } = PrayerHook();

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
        // markPrayerAsPassed(prayerIndex);
        // incrementNextPrayer();
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