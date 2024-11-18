import Storage from '@/stores/database';
import { createSchedule } from '@/shared/prayer';
import { PrayerType } from '@/shared/types';
import useStore from '@/hooks/useStore';

export default function useSchedule(type: PrayerType) {
  const Store = useStore(type);

  const setTodayAndTomorrow = () => {
    const todayRaw = Storage.prayers.getTodayOrTomorrow('today');
    const tomorrowRaw = Storage.prayers.getTodayOrTomorrow('tomorrow');

    if (!todayRaw || !tomorrowRaw) throw new Error('Data not found');
    
    const todaySchedule = createSchedule(todayRaw, type);
    const tomorrowSchedule = createSchedule(tomorrowRaw, type);

    Store.schedule.setToday(todaySchedule);
    Store.schedule.setTomorrow(tomorrowSchedule);

    return { today: todaySchedule, tomorrow: tomorrowSchedule };
  };

  return {
    ...Store,
    setTodayAndTomorrow,
  };
}