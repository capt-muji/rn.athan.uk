import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import * as PrayerUtils from '@/shared/prayer';
import * as TimeUtils from '@/shared/time';
import * as Types from '@/shared/types';
import * as Database from '@/stores/database';

const store = getDefaultStore();

// --- Types ---

type ScheduleAtom = typeof standardScheduleAtom;

// --- Initial State ---

const createInitialPrayer = (scheduleType: Types.ScheduleType): Types.ITransformedPrayer => ({
  index: 0,
  date: '2024-11-15',
  english: 'Fajr',
  arabic: 'الفجر',
  time: '05:35',
  type: scheduleType,
});

const createInitialSchedule = (scheduleType: Types.ScheduleType): Types.ScheduleStore => ({
  type: scheduleType,
  today: { 0: createInitialPrayer(scheduleType) },
  tomorrow: { 0: createInitialPrayer(scheduleType) },
  nextIndex: 0,
});

// --- Atoms ---

export const standardScheduleAtom = atom<Types.ScheduleStore>(createInitialSchedule(Types.ScheduleType.Standard));
export const extraScheduleAtom = atom<Types.ScheduleStore>(createInitialSchedule(Types.ScheduleType.Extra));

// --- Helpers ---

const getScheduleAtom = (type: Types.ScheduleType): ScheduleAtom => {
  return type === Types.ScheduleType.Standard ? standardScheduleAtom : extraScheduleAtom;
};

// Create daily schedules based on today and tomorrow
const buildDailySchedules = (type: Types.ScheduleType) => {
  const today = TimeUtils.createLondonDate();
  const tomorrow = TimeUtils.createLondonDate();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dataToday = Database.getPrayerByDate(today);
  const dataTomorrow = Database.getPrayerByDate(tomorrow);

  if (!dataToday || !dataTomorrow) throw new Error('Missing prayer data');

  return {
    today: PrayerUtils.createSchedule(dataToday, type),
    tomorrow: PrayerUtils.createSchedule(dataTomorrow, type),
  };
};

// --- Actions ---

export const getSchedule = (type: Types.ScheduleType): Types.ScheduleStore => store.get(getScheduleAtom(type));

export const setSchedule = (type: Types.ScheduleType): void => {
  const scheduleAtom = getScheduleAtom(type);
  const currentSchedule = store.get(scheduleAtom);

  const { today, tomorrow } = buildDailySchedules(type);
  const nextIndex = PrayerUtils.findNextPrayerIndex(today);

  store.set(scheduleAtom, { ...currentSchedule, type, today, tomorrow, nextIndex });
};

export const incrementNextIndex = (type: Types.ScheduleType): void => {
  const scheduleAtom = getScheduleAtom(type);
  const schedule = getSchedule(type);

  const isLastPrayer = schedule.nextIndex === Object.keys(schedule.today).length - 1;
  const nextIndex = isLastPrayer ? 0 : schedule.nextIndex + 1;

  store.set(scheduleAtom, { ...schedule, nextIndex });
};
