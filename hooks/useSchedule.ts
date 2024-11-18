import { useAtom } from 'jotai';
import Storage from '@/stores/database';
import { createSchedule } from '@/shared/prayer';
import { PrayerType, Measurements, IScheduleNow, DaySelection } from '@/shared/types';
import Store from '@/stores/store';

export default function useSchedule(type: PrayerType) {
  const scheduleStore = Store.schedules[type];
  const [today, setToday] = useAtom(scheduleStore.today);
  const [tomorrow, setTomorrow] = useAtom(scheduleStore.tomorrow);
  const [nextIndex, setNextIndex] = useAtom(scheduleStore.nextIndex);
  const [selectedIndex, setSelectedIndex] = useAtom(scheduleStore.selectedIndex);
  const [measurements, setMeasurementsAtom] = useAtom(scheduleStore.measurements);

  const setScheduleDay = (day: DaySelection) => {
    const raw = Storage.prayers.getTodayOrTomorrow(day);
    if (!raw) throw new Error('Data not found');
    
    const schedule = createSchedule(raw, type);
    day === DaySelection.Today ? setToday(schedule) : setTomorrow(schedule);

    return schedule;
  };

  const setMeasurements = (index: number, measurements: Measurements) => {
    setMeasurementsAtom(prev => ({ ...prev, [index]: measurements }));
  };

  const setSelectPrayer = (index: number) => {
    setSelectedIndex(index);
  };


  const updateNextIndex = (prayers: IScheduleNow) => {
    const schedule = Object.values(prayers);
    const nextPrayer = schedule.find(prayer => !prayer.passed) || prayers[0];
    setNextIndex(nextPrayer.index);
    return nextPrayer;
  }

  return {
    today,
    tomorrow,
    nextIndex,
    selectedIndex,
    measurements,
    setScheduleDay,
    setMeasurements,
    setSelectPrayer,
    setNextIndex,
  };
}