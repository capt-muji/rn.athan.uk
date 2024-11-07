import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { getCurrentPrayerInfo } from '@/utils/time';
import { 
  todaysPrayersAtom, 
  nextPrayerIndexAtom, 
  tomorrowsPrayersAtom,
} from '@/store/store';

const THRESHOLD = 1000; // 1 second threshold

export const useTimer = () => {
  const [nextPrayerName, setNextPrayerName] = useState('');
  const [nextPrayerTime, setNextPrayerTime] = useState('');
  
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [tomorrowsPrayers] = useAtom(tomorrowsPrayersAtom);
  const [nextPrayerIndex, setNextPrayerIndex] = useAtom(nextPrayerIndexAtom);

  useEffect(() => {
    if (!todaysPrayers || Object.keys(todaysPrayers).length === 0) return;

    const updateTimer = () => {
      const nextPrayerInfo = getCurrentPrayerInfo(
        todaysPrayers,
        nextPrayerIndex,
        'today'
      );

      setNextPrayerName(nextPrayerInfo.timerName);
      setNextPrayerTime(nextPrayerInfo.timeDisplay);

      if (nextPrayerInfo.timeDifference <= THRESHOLD && nextPrayerInfo.currentPrayer) {
        if (todaysPrayers[nextPrayerIndex]) {
          todaysPrayers[nextPrayerIndex].passed = true;
        }
        setNextPrayerIndex(nextPrayerIndex === 6 ? -1 : nextPrayerIndex + 1);
      }
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [nextPrayerIndex, todaysPrayers, tomorrowsPrayers]);

  return {
    nextPrayer: { timerName: nextPrayerName, timeDisplay: nextPrayerTime }
  };
};
