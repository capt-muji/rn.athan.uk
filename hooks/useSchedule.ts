import { useAtom } from 'jotai';
import Storage from '@/stores/database';
import { createSchedule } from '@/shared/prayer';
import { PrayerType, IScheduleNow } from '@/shared/types';
import Store from '@/stores/store';

export default function useSchedule(type: PrayerType) {
  const scheduleStore = Store.schedule[type];
  
  const [today, setToday] = useAtom(scheduleStore.today);
  const [tomorrow, setTomorrow] = useAtom(scheduleStore.tomorrow);
  const [nextIndex, setNextIndex] = useAtom(scheduleStore.nextIndex);
  const [selectedIndex, setSelectedIndex] = useAtom(scheduleStore.selectedIndex);
  const [measurements, setMeasurements] = useAtom(scheduleStore.measurements);
  const [nextIndexMeasurements, setNextIndexMeasurements] = useAtom(scheduleStore.nextIndexMeasurements);

  const setTodayAndTomorrow = () => {
    console.log(`Setting ${type} schedule`);

    const todayRaw = Storage.prayers.getTodayOrTomorrow('today');
    const tomorrowRaw = Storage.prayers.getTodayOrTomorrow('tomorrow');

    if (!todayRaw || !tomorrowRaw) throw new Error('Data not found');
    
    const todaySchedule = createSchedule(todayRaw, type);
    const tomorrowSchedule = createSchedule(tomorrowRaw, type);

    setToday(todaySchedule);
    setTomorrow(tomorrowSchedule);

    return { today: todaySchedule, tomorrow: tomorrowSchedule };
  };

  const updateNextIndex = (prayers: IScheduleNow) => {
    const schedule = Object.values(prayers);
    const nextPrayer = schedule.find(prayer => !prayer.passed) || prayers[0];
    setNextIndex(nextPrayer.index);
    return nextPrayer;
  };

  return {
    scheduleToday: today,
    scheduleTomorrow: tomorrow,
    nextIndex,
    selectedIndex,
    measurements,
    nextIndexMeasurements,
    setMeasurements,
    setNextIndexMeasurements,
    setTodayAndTomorrow,
    setSelectedIndex,
    updateNextIndex
  };
}