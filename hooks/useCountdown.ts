import { useState, useEffect } from 'react';
import { DaySelection, ScheduleType } from '@/shared/types';
import { getTimeDifference, getRecentDate, formatTime } from '@/shared/time';
import useSchedule from '@/hooks/useSchedule';

export const useCountdown = (type: ScheduleType) => {
  const { today, tomorrow, nextIndex } = useSchedule(type);
  
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const updateCountdown = () => {

      const prayer = today()[nextIndex];

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