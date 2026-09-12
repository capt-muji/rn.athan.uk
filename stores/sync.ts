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
import * as PrayerWidgets from '@/stores/widget';

// --- Atoms ---
// Startup defers the widget timeline push past first content (see sync options)
export const syncLoadable = loadable(atom(async () => sync({ deferWidgetRefresh: true })));

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
 * 3. Pushes fresh data to the iOS widgets (failure-tolerant)
 *
 * @param date Current London date
 * @param deferWidgetRefresh Fire the widget push without awaiting it — the
 *   timeline build+push costs ~0.5s per schedule on the A12 and must not gate
 *   first content. Only the startup path may defer; the background-task body
 *   still awaits so iOS keeps the process alive until widgets are refreshed.
 */
const initializeAppState = async (date: Date, deferWidgetRefresh: boolean) => {
  // SCENARIO 1: January 1st - Fetch previous year's Dec 31 data
  // This is MANDATORY - CountdownBar needs yesterday's final prayer to calculate
  // progress, and the Extras night leading into Jan 1 starts at Dec 31's Magrib
  if (TimeUtils.isJanuaryFirst(date)) {
    const previousYear = TimeUtils.getCurrentYear() - 1;
    const cachedPrevYearData = Database.getPrayerByDateString(`${previousYear}-12-31`);

    if (!cachedPrevYearData) {
      logger.info('SYNC: Jan 1 detected, fetching previous year Dec 31 data');

      const fetchedPrevYearData = await Api.fetchYear(previousYear);
      Database.saveAllPrayers(fetchedPrevYearData);
      Database.markYearAsFetched(previousYear);

      logger.info('SYNC: Previous year data fetched and saved');
    }
  }

  // Initialize prayer sequences (prayer-centric model)
  // See: ai/adr/005-timing-system-overhaul.md
  ScheduleStore.setSequence(ScheduleType.Standard, date);
  ScheduleStore.setSequence(ScheduleType.Extra, date);

  Countdown.startCountdowns();

  // Push fresh data to the iOS widgets (no-op off iOS, failure-tolerant).
  // Deferred path needs the explicit catch: an unhandled rejection here would
  // crash the app after syncLoadable has already resolved (nothing awaits it).
  // A plain fire-and-forget still contends with the first content render —
  // the timeline build saturates the JS thread for ~0.5s per schedule, so the
  // defer must land past the first paint (rAF + setTimeout macrotask hop)
  if (deferWidgetRefresh) {
    requestAnimationFrame(() => {
      setTimeout(() => {
        PrayerWidgets.refreshPrayerWidgets().catch((error) => {
          logger.warn('WIDGET: Deferred refresh failed', { error });
        });
      }, 0);
    });
  } else {
    await PrayerWidgets.refreshPrayerWidgets();
  }
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

  const now = TimeUtils.createInstant();
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
  const now = TimeUtils.createInstant();
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

    // Clear prayer cache but preserve app version, What's New tracker, user
    // preferences, and the cached prayer-name column widths (constants —
    // deleting them forces a remeasure that visibly reflows the prayer list).
    // Yesterday's record is carried across the wipe: the countdown bar and the
    // Extras night leading into today both read it, and on Jan 1 it belongs to
    // last year's dataset, which would otherwise be downloaded again in full
    // for that one day (ISSUES #4)
    const today = TimeUtils.getTodayDateString();
    const yesterday = TimeUtils.getPreviousDateString(today);
    const yesterdayData = Database.getPrayerByDateString(yesterday);

    Database.clearAllExcept([
      'app_installed_version',
      'whats_new_shown_version',
      'preference_',
      'prayer_max_english_width_',
    ]);

    if (yesterdayData) Database.saveAllPrayers([yesterdayData]);

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
 *
 * @param options.deferWidgetRefresh Don't block completion on the iOS widget
 *   timeline push (startup only — the background task must await it)
 */
export const sync = async (options: { deferWidgetRefresh?: boolean } = {}) => {
  try {
    handleAppUpgrade();

    if (needsDataUpdate()) await updatePrayerData();
    else logger.info('SYNC: Data already up to date');

    const date = TimeUtils.createInstant();

    // Awaited so callers (and syncLoadable) see completion only after the
    // app state is fully initialized; the widget push defers past first
    // content on the startup path (a fire-and-forget without the explicit
    // catch in initializeAppState previously surfaced push errors as
    // unhandled rejections)
    await initializeAppState(date, options.deferWidgetRefresh === true);
  } catch (error) {
    logger.error('SYNC: Failed', { error });
    throw error;
  }
};
