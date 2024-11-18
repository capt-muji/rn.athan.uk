import { useAtom } from 'jotai';
import Store from '@/stores/store';
import { PrayerType, IScheduleNow } from '@/shared/types';

export default function useBaseStore(type: PrayerType) {
  const scheduleStore = Store.schedules[type];
  
  const [date, setDate] = useAtom(Store.date.current);
  const [dateMeasurements, setDateMeasurements] = useAtom(Store.date.measurements);
  const [isLoading, setIsLoading] = useAtom(Store.app.isLoading);
  const [hasError, setHasError] = useAtom(Store.app.hasError);
  const [isOverlayOn, setIsOverlayOn] = useAtom(Store.app.isOverlayOn);
  
  const [today, setToday] = useAtom(scheduleStore.today);
  const [tomorrow, setTomorrow] = useAtom(scheduleStore.tomorrow);
  const [nextIndex, setNextIndex] = useAtom(scheduleStore.nextIndex);
  const [selectedIndex, setSelectedIndex] = useAtom(scheduleStore.selectedIndex);
  const [measurements, setMeasurements] = useAtom(scheduleStore.measurements);
  const [nextIndexMeasurements, setNextIndexMeasurements] = useAtom(scheduleStore.nextIndexMeasurements);
  
  const updateNextIndex = (prayers: IScheduleNow) => {
    const schedule = Object.values(prayers);
    const nextPrayer = schedule.find(prayer => !prayer.passed) || prayers[0];
    setNextIndex(nextPrayer.index);
    return nextPrayer;
  };

  return {
    app: {
      isLoading,
      isOverlayOn,
      hasError,
      setIsLoading,
      setIsOverlayOn,
      setHasError,
    },
    date: {
      current: date,
      measurements: dateMeasurements,
      setCurrent: setDate,
      setMeasurements: setDateMeasurements,
    },
    schedule: {
      today,
      tomorrow,
      nextIndex,
      selectedIndex,
      measurements,
      nextIndexMeasurements,
      setToday,
      setTomorrow,
      setSelectedIndex,
      setMeasurements,
      setNextIndexMeasurements,
      updateNextIndex,
    },
  };
}