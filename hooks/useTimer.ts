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

const THRESHOLD = 1000; // 1 second threshold

export const useTimer = () => {
  // Timer states for both next prayer and overlay
  const [nextPrayerName, setNextPrayerName] = useState('');
  const [nextPrayerTime, setNextPrayerTime] = useState('');
  const [overlayTimerName, setOverlayTimerName] = useState('');
  const [overlayTimeDisplay, setOverlayTimeDisplay] = useState('');
  
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [tomorrowsPrayers] = useAtom(tomorrowsPrayersAtom);
  const [nextPrayerIndex, setNextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [selectedDate] = useAtom(selectedPrayerDateAtom);
  const [selectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [isOverlay] = useAtom(overlayAtom);

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

      // Update next prayer timer (always running)
      setNextPrayerName(nextPrayerInfo.timerName);
      setNextPrayerTime(nextPrayerInfo.timeDisplay);

      // Update overlay timer if active
      if (isOverlay && selectedPrayerIndex !== null) {
        const overlayInfo = getCurrentPrayerInfo(
          displayPrayers,
          selectedPrayerIndex,
          selectedDate,
          selectedPrayerIndex
        );
        setOverlayTimerName(overlayInfo.timerName);
        setOverlayTimeDisplay(overlayInfo.timeDisplay);
      }

      // Update prayer status when next prayer timer completes
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
  }, [nextPrayerIndex, todaysPrayers, tomorrowsPrayers, selectedDate, selectedPrayerIndex, isOverlay]);

  return {
    nextPrayer: { timerName: nextPrayerName, timeDisplay: nextPrayerTime },
    overlayTimer: { timerName: overlayTimerName, timeDisplay: overlayTimeDisplay }
  };
};
