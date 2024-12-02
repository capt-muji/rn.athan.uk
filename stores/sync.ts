import { atom } from 'jotai';
import { atomWithStorage, loadable } from 'jotai/utils';
import { getDefaultStore } from 'jotai/vanilla';

import * as Api from '@/api/client';
import * as Constants from '@/shared/constants';
import logger from '@/shared/logger';
import * as TimeUtils from '@/shared/time';
import * as Types from '@/shared/types';
import * as Database from '@/stores/database';
import * as ScheduleStore from '@/stores/schedule';

// Atoms
export const dateAtom = atomWithStorage('date', '', Database.mmkvStorage, {
  getOnInit: true,
});

export const fetchedYearsAtom = atomWithStorage<Types.FetchedYears>('fetchedYears', {}, Database.mmkvStorage, {
  getOnInit: true,
});

export const initialiseLoadable = loadable(atom(async () => refresh()));

// Actions
const store = getDefaultStore();

/** Gets current stored date */
export const getDate = () => store.get(dateAtom);

/** Gets fetched years data */
export const getFetchedYears = () => store.get(fetchedYearsAtom);

/** Updates stored date from Asr prayer */
export const setDate = () => {
  const schedule = store.get(ScheduleStore.standardScheduleAtom);
  const currentDate = schedule.today[Constants.PRAYER_INDEX_ASR].date;
  store.set(dateAtom, currentDate);
  logger.info({ date: currentDate }, 'Date saved to storage');
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

/** Refreshes prayer data from API */
export const refresh = async () => {
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

    // TODO: break below out into a separate part
    ScheduleStore.setSchedule(Types.ScheduleType.Standard);
    ScheduleStore.setSchedule(Types.ScheduleType.Extra);
    setDate();
    // TODO: break above out into a separate part

    logger.info('Finished setting up schedule and date into state');
  } catch (error) {
    logger.error({ error }, 'Failed to refresh prayer data');
    throw error;
  }
};
