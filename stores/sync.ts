import { atom } from 'jotai';
import { atomWithStorage, loadable } from 'jotai/utils';
import { getDefaultStore } from 'jotai/vanilla';

import * as Api from '@/api/client';
import { PRAYER_INDEX_ASR } from '@/shared/constants';
import logger from '@/shared/logger';
import * as TimeUtils from '@/shared/time';
import * as Types from '@/shared/types';
import * as Database from '@/stores/database';
import * as ScheduleStore from '@/stores/schedule';

const store = getDefaultStore();

// Atoms
export const dateAtom = atomWithStorage<string>('date', '', Database.mmkvStorage);

export const fetchedYearsAtom = atomWithStorage<Types.FetchedYears>('fetchedYears', {}, Database.mmkvStorage);

export const fetchAndSaveDataLoadable = loadable(atom(async () => fetchAndSaveData()));

// Actions
/** Gets current stored date */
export const getDate = () => store.get(dateAtom);

/** Gets fetched years data */
export const getFetchedYears = () => store.get(fetchedYearsAtom);

/** Updates stored date from Asr prayer */
export const setDate = () => {
  const schedule = store.get(ScheduleStore.standardScheduleAtom);
  const currentDate = schedule.today[PRAYER_INDEX_ASR].date;

  store.set(dateAtom, currentDate);
};

/** Checks if next year's data needed */
export const shouldFetchNextYear = (): boolean => {
  const fetchedYears = getFetchedYears();
  const nextYear = TimeUtils.getCurrentYear() + 1;
  return TimeUtils.isDecember() && !fetchedYears[nextYear];
};

/** Marks year's data as fetched */
export const markYearAsFetched = (year: number) => {
  const fetchedYears = getFetchedYears();
  store.set(fetchedYearsAtom, { ...fetchedYears, [year]: true });
};

/** Updates schedule and date in Jotai store */
export const updateSchedulesAndDate = () => {
  ScheduleStore.setSchedule(Types.ScheduleType.Standard);
  ScheduleStore.setSchedule(Types.ScheduleType.Extra);
  setDate();
};

/**
 * Fetches and saves prayer time data for the current year (and next year if needed)
 *
 * Flow:
 * 1. Compare stored date with current date
 * 2. Check if schedule is properly initialized
 * 3. Check if we're in December and need next year's data
 * 4. If all conditions are met (same date, initialized, not December), exit early
 * 5. Otherwise:
 *    a. Clear existing database of old data
 *    b. Fetch and save current year's prayer times
 *    c. Mark current year as fetched in storage
 *    d. If in December, fetch next year's data and mark as fetched
 */
export const fetchAndSaveData = async () => {
  const dateSaved = getDate();
  const dateNow = TimeUtils.getDateTodayOrTomorrow(Types.DaySelection.Today);

  const standardSchedule = store.get(ScheduleStore.standardScheduleAtom);
  const isInit = Object.keys(standardSchedule.today).length === 0;

  const currentYear = TimeUtils.getCurrentYear();
  const needsNextYear = shouldFetchNextYear();

  logger.info({ dateSaved, dateNow, isInit, needsNextYear }, 'Starting data refresh');

  if (dateSaved === dateNow && !isInit && !needsNextYear) return logger.info('Data already up to date');

  Database.clear();

  try {
    const currentYearData = await Api.handle(currentYear);
    Database.saveAll(currentYearData);
    markYearAsFetched(currentYear);

    if (needsNextYear) {
      const nextYearData = await Api.handle(currentYear + 1);
      Database.saveAll(nextYearData);
      markYearAsFetched(currentYear + 1);
    }

    logger.info('Prayer data processed');
  } catch (error) {
    logger.error({ error }, 'Failed to refresh prayer data');
    throw error;
  }
};
