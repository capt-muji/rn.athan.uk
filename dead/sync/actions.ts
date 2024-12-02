import { getDefaultStore } from 'jotai/vanilla';

import { dateAtom, fetchedYearsAtom } from './atoms';
import * as database from '../../stores/core/database';
import { standardScheduleAtom } from '../schedule/atoms';

import { handle } from '@/api/client';
import { setSchedule } from '@/dead/schedule/actions';
import { PRAYER_INDEX_ASR } from '@/shared/constants';
import logger from '@/shared/logger';
import * as TimeUtils from '@/shared/time';
import { getCurrentYear, isDecember } from '@/shared/time';
import { DaySelection, ScheduleType } from '@/shared/types';

const store = getDefaultStore();

/** Gets current stored date */
export const getDate = () => store.get(dateAtom);

/** Gets fetched years data */
export const getFetchedYears = () => store.get(fetchedYearsAtom);

/** Updates stored date from Asr prayer */
export const setDate = () => {
  const schedule = store.get(standardScheduleAtom);
  const currentDate = schedule.today[PRAYER_INDEX_ASR].date;
  store.set(dateAtom, currentDate);
};

/** Checks if next year's data needed */
export const shouldFetchNextYear = (): boolean => {
  const fetchedYears = getFetchedYears();
  const nextYear = getCurrentYear() + 1;
  return isDecember() && !fetchedYears[nextYear];
};

/** Marks year's data as fetched */
export const markYearAsFetched = (year: number) => {
  const fetchedYears = getFetchedYears();
  store.set(fetchedYearsAtom, { ...fetchedYears, [year]: true });
};

/** Refreshes prayer data from API */
export const refresh = async () => {
  const currentDate = getDate();
  const standardSchedule = store.get(standardScheduleAtom);
  const today = TimeUtils.getDateTodayOrTomorrow(DaySelection.Today);
  const isInit = Object.keys(standardSchedule.today).length === 1;
  const currentYear = getCurrentYear();
  const needsNextYear = shouldFetchNextYear();

  if (currentDate === today && !isInit && !needsNextYear) {
    return logger.info('Data already up to date');
  }

  try {
    const currentYearData = await handle(currentYear);
    database.saveAll(currentYearData);
    markYearAsFetched(currentYear);

    if (needsNextYear) {
      const nextYearData = await handle(currentYear + 1);
      database.saveAll(nextYearData);
      markYearAsFetched(currentYear + 1);
    }

    logger.info('Prayer data fetched successfully');

    setSchedule(ScheduleType.Standard);
    setSchedule(ScheduleType.Extra);
    setDate();
  } catch (error) {
    logger.error({ error }, 'Failed to refresh prayer data');
    throw error;
  }
};
