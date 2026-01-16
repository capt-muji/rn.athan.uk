import { atom } from 'jotai';
import { loadable } from 'jotai/utils';
import { getDefaultStore } from 'jotai/vanilla';

import * as Api from '@/api/client';
import { PRAYER_INDEX_ASR } from '@/shared/constants';
import logger from '@/shared/logger';
import * as TimeUtils from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';
import * as ScheduleStore from '@/stores/schedule';
import { atomWithStorageString } from '@/stores/storage';
import * as Timer from '@/stores/timer';

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

// Initialize or reinitialize the app's core state
// 1. Sets up both standard and extra prayer schedules
// 2. Updates the stored date
// 3. Starts the prayer time monitoring timers
const initializeAppState = async (date: Date) => {
  ScheduleStore.setSchedule(ScheduleType.Standard, date);
  ScheduleStore.setSchedule(ScheduleType.Extra, date);

  setDate();

  Timer.startTimers();
};

// Determines if the app needs to fetch fresh prayer time data
// Returns true if:
// 1. Schedule is empty (no data for today)
// 2. It's December and next year's data needs fetching
const needsDataUpdate = (): boolean => {
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
    const { currentYearData, nextYearData, currentYear } = await Api.fetchPrayerData(shouldFetchNextYear());

    Database.saveAllPrayers(currentYearData);
    Database.markYearAsFetched(currentYear);

    if (nextYearData) {
      Database.saveAllPrayers(nextYearData);
      Database.markYearAsFetched(currentYear + 1);
    }
    logger.info('SYNC: Data refresh complete');
  } catch (error) {
    logger.error('SYNC: Failed to update prayer data', { error });
    throw error;
  }
};

// Main synchronization function - App entry point
// Flow:
// 1. Checks if data update is needed
// 2. Fetches new data if required
// 3. Initializes app state with current date
export const sync = async () => {
  try {
    if (needsDataUpdate()) await updatePrayerData();
    else logger.info('SYNC: Data already up to date');

    const date = TimeUtils.createLondonDate();

    initializeAppState(date);
  } catch (error) {
    logger.error('SYNC: Failed', { error });
    throw error;
  }
};
