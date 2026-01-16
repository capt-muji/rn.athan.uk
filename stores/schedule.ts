import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import logger from '@/shared/logger';
import * as PrayerUtils from '@/shared/prayer';
import * as TimeUtils from '@/shared/time';
import { ITransformedPrayer, ScheduleAtom, ScheduleStore, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';
import { overlayAtom } from '@/stores/overlay';
import * as SyncStore from '@/stores/sync';

const store = getDefaultStore();

// --- Initial State ---

const createInitialPrayer = (scheduleType: ScheduleType): ITransformedPrayer => ({
  index: 0,
  date: '2024-11-15',
  english: 'Fajr',
  arabic: 'الفجر',
  time: '00:01',
  type: scheduleType,
});

const createInitialSchedule = (scheduleType: ScheduleType): ScheduleStore => ({
  type: scheduleType,
  yesterday: { 0: createInitialPrayer(scheduleType) },
  today: { 0: createInitialPrayer(scheduleType) },
  tomorrow: { 0: createInitialPrayer(scheduleType) },
  nextIndex: 0,
});

// --- Atoms ---

export const standardScheduleAtom = atom<ScheduleStore>(createInitialSchedule(ScheduleType.Standard));
export const extraScheduleAtom = atom<ScheduleStore>(createInitialSchedule(ScheduleType.Extra));

// --- Helpers ---

// Create daily schedules based on provided date and next day
const buildDailySchedules = (type: ScheduleType, date: Date) => {
  const yesterdayDate = TimeUtils.createLondonDate(date);
  yesterdayDate.setDate(date.getDate() - 1);

  const todayData = Database.getPrayerByDate(date);
  const tomorrowDate = TimeUtils.createLondonDate(date);
  tomorrowDate.setDate(date.getDate() + 1);
  const tomorrowData = Database.getPrayerByDate(tomorrowDate);

  const yesterdayData = Database.getPrayerByDate(yesterdayDate);

  return {
    yesterday: PrayerUtils.createSchedule(yesterdayData!, type),
    today: PrayerUtils.createSchedule(todayData!, type),
    tomorrow: PrayerUtils.createSchedule(tomorrowData!, type),
  };
};

// --- Actions ---

const getScheduleAtom = (type: ScheduleType): ScheduleAtom => {
  return type === ScheduleType.Standard ? standardScheduleAtom : extraScheduleAtom;
};

export const getSchedule = (type: ScheduleType): ScheduleStore => store.get(getScheduleAtom(type));

export const setSchedule = (type: ScheduleType, date: Date): void => {
  const scheduleAtom = getScheduleAtom(type);
  const currentSchedule = store.get(scheduleAtom);

  const { yesterday, today, tomorrow } = buildDailySchedules(type, date);
  const nextIndex = PrayerUtils.findNextPrayerIndex(today);

  store.set(scheduleAtom, { ...currentSchedule, type, yesterday, today, tomorrow, nextIndex });
};

export const incrementNextIndex = (type: ScheduleType): void => {
  const scheduleAtom = getScheduleAtom(type);
  const schedule = getSchedule(type);

  const isLastPrayer = schedule.nextIndex === Object.keys(schedule.today).length - 1;
  const nextIndex = isLastPrayer ? 0 : schedule.nextIndex + 1;

  store.set(scheduleAtom, { ...schedule, nextIndex });
};

// Advances a schedule to tomorrow after the last prayer passes
// Implements prayer-based day boundary (Islamic midnight)
export const advanceScheduleToTomorrow = async (type: ScheduleType): Promise<void> => {
  const scheduleAtom = getScheduleAtom(type);

  // 1. Close overlay first (prevent stale state)
  const overlay = store.get(overlayAtom);
  if (overlay.isOn && overlay.scheduleType === type) {
    store.set(overlayAtom, { ...overlay, isOn: false });
  }

  // 2. Fetch new data BEFORE shifting (atomic operation)
  // Data should always be available - entire year is cached proactively
  const schedule = getSchedule(type);
  const tomorrowDate = schedule.tomorrow[0].date;
  const dayAfterTomorrow = TimeUtils.createLondonDate(tomorrowDate);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  const newTomorrowData = Database.getPrayerByDate(dayAfterTomorrow);

  // 3. Only shift AFTER successful fetch
  // If data is missing, let it throw - use refresh button to fix cache
  const newTomorrow = PrayerUtils.createSchedule(newTomorrowData!, type);
  store.set(scheduleAtom, {
    ...schedule,
    yesterday: schedule.today,
    today: schedule.tomorrow,
    tomorrow: newTomorrow,
    nextIndex: 0,
  });

  // 5. Update date atom
  SyncStore.setScheduleDate(type, tomorrowDate);

  logger.info('SCHEDULE: Advanced schedule', {
    type,
    newDate: tomorrowDate,
  });
};
