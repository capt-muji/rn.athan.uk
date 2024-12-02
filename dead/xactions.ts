import { getDefaultStore } from 'jotai/vanilla';

import * as PrayerUtils from '@/shared/prayer';
import * as TimeUtils from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import * as database from '@/stores/database';
import { standardScheduleAtom, extraScheduleAtom } from '@/stores/store';

/** Global store instance */
const store = getDefaultStore();

/** Gets schedule based on type */
export const getSchedule = (type: ScheduleType) =>
  type === ScheduleType.Standard ? store.get(standardScheduleAtom) : store.get(extraScheduleAtom);

// --- Schedule Management ---
/** Updates prayer schedule for given type */
export const setSchedule = (type: ScheduleType) => {
  const schedule = getSchedule(type);

  const today = TimeUtils.createLondonDate();
  const tomorrow = TimeUtils.createLondonDate();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dataToday = database.getByDate(today);
  const dataTomorrow = database.getByDate(tomorrow);

  const scheduleToday = PrayerUtils.createSchedule(dataToday!, type);
  const scheduleTomorrow = PrayerUtils.createSchedule(dataTomorrow!, type);

  const scheduleTodayValues = Object.values(scheduleToday);
  const nextPrayer = scheduleTodayValues.find((prayer) => !TimeUtils.isTimePassed(prayer.time)) || scheduleToday[0];

  const scheduleAtom = type === ScheduleType.Standard ? standardScheduleAtom : extraScheduleAtom;
  store.set(scheduleAtom, {
    ...schedule,
    type,
    today: scheduleToday,
    tomorrow: scheduleTomorrow,
    nextIndex: nextPrayer.index,
  });
};

/** Increments to next prayer index */
export const incrementNextIndex = (type: ScheduleType) => {
  const isStandard = type === ScheduleType.Standard;
  const schedule = getSchedule(type);

  const isLastPrayer = schedule.nextIndex === Object.keys(schedule.today).length - 1;
  const nextIndex = isLastPrayer ? 0 : schedule.nextIndex + 1;

  const scheduleAtom = isStandard ? standardScheduleAtom : extraScheduleAtom;

  store.set(scheduleAtom, { ...schedule, nextIndex });
};
