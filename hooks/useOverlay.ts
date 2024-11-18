import { PrayerType, DaySelection } from '@/shared/types';
import useStore from '@/stores/store';
import useSchedule from './useSchedule';

export default function useOverlay(type: PrayerType) {
  const { overlay } = useStore();

  const toggle = () => {
    overlay.setIsOverlayOn(!overlay.isOverlayOn);
  };

  return {
    isOverlayOn: overlay.isOverlayOn,
    toggle
  };
}
