
import { useAtom } from 'jotai';
import { 
  nextPrayerIndexAtom,
  selectedPrayerIndexAtom,
  overlayVisibleAtom,
  todaysPrayersAtom
} from '@/stores/state';

export const usePrayerState = () => {
  const [nextPrayerIndex, setNextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [selectedPrayerIndex, setSelectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [overlayVisible, setOverlayVisible] = useAtom(overlayVisibleAtom);
  const [todaysPrayers, setTodaysPrayers] = useAtom(todaysPrayersAtom);

  const incrementNextPrayer = () => {
    const lastPrayerIndex = Object.keys(todaysPrayers).length - 1;
    setNextPrayerIndex(nextPrayerIndex === lastPrayerIndex ? 0 : nextPrayerIndex + 1);
  };

  const selectPrayer = (index: number) => {
    setSelectedPrayerIndex(index);
    setOverlayVisible(true);
  };

  const closeOverlay = () => {
    setOverlayVisible(false);
  };

  const markPrayerAsPassed = (index: number) => {
    setTodaysPrayers(prayers => ({
      ...prayers,
      [index]: { ...prayers[index], passed: true }
    }));
  };

  return {
    nextPrayerIndex,
    selectedPrayerIndex,
    overlayVisible,
    incrementNextPrayer,
    selectPrayer,
    closeOverlay,
    markPrayerAsPassed
  };
};