import { PrayerType, DaySelection } from '@/shared/types';
import useStore from '@/hooks/useStore';

export default function useOverlay(type: PrayerType) {
  const { app, schedule } = useStore(type);

  const isSelectedPrayerTomorrow = app.isOverlayOn && schedule.today[schedule.selectedIndex]?.passed;
  const prayers = isSelectedPrayerTomorrow ? schedule.tomorrow : schedule.today;
  const day: DaySelection = isSelectedPrayerTomorrow ? 'tomorrow' : 'today';
  const currentIndex = app.isOverlayOn ? schedule.selectedIndex : schedule.nextIndex;

  return {
    isOverlayOn: app.isOverlayOn,
    currentPrayers: prayers,
    currentDay: day,
    currentIndex,
    setIsOverlayOn: app.setIsOverlayOn,
    setSelectedIndex: schedule.setSelectedIndex
  };
}
