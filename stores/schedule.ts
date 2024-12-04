import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import * as PrayerUtils from '@/shared/prayer';
import * as TimeUtils from '@/shared/time';
import * as Types from '@/shared/types';
import * as Database from '@/stores/database';

const store = getDefaultStore();

// --- Atoms ---

const initialPrayer = (scheduleType: Types.ScheduleType) => ({
  index: 0,
  date: '2024-11-15',
  english: 'Fajr',
  arabic: 'الفجر',
  time: '05:35',
  type: scheduleType,
});

const createScheduleAtom = (scheduleType: Types.ScheduleType) =>
  atom<Types.ScheduleStore>({
    type: scheduleType,
    today: {
      0: initialPrayer(scheduleType),
    },
    tomorrow: {
      0: initialPrayer(scheduleType),
    },
    nextIndex: 0,
  });

export const standardScheduleAtom = createScheduleAtom(Types.ScheduleType.Standard);
export const extraScheduleAtom = createScheduleAtom(Types.ScheduleType.Extra);

// --- Actions ---

/** Gets schedule based on type */
export const getSchedule = (type: Types.ScheduleType) =>
  type === Types.ScheduleType.Standard ? store.get(standardScheduleAtom) : store.get(extraScheduleAtom);

/** Updates prayer schedule for given type */
export const setSchedule = (type: Types.ScheduleType) => {
  const schedule = getSchedule(type);

  const today = TimeUtils.createLondonDate();
  const tomorrow = TimeUtils.createLondonDate();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dataToday = Database.getByDate(today);
  const dataTomorrow = Database.getByDate(tomorrow);

  const scheduleToday = PrayerUtils.createSchedule(dataToday!, type);
  const scheduleTomorrow = PrayerUtils.createSchedule(dataTomorrow!, type);

  const scheduleTodayValues = Object.values(scheduleToday);
  const nextPrayer = scheduleTodayValues.find((prayer) => !TimeUtils.isTimePassed(prayer.time)) || scheduleToday[0];

  const scheduleAtom = type === Types.ScheduleType.Standard ? standardScheduleAtom : extraScheduleAtom;
  store.set(scheduleAtom, {
    ...schedule,
    type,
    today: scheduleToday,
    tomorrow: scheduleTomorrow,
    nextIndex: nextPrayer.index,
  });
};

/** Increments to next prayer index */
export const incrementNextIndex = (type: Types.ScheduleType) => {
  const isStandard = type === Types.ScheduleType.Standard;
  const schedule = getSchedule(type);

  const isLastPrayer = schedule.nextIndex === Object.keys(schedule.today).length - 1;
  const nextIndex = isLastPrayer ? 0 : schedule.nextIndex + 1;

  const scheduleAtom = isStandard ? standardScheduleAtom : extraScheduleAtom;
  store.set(scheduleAtom, { ...schedule, nextIndex });
};
