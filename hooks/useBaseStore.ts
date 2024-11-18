import { useAtom } from 'jotai';
import Store from '@/stores/store';
import { PrayerType, IScheduleNow, PageCoordinates } from '@/shared/types';

export default function useBaseStore(type: PrayerType) {
  const store = Store.schedules[type];
  const [date, setDate] = useAtom(Store.date.current);
  const [isLoading, setIsLoading] = useAtom(Store.app.isLoading);
  const [hasError, setHasError] = useAtom(Store.app.hasError);
  
  const [today, setToday] = useAtom(store.today);
  const [tomorrow, setTomorrow] = useAtom(store.tomorrow);
  const [nextIndex, setNextIndex] = useAtom(store.nextIndex);
  const [selectedIndex, setSelectedIndex] = useAtom(store.selectedIndex);
  const [measurements, setMeasurements] = useAtom(store.measurements);
  const [nextIndexMeasurements, setNextIndexMeasurements] = useAtom(store.nextIndexMeasurements);
  
  const updateNextIndex = (prayers: IScheduleNow) => {
    const schedule = Object.values(prayers);
    const nextPrayer = schedule.find(prayer => !prayer.passed) || prayers[0];
    setNextIndex(nextPrayer.index);
    return nextPrayer;
  };

  return {
    isLoading,
    hasError,
    date,
    today,
    tomorrow,
    nextIndex,
    selectedIndex,
    measurements,
    nextIndexMeasurements,
    setIsLoading,
    setHasError,
    setDate,
    setToday,
    setTomorrow,
    setSelectedIndex,
    setMeasurements,
    setNextIndexMeasurements,
    updateNextIndex,
  };
}