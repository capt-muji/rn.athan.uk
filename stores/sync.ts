import { atom } from 'jotai';
import { loadable } from 'jotai/utils';
import { getDefaultStore } from 'jotai/vanilla';

import * as Api from '@/api/client';
import { APP_CONFIG } from '@/shared/config';
import { PRAYER_INDEX_ASR } from '@/shared/constants';
import logger from '@/shared/logger';
import * as TimeUtils from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';
import * as ScheduleStore from '@/stores/schedule';
import { atomWithStorageString } from '@/stores/storage';
import * as Timer from '@/stores/timer';
import { handleAppUpgrade } from '@/stores/version';

const store = getDefaultStore();

// --- Atoms ---
export const syncLoadable = loadable(atom(async () => sync()));
export const standardDateAtom = atomWithStorageString('display_date_standard', '');
export const extraDateAtom = atomWithStorageString('display_date_extra', '');

// --- Helpers ---
export const getDateAtom = (type: ScheduleType) => (type === ScheduleType.Standard ? standardDateAtom : extraDateAtom);

// --- Actions ---
export const triggerSyncLoadable = () => store.get(syncLoadable);

// Set the date for a specific schedule (used when advancing to tomorrow)
export const setScheduleDate = (type: ScheduleType, date: string) => {
  const dateAtom = getDateAtom(type);
  store.set(dateAtom, date);
};

// Update the stored date based on the current schedule's Asr prayer time
const setDate = () => {
  const standardSchedule = store.get(ScheduleStore.standardScheduleAtom);
  const extraSchedule = store.get(ScheduleStore.extraScheduleAtom);

  const standardDate = standardSchedule.today[PRAYER_INDEX_ASR].date;
  const extraDate = extraSchedule.today[0].date;

  store.set(standardDateAtom, standardDate);
  store.set(extraDateAtom, extraDate);
};

// Check if we need to pre-fetch next year's data
// Returns true if it's December and we haven't yet fetched next year's data
const shouldFetchNextYear = (): boolean => {
  const fetchedYears = Database.getItem('fetched_years') || {};
  const nextYear = TimeUtils.getCurrentYear() + 1;
  return TimeUtils.isDecember() && !fetchedYears[nextYear];
};

// Check if date is January 1st (needed for ProgressBar yesterday's data)
const isJanuaryFirst = (date: Date): boolean => {
  return date.getMonth() === 0 && date.getDate() === 1;
};

// Initialize or reinitialize the app's core state
// 1. Sets up both standard and extra prayer schedules
// 2. Updates the stored date
// 3. Starts the prayer time monitoring timers
const initializeAppState = async (date: Date) => {
  // SCENARIO 1: January 1st - Fetch previous year's Dec 31 data for ProgressBar
  // This is MANDATORY - ProgressBar needs yesterday's Isha time to calculate progress
  if (isJanuaryFirst(date)) {
    const prevYearLastDate = new Date(date.getFullYear() - 1, 11, 31);
    const prevYearData = Database.getPrayerByDate(prevYearLastDate);

    if (!prevYearData) {
      logger.info('SYNC: Jan 1 detected, fetching previous year Dec 31 data');

      const prevYearData = await Api.fetchYear(date.getFullYear() - 1);
      Database.saveAllPrayers(prevYearData);
      Database.markYearAsFetched(date.getFullYear() - 1);

      logger.info('SYNC: Previous year data fetched and saved');
    }
  }

  ScheduleStore.setSchedule(ScheduleType.Standard, date);
  ScheduleStore.setSchedule(ScheduleType.Extra, date);

  setDate();

  // Advance schedules if last prayer has already passed
  const standardSchedule = ScheduleStore.getSchedule(ScheduleType.Standard);
  const extraSchedule = ScheduleStore.getSchedule(ScheduleType.Extra);

  const standardLast = standardSchedule.today[Object.keys(standardSchedule.today).length - 1];
  const extraLast = extraSchedule.today[Object.keys(extraSchedule.today).length - 1];

  if (TimeUtils.isTimePassed(standardLast.time)) {
    await ScheduleStore.advanceScheduleToTomorrow(ScheduleType.Standard);
  }
  if (TimeUtils.isTimePassed(extraLast.time)) {
    await ScheduleStore.advanceScheduleToTomorrow(ScheduleType.Extra);
  }

  Timer.startTimers();
};

// Determines if the app needs to fetch fresh prayer time data
// Returns true if:
// 1. Dev mode is enabled (EXPO_PUBLIC_DEV_MODE=true)
// 2. Schedule is empty (no data for today)
// 3. It's December and next year's data needs fetching
const needsDataUpdate = (): boolean => {
  if (APP_CONFIG.isDev) return true;

  const now = TimeUtils.createLondonDate();
  const data = Database.getPrayerByDate(now);

  if (!data) return true;

  const needNewYear = shouldFetchNextYear();
  if (needNewYear) return true;

  return false;
};

// Fetches and stores new prayer time data
// 1. Cleans up old data
// 2. Fetches current year (and optionally next year) data
// 3. Saves data to local storage and marks years as fetched
const updatePrayerData = async () => {
  logger.info('SYNC: Starting data refresh');
  Database.cleanup();

  try {
    // SCENARIO 3: December - Proactively fetch current year + next year
    if (shouldFetchNextYear()) {
      const currentYear = TimeUtils.getCurrentYear();
      const nextYear = currentYear + 1;

      const [currentYearData, nextYearData] = await Promise.all([Api.fetchYear(currentYear), Api.fetchYear(nextYear)]);

      Database.saveAllPrayers(currentYearData);
      Database.markYearAsFetched(currentYear);

      Database.saveAllPrayers(nextYearData);
      Database.markYearAsFetched(nextYear);

      logger.info('SYNC: Data refresh complete (current + next year)', { currentYear, nextYear });
    }
    // SCENARIO 2: Standard sync - Fetch current year only
    else {
      const currentYear = TimeUtils.getCurrentYear();
      const data = await Api.fetchYear(currentYear);

      Database.saveAllPrayers(data);
      Database.markYearAsFetched(currentYear);

      logger.info('SYNC: Data refresh complete (current year only)', { year: currentYear });
    }
  } catch (error) {
    logger.error('SYNC: Failed to update prayer data', { error });
    throw error;
  }
};

// Main synchronization function - App entry point
// Flow:
// 1. Checks for app upgrade and clears cache if needed
// 2. Checks if data update is needed
// 3. Fetches new data if required
// 4. Initializes app state with current date
export const sync = async () => {
  try {
    handleAppUpgrade();

    if (needsDataUpdate()) await updatePrayerData();
    else logger.info('SYNC: Data already up to date');

    const date = TimeUtils.createLondonDate();

    initializeAppState(date);
  } catch (error) {
    logger.error('SYNC: Failed', { error });
    throw error;
  }
};
