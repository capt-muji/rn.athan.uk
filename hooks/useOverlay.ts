import { useAtom } from 'jotai';
import { PrayerType, DaySelection } from '@/shared/types';
import Store from '@/stores/store';

export default function useOverlay(type: PrayerType) {
  const [isOverlayOn, setIsOverlayOn] = useAtom(Store.app.isOverlayOn);
  const scheduleStore = Store.schedules[type];
  const [today] = useAtom(scheduleStore.today);
  const [tomorrow] = useAtom(scheduleStore.tomorrow);
  const [selectedIndex] = useAtom(scheduleStore.selectedIndex);
  const [nextIndex] = useAtom(scheduleStore.nextIndex);

  const isSelectedPrayerTomorrow = isOverlayOn && today[selectedIndex]?.passed;
  const prayers = isSelectedPrayerTomorrow ? tomorrow : today;
  const day: DaySelection = isSelectedPrayerTomorrow ? 'tomorrow' : 'today';
  const currentIndex = isOverlayOn ? selectedIndex : nextIndex;

  return {
    isOverlayOn,
    currentPrayers: prayers,
    currentDay: day,
    currentIndex,
    setIsOverlayOn,
    setSelectedIndex: (index: number) => scheduleStore.selectedIndex[1](index)
  };
}
