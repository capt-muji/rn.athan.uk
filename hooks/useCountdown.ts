import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import Store from '@/stores/store';
import { DaySelection, PrayerType } from '@/shared/types';
import { getTimeDifference, getRecentDate, formatTime } from '@/shared/time';
import { PRAYERS_ENGLISH } from '@/shared/constants';
import useSchedule from '@/hooks/useSchedule';

const THRESHOLD = 1000; // seconds

export const useCountdown = (type: PrayerType) => {
  const { today, tomorrow, nextIndex } = useSchedule('standard');
  
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const updateCountdown = () => {

      const prayer = today[nextIndex];

      const diff = getTimeDifference(prayer.time, getRecentDate(DaySelection.Today));

      setCountdown(formatTime(diff));
    };

    // Update countdown every second
    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    return () => clearInterval(intervalId);
  }, [today, tomorrow, nextIndex]);

  return countdown;
};