import { useState, useEffect } from 'react';
import { DaySelection, ScheduleType } from '@/shared/types';
import { getTimeDifference, getRecentDate, formatTime } from '@/shared/time';
import useSchedule from '@/hooks/useSchedule';
import { useAtomValue } from 'jotai';
import { extraScheduleAtom, standardScheduleAtom } from '@/stores/store_jotai';

export const useCountdown = (type: ScheduleType) => {
  const atom = type === ScheduleType.Standard ? standardScheduleAtom : extraScheduleAtom;
  const { today, tomorrow, nextIndex } = useAtomValue(atom);

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