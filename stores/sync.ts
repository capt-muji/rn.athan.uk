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

// Check if the current year's data is already fetched and cached
const isCurrentYearCached = (): boolean => {
  const fetchedYears = Database.getItem('fetched_years') || {};
  const currentYear = TimeUtils.getCurrentYear();
  const now = TimeUtils.createLondonDate();
  const todayData = Database.getPrayerByDate(now);

  return Boolean(fetchedYears[currentYear]) && Boolean(todayData);
};

/**
 * Fetches and stores new prayer time data
 * 1. Cleans up old data (skipped when current year is already cached)
 * 2. Fetches current year (and optionally next year) data
 * 3. Saves data to local storage and marks years as fetched
 */
const updatePrayerData = async () => {
  logger.info('SYNC: Starting data refresh');

  try {
    // SCENARIO 3a: December, current year already cached - fetch next year only
    // Keeps cache intact: no wipe, no current-year refetch on every December retry
    // while the next year dataset is not yet published on the API
    if (shouldFetchNextYear() && isCurrentYearCached()) {
      const currentYear = TimeUtils.getCurrentYear();
      const nextYear = currentYear + 1;

      try {
        const nextYearData = await Api.fetchYear(nextYear);

        Database.saveAllPrayers(nextYearData);
        Database.markYearAsFetched(nextYear);

        logger.info('SYNC: Data refresh complete (next year only)', { nextYear });
      } catch (error) {
        logger.warn('SYNC: Next year data not yet available, will retry on next sync', { nextYear, error });
      }

      return;
    }

    // Clear prayer cache but preserve app version and user preferences
    Database.clearAllExcept(['app_installed_version', 'preference_']);

    // SCENARIO 3b: December, current year not cached - Proactively fetch current year + next year
    // Years settle independently: next year may not be populated on the API yet
    // (empty dataset), which must not prevent the current year from being saved
    if (shouldFetchNextYear()) {
      const currentYear = TimeUtils.getCurrentYear();
      const nextYear = currentYear + 1;

      const [currentYearResult, nextYearResult] = await Promise.allSettled([
        Api.fetchYear(currentYear),
        Api.fetchYear(nextYear),
      ]);

      if (currentYearResult.status === 'fulfilled') {
        Database.saveAllPrayers(currentYearResult.value);
        Database.markYearAsFetched(currentYear);
      }

      if (nextYearResult.status === 'fulfilled') {
        Database.saveAllPrayers(nextYearResult.value);
        Database.markYearAsFetched(nextYear);
      } else {
        logger.warn('SYNC: Next year data not yet available, will retry on next sync', {
          nextYear,
          error: nextYearResult.reason,
        });
      }

      if (currentYearResult.status === 'rejected') throw currentYearResult.reason;

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

    if (needsDataUpdate()) await updatePrayerData();
    else logger.info('SYNC: Data already up to date');

    const date = TimeUtils.createLondonDate();

    initializeAppState(date);
  } catch (error) {
    logger.error('SYNC: Failed', { error });
    throw error;
  }
};
