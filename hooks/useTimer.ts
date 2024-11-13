import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { getCurrentPrayerInfo } from '@/utils/time';
import { 
  todaysPrayersAtom, 
  nextPrayerIndexAtom, 
  tomorrowsPrayersAtom,
  selectedPrayerIndexAtom,
  overlayVisibleAtom,
} from '@/store/store';

const THRESHOLD = 1000; // 1 second threshold

export const useTimer = () => {
  const [nextPrayerName, setNextPrayerName] = useState('');
  const [nextPrayerTime, setNextPrayerTime] = useState('');
  
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [tomorrowsPrayers] = useAtom(tomorrowsPrayersAtom);
  const [nextPrayerIndex, setNextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [selectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [overlayVisible] = useAtom(overlayVisibleAtom);

  useEffect(() => {
    if (!todaysPrayers || Object.keys(todaysPrayers).length === 0) return;

    const updateTimer = () => {
      const prayers = overlayVisible && todaysPrayers[selectedPrayerIndex!]?.passed ? 
        tomorrowsPrayers : todaysPrayers;
      const date = overlayVisible && todaysPrayers[selectedPrayerIndex!]?.passed ? 
        'tomorrow' : 'today';

      const prayerInfo = getCurrentPrayerInfo(
        prayers,
        nextPrayerIndex,
        date,
        overlayVisible ? selectedPrayerIndex : undefined
      );

      setNextPrayerName(prayerInfo.timerName);
      setNextPrayerTime(prayerInfo.timeDisplay);

      if (!overlayVisible && prayerInfo.timeDifference <= THRESHOLD && prayerInfo.currentPrayer) {
        if (todaysPrayers[nextPrayerIndex]) {
          todaysPrayers[nextPrayerIndex].passed = true;
        }
        setNextPrayerIndex(nextPrayerIndex === 6 ? -1 : nextPrayerIndex + 1);
      }
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [nextPrayerIndex, todaysPrayers, tomorrowsPrayers, selectedPrayerIndex, overlayVisible, overlayVisible]);

  return {
    nextPrayer: { timerName: nextPrayerName, timeDisplay: nextPrayerTime }
  };
};
