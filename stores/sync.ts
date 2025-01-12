import { atom } from 'jotai';
import { loadable } from 'jotai/utils';
import { getDefaultStore } from 'jotai/vanilla';

import * as Api from '@/api/client';
import { PRAYER_INDEX_ASR } from '@/shared/constants';
import logger from '@/shared/logger';
import * as TimeUtils from '@/shared/time';
import { DaySelection, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';
import * as ScheduleStore from '@/stores/schedule';
import { atomWithStorageString } from '@/stores/storage';
import * as Timer from '@/stores/timer';

const store = getDefaultStore();

// --- Atoms ---

export const syncLoadable = loadable(atom(async () => sync()));
export const dateAtom = atomWithStorageString('display_date', '');

// --- Actions ---

const setDate = () => {
  const schedule = store.get(ScheduleStore.standardScheduleAtom);
  const currentDateFromData = schedule.today[PRAYER_INDEX_ASR].date;
  store.set(dateAtom, currentDateFromData);
};

const shouldFetchNextYear = (): boolean => {
  const fetchedYears = Database.getItem('fetched_years') || {};
  const nextYear = TimeUtils.getCurrentYear() + 1;
  return TimeUtils.isDecember() && !fetchedYears[nextYear];
};

const initializeAppState = async (date: Date) => {
  ScheduleStore.setSchedule(ScheduleType.Standard, date);
  ScheduleStore.setSchedule(ScheduleType.Extra, date);

  setDate();

  Timer.startTimers();
};

const needsDataUpdate = (): boolean => {
  const dateSaved = store.get(dateAtom);
  const standardSchedule = store.get(ScheduleStore.standardScheduleAtom);
  const dateNow = TimeUtils.getDateTodayOrTomorrow(DaySelection.Today);

  return dateSaved !== dateNow || Object.keys(standardSchedule.today).length === 0 || shouldFetchNextYear();
};

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

// App entry point and manages midnight synchronization
export const sync = async () => {
  try {
    if (needsDataUpdate()) await updatePrayerData();
    else logger.info('SYNC: Data already up to date');

    const date = TimeUtils.createLondonDate();

    initializeAppState(date);

    // ! Test code - remove in production
    // setTimeout(() => {
    //   initializeAppState(new Date('2025-01-06'));
    //   logger.info('Test: Changed date to 2025-01-06');
    // }, 3000);
  } catch (error) {
    logger.error('SYNC: Failed', { error });
    throw error;
  }
};
