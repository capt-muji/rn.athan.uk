import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { getCurrentPrayerInfo } from '@/utils/time';
import { 
  todaysPrayersAtom, 
  nextPrayerIndexAtom, 
  selectedPrayerDateAtom,
  tomorrowsPrayersAtom 
} from '@/store/store';

export const useTimer = () => {
  const [timerName, setTimerName] = useState('');
  const [timeDisplay, setTimeDisplay] = useState('');
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [tomorrowsPrayers] = useAtom(tomorrowsPrayersAtom);
  const [nextPrayerIndex, setNextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [selectedDate] = useAtom(selectedPrayerDateAtom);

  useEffect(() => {
    const prayers = selectedDate === 'tomorrow' ? tomorrowsPrayers : todaysPrayers;
    if (!prayers || Object.keys(prayers).length === 0) return;

    const updateTimer = () => {
      const { timerName, timeDisplay, timeDifference, currentPrayer } = getCurrentPrayerInfo(
        prayers,
        nextPrayerIndex,
        selectedDate
      );

      setTimerName(timerName);
      setTimeDisplay(timeDisplay);

      if (timeDifference <= 0 && currentPrayer) {
        if (prayers[nextPrayerIndex]) {
          prayers[nextPrayerIndex].passed = true;
        }
        setNextPrayerIndex(nextPrayerIndex === 6 ? -1 : nextPrayerIndex + 1);
      }
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [nextPrayerIndex, todaysPrayers, tomorrowsPrayers, selectedDate]);

  return { timerName, timeDisplay };
};
