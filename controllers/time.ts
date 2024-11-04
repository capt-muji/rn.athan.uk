import { ITransformedToday } from '@/types/prayers';
import { getCurrentPrayerInfo } from '../utils/time';

export const handleTimerUpdate = (
  todaysPrayers: ITransformedToday,
  overlayVisible: number,
  nextPrayerIndex: number,
  setTimerName: (name: string) => void,
  setTimeDisplay: (time: string) => void,
  setNextPrayerIndex: (index: number | ((prev: number) => number)) => void
) => {
  const { timerName, timeDisplay, timeDifference, currentPrayer } = getCurrentPrayerInfo(
    todaysPrayers,
    overlayVisible,
    nextPrayerIndex
  );

  setTimerName(timerName);
  setTimeDisplay(timeDisplay);

  if (timeDifference <= 0 && currentPrayer) {
    if (todaysPrayers[nextPrayerIndex]) {
      todaysPrayers[nextPrayerIndex].passed = true;
    }

    if (nextPrayerIndex === 6) {
      setNextPrayerIndex(-1);
    } else {
      setNextPrayerIndex(prev => prev + 1);
    }
  }
};
