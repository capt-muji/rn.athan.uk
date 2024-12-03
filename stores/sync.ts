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

/** Fetches and saves prayer data */
export const fetchAndSaveData = async () => {
  const dateSaved = getDate();
  const dateNow = TimeUtils.getDateTodayOrTomorrow(Types.DaySelection.Today);

  const standardSchedule = store.get(ScheduleStore.standardScheduleAtom);
  const isNotInit = Object.keys(standardSchedule.today).length > 1;

  const currentYear = TimeUtils.getCurrentYear();
  const needsNextYear = shouldFetchNextYear();

  logger.info({ dateSaved, dateNow, isNotInit, needsNextYear }, 'Starting data refresh');

  if (dateSaved === dateNow && isNotInit && !needsNextYear) return logger.info('Data already up to date');

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
