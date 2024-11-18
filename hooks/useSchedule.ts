import useStore from '@/stores/store';
import { getTodayOrTomorrow } from '@/stores/database';
import { createSchedule } from '@/shared/prayer';
import { PrayerType, IScheduleNow, DaySelection } from '@/shared/types';

export default function useSchedule(type: PrayerType) {
  const { schedules } = useStore();
  const schedule = schedules[type];

  const setScheduleDay = (day: DaySelection) => {
    const raw = getTodayOrTomorrow(day);
    if (!raw) throw new Error('Data not found');
    
    const scheduleDay = createSchedule(raw, type);
    day === DaySelection.Today ? schedule.setToday(scheduleDay) : schedule.setTomorrow(scheduleDay);
  };

  const setNextIndex = () => {
    const scheduleToday = Object.values(schedule.today);

    const nextPrayer = scheduleToday.find(prayer => !prayer.passed) || scheduleToday[0];
    schedule.setNextIndex(nextPrayer.index);
  };

  return {
    today: schedule.today,
    tomorrow: schedule.tomorrow,
    nextIndex: schedule.nextIndex,
    selectedIndex: schedule.selectedIndex,
    measurements: schedule.measurements,
    setScheduleDay,
    setNextIndex,
    setMeasurements: schedule.setMeasurements,
    setSelectedIndex: schedule.setSelectedIndex
  };
}