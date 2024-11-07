import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { getCurrentPrayerInfo } from '@/utils/time';
import { 
  todaysPrayersAtom, 
  nextPrayerIndexAtom, 
  selectedPrayerDateAtom,
  tomorrowsPrayersAtom,
  selectedPrayerIndexAtom,
  overlayAtom
} from '@/store/store';

export const useTimer = () => {
  const [timerName, setTimerName] = useState('');
  const [timeDisplay, setTimeDisplay] = useState('');
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [tomorrowsPrayers] = useAtom(tomorrowsPrayersAtom);
  const [nextPrayerIndex, setNextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [selectedDate] = useAtom(selectedPrayerDateAtom);
  const [selectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [isOverlay, setIsOverlay] = useAtom(overlayAtom);

  useEffect(() => {
    const displayPrayers = selectedDate === 'tomorrow' ? tomorrowsPrayers : todaysPrayers;
    if (!displayPrayers || Object.keys(displayPrayers).length === 0) return;

    const updateTimer = () => {
      // Always track next prayer from today's prayers
      const nextPrayerInfo = getCurrentPrayerInfo(
        todaysPrayers,
        nextPrayerIndex,
        'today',
        null
      );

      // Get display info based on selected prayer/date
      const displayInfo = getCurrentPrayerInfo(
        displayPrayers,
        nextPrayerIndex,
        selectedDate,
        isOverlay ? selectedPrayerIndex : null
      );

      setTimerName(displayInfo.timerName);
      setTimeDisplay(displayInfo.timeDisplay);

      // If next prayer's timer completes, disable overlay first
      if (nextPrayerInfo.timeDifference <= 0 && nextPrayerInfo.currentPrayer) {
        // Always disable overlay first
        setIsOverlay(false);

        // Then update prayer status
        if (todaysPrayers[nextPrayerIndex]) {
          todaysPrayers[nextPrayerIndex].passed = true;
        }
        setNextPrayerIndex(nextPrayerIndex === 6 ? -1 : nextPrayerIndex + 1);
      }
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [nextPrayerIndex, todaysPrayers, tomorrowsPrayers, selectedDate, selectedPrayerIndex, isOverlay]);

  return { timerName, timeDisplay };
};
