/**
 * Sync layer - App initialization and data fetching
 * Uses the prayer-centric sequence model
 *
 * @see ai/adr/005-timing-system-overhaul.md
 */

import { atom } from 'jotai';
import { loadable } from 'jotai/utils';

import * as Api from '@/api/client';
import { APP_CONFIG } from '@/shared/config';
import logger from '@/shared/logger';
import * as TimeUtils from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import * as Countdown from '@/stores/countdown';
import * as Database from '@/stores/database';
import * as ScheduleStore from '@/stores/schedule';
import { handleAppUpgrade } from '@/stores/version';

// --- Atoms ---
export const syncLoadable = loadable(atom(async () => sync()));

// --- Helpers ---

// Check if we need to pre-fetch next year's data
// Returns true if it's December and we haven't yet fetched next year's data
const shouldFetchNextYear = (): boolean => {
  const fetchedYears = Database.getItem('fetched_years') || {};
  const nextYear = TimeUtils.getCurrentYear() + 1;
  return TimeUtils.isDecember() && !fetchedYears[nextYear];
};

// --- Actions ---
export const triggerSyncLoadable = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getDefaultStore } = require('jotai/vanilla');
  return getDefaultStore().get(syncLoadable);
};

/**
 * Initialize or reinitialize the app's core state
 * 1. Sets up both standard and extra prayer sequences
 * 2. Starts the prayer time monitoring countdowns
 */
const initializeAppState = async (date: Date) => {
  // SCENARIO 1: January 1st - Fetch previous year's Dec 31 data for CountdownBar
  // This is MANDATORY - CountdownBar needs yesterday's Isha time to calculate progress
  if (TimeUtils.isJanuaryFirst(date)) {
    const prevYearLastDate = new Date(date.getFullYear() - 1, 11, 31);
    const cachedPrevYearData = Database.getPrayerByDate(prevYearLastDate);

    if (!cachedPrevYearData) {
      logger.info('SYNC: Jan 1 detected, fetching previous year Dec 31 data');

      const fetchedPrevYearData = await Api.fetchYear(date.getFullYear() - 1);
      Database.saveAllPrayers(fetchedPrevYearData);
      Database.markYearAsFetched(date.getFullYear() - 1);

      logger.info('SYNC: Previous year data fetched and saved');
    }
  }

  // Initialize prayer sequences (prayer-centric model)
  // See: ai/adr/005-timing-system-overhaul.md
  ScheduleStore.setSequence(ScheduleType.Standard, date);
  ScheduleStore.setSequence(ScheduleType.Extra, date);

  Countdown.startCountdowns();
};

/**
 * Determines if the app needs to fetch fresh prayer time data
 * Returns true if:
 * 1. Dev mode is enabled (EXPO_PUBLIC_DEV_MODE=true)
 * 2. Schedule is empty (no data for today)
 * 3. It's December and next year's data needs fetching
 */
const needsDataUpdate = (): boolean => {
  if (APP_CONFIG.isDev) return true;

  const now = TimeUtils.createLondonDate();
  const data = Database.getPrayerByDate(now);

  if (!data) return true;

  const needNewYear = shouldFetchNextYear();
  if (needNewYear) return true;

  return false;
};

/**
 * Fetches and stores new prayer time data
 * 1. Cleans up old data
 * 2. Fetches current year (and optionally next year) data
 * 3. Saves data to local storage and marks years as fetched
 */
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

/**
 * Main synchronization function - App entry point
 * Flow:
 * 1. Checks for app upgrade and clears cache if needed
 * 2. Checks if data update is needed
 * 3. Fetches new data if required
 * 4. Initializes app state with current date
 */
export const sync = async () => {
  try {
    handleAppUpgrade();

    if (true || needsDataUpdate()) await updatePrayerData();
    else logger.info('SYNC: Data already up to date');

    const date = TimeUtils.createLondonDate();

    initializeAppState(date);
  } catch (error) {
    logger.error('SYNC: Failed', { error });
    throw error;
  }
};
