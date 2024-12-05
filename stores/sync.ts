import { atom } from 'jotai';
import { atomWithStorage, loadable } from 'jotai/utils';
import { getDefaultStore } from 'jotai/vanilla';

import * as Api from '@/api/client';
import { PRAYER_INDEX_ASR } from '@/shared/constants';
import logger from '@/shared/logger';
import * as TimeUtils from '@/shared/time';
import * as Types from '@/shared/types';
import * as Countdown from '@/stores/countdown';
import * as Database from '@/stores/database';
import * as ScheduleStore from '@/stores/schedule';

const store = getDefaultStore();

// TODO: Remove below check
Database.clearPrefix('prayer_');
Database.clearPrefix('fetched_years');
Database.clearPrefix('display_date');
// TODO: Remove above check

// --- Atoms ---

export const dateAtom = atomWithStorage<string>('display_date', '', Database.mmkvStorage, { getOnInit: true });

export const syncLoadable = loadable(atom(async () => sync()));

// --- Actions ---

const setDate = () => {
  const schedule = store.get(ScheduleStore.standardScheduleAtom);
  const currentDate = schedule.today[PRAYER_INDEX_ASR].date;

  store.set(dateAtom, currentDate);
};

const shouldFetchNextYear = (): boolean => {
  const fetchedYears = Database.getItem('fetched_years') || {};
  const nextYear = TimeUtils.getCurrentYear() + 1;
  return TimeUtils.isDecember() && !fetchedYears[nextYear];
};

const initializeAppState = () => {
  ScheduleStore.setSchedule(Types.ScheduleType.Standard);
  ScheduleStore.setSchedule(Types.ScheduleType.Extra);
  setDate();
  Countdown.startCountdowns();
};

const needsDataUpdate = (): boolean => {
  const dateSaved = store.get(dateAtom);
  const standardSchedule = store.get(ScheduleStore.standardScheduleAtom);
  const dateNow = TimeUtils.getDateTodayOrTomorrow(Types.DaySelection.Today);

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

    initializeAppState();
  } catch (error) {
    logger.error('SYNC: Failed', { error });
    throw error;
  }
};
