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
  const nextDate = TimeUtils.createLondonDate(date);

  nextDate.setDate(date.getDate() + 1);

  const dataToday = Database.getPrayerByDate(date);
  const dataTomorrow = Database.getPrayerByDate(nextDate);

  if (!dataToday || !dataTomorrow) throw new Error('Missing prayer data');

  return {
    today: PrayerUtils.createSchedule(dataToday, type),
    tomorrow: PrayerUtils.createSchedule(dataTomorrow, type),
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

  const { today, tomorrow } = buildDailySchedules(type, date);
  const nextIndex = PrayerUtils.findNextPrayerIndex(today);

  store.set(scheduleAtom, { ...currentSchedule, type, today, tomorrow, nextIndex });
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
  const schedule = getSchedule(type);
  const tomorrowDate = schedule.tomorrow[0].date;
  const dayAfterTomorrow = TimeUtils.createLondonDate(tomorrowDate);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  let newTomorrowData = Database.getPrayerByDate(dayAfterTomorrow);

  // 3. Retry on missing data
  if (!newTomorrowData) {
    logger.warn('advanceSchedule: Missing day-after-tomorrow, triggering sync');
    await SyncStore.sync();
    newTomorrowData = Database.getPrayerByDate(dayAfterTomorrow);

    if (!newTomorrowData) {
      logger.error('advanceSchedule: Still missing data after sync');
      return; // Keep current schedule, don't break app
    }
  }

  // 4. Only shift AFTER successful fetch
  const newTomorrow = PrayerUtils.createSchedule(newTomorrowData, type);
  store.set(scheduleAtom, {
    ...schedule,
    today: schedule.tomorrow,
    tomorrow: newTomorrow,
    nextIndex: 0,
  });

  // 5. Update date atom
  SyncStore.setScheduleDate(type, tomorrowDate);

  logger.info('advanceSchedule: Advanced schedule', {
    type,
    newDate: tomorrowDate,
  });
};
