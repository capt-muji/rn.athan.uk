import Storage from '@/stores/database';
import { createSchedule } from '@/shared/prayer';
import { PrayerType } from '@/shared/types';
import useBaseStore from './useBaseStore';

export default function useSchedule(type: PrayerType) {
  const Base = useBaseStore(type);

  const setTodayAndTomorrow = () => {
    const todayRaw = Storage.prayers.getTodayOrTomorrow('today');
    const tomorrowRaw = Storage.prayers.getTodayOrTomorrow('tomorrow');

    if (!todayRaw || !tomorrowRaw) throw new Error('Data not found');
    
    const todaySchedule = createSchedule(todayRaw, type);
    const tomorrowSchedule = createSchedule(tomorrowRaw, type);

    Base.schedule.setToday(todaySchedule);
    Base.schedule.setTomorrow(tomorrowSchedule);

    return { today: todaySchedule, tomorrow: tomorrowSchedule };
  };

  return {
    ...Base,
    setTodayAndTomorrow,
  };
}