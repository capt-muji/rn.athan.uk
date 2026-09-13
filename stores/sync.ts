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
import { type ISingleApiResponseTransformed, ScheduleType } from '@/shared/types';
import * as Countdown from '@/stores/countdown';
import * as Database from '@/stores/database';
import { lastNotificationScheduleAtom } from '@/stores/notifications';
import * as ScheduleStore from '@/stores/schedule';
import { resetStoredAtom } from '@/stores/storage';
import { handleAppUpgrade } from '@/stores/version';
import * as PrayerWidgets from '@/stores/widget';

// --- Atoms ---
// Startup defers the widget timeline push past first content (see sync options)
//
// `loadable` is deprecated in jotai 2.20.3 and is removed in v3, which is why a
// dev build logs "[DEPRECATED] loadable ..." once at startup. This is the only
// call site. The replacement is a userland wrapper around `unwrap`
// (https://github.com/pmndrs/jotai/pull/3217), so a jotai major upgrade has to
// bring that wrapper with it rather than expecting a drop-in.
export const syncLoadable = loadable(atom(async () => sync({ deferWidgetRefresh: true })));

// --- Helpers ---

// Check if we need to pre-fetch next year's data
// Returns true if it's December and we haven't yet fetched next year's data
const shouldFetchNextYear = (): boolean => {
  const fetchedYears = Database.getItem('fetched_years') || {};
  const nextYear = TimeUtils.getCurrentYear() + 1;
  return TimeUtils.isDecember() && !fetchedYears[nextYear];
};

/**
 * Whether today is a gap inside this year's latest download rather than past its end: the year is marked,
 * which even a download without today does, and a later day of it is stored. That day shows as dashes (R7).
 * Downloading again would bring the same answer on every launch, and offline would put the error screen,
 * whose Refresh wipes, over the days that are readable. An answer that stops before today was cut short
 * instead, and only asking again can bring the rest, so it is downloaded as before
 */
const isTodayGapInStoredYear = (): boolean => {
  const year = TimeUtils.getCurrentYear();
  if (!Database.getItem('fetched_years')?.[year]) return false;

  // Keys alone, so a year of days is not parsed only to learn that a later one exists. YYYY-MM-DD sorts as a date
  const todayKey = `prayer_${TimeUtils.getTodayDateString()}`;
  return Database.database.getAllKeys().some((key) => key.startsWith(`prayer_${year}-`) && key > todayKey);
};

/**
 * Reopens the 12-hour notification refresh gate, through the atom as `stores/version.ts` does
 *
 * A reschedule that ran before a download landed has already stamped the gate over the days it could find: the
 * post-paint refresh with today missing and tomorrow stored, or 1 January without 31 December. Days arriving
 * afterwards would stay unarmed until the gate reopened. Failing here costs only that wait, never stored times
 */
const reopenNotificationGate = () => {
  try {
    resetStoredAtom(lastNotificationScheduleAtom, 'preference_last_notification_schedule_check');
  } catch (error) {
    logger.warn('SYNC: Failed to reopen the notification refresh gate', { error });
  }
};

/** Bumped each time a download changes a day the lists or the alarms read */
let armedDayChanges = 0;

/**
 * How many downloads have changed a day from yesterday to today+2. A reschedule reads it before it reads the days,
 * and stamps the gate only if it has not moved since: days that landed while it ran were read too late, and a stamp
 * over the reopen would keep them unarmed for twelve hours
 */
export const getArmedDayChanges = (): number => armedDayChanges;

/** Yesterday to today+2 as stored: the days the lists and the alarms read */
const readArmedDays = () => {
  const today = TimeUtils.getTodayDateString();
  return [-1, 0, 1, 2].map((offset) => {
    const date = TimeUtils.addDaysToDateString(today, offset);
    return { date, record: Database.getPrayerByDateString(date) };
  });
};

const isSameRecord = (a: ISingleApiResponseTransformed | null, b: ISingleApiResponseTransformed | null) => {
  if (!a || !b) return a === b;
  // Every key either holds, so a stored day lacking one (an edited backup) differs from a download that has it
  const keys = Object.keys({ ...a, ...b }) as (keyof ISingleApiResponseTransformed)[];
  return keys.every((key) => a[key] === b[key]);
};

/**
 * Saves days a download brought, and reopens the gate when that changed a day the lists or the alarms read (see
 * reopenNotificationGate): one that was not stored, is no longer stored, or now holds other times. Next year's days
 * count too: on 31 December tomorrow's alarms come from them. A download repeating what those days hold changes no
 * alarm, and reopening for it would buy a full reschedule and widget push on every foreground, since December adds
 * an incomplete next year on each sync and a year cut short is asked for on each sync
 *
 * @param armedBefore Those days as they were before the caller's own wipe or clear, which would make each look new
 */
const saveDownloadedDays = (prayers: ISingleApiResponseTransformed[], armedBefore = readArmedDays()) => {
  Database.saveAllPrayers(prayers);
  if (armedBefore.every(({ date, record }) => isSameRecord(record, Database.getPrayerByDateString(date)))) return;

  armedDayChanges += 1;
  reopenNotificationGate();
};

/** Whether any of today to today+2, the days the lists are built from, is stored: the test bootstrap hydrates on */
const hasUsableDays = () => {
  const today = TimeUtils.getTodayDateString();
  return [0, 1, 2].some((offset) => Database.getPrayerByDateString(TimeUtils.addDaysToDateString(today, offset)));
};

// --- Actions ---
export const triggerSyncLoadable = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getDefaultStore } = require('jotai/vanilla');
  return getDefaultStore().get(syncLoadable);
};

/**
 * Rebuilds both lists after a day they read from has landed
 *
 * setSequence rebuilds the rows from storage, which is what gives 1 January's night rows their times, but it skips
 * a write whose rows are identical, as Standard's are when only 31 December arrives. The previous-prayer atoms
 * read the list before from storage without depending on it, so without a new sequence they keep a stale null and
 * the bar stays hidden until Fajr. refreshSequence always writes a new sequence, so they look again
 */
const rebuildSequences = () => {
  for (const type of [ScheduleType.Standard, ScheduleType.Extra]) {
    ScheduleStore.setSequence(type, TimeUtils.createInstant());
    ScheduleStore.refreshSequence(type);
  }
};

/** Whether a request for 31 December is still on its way */
let lastDayRequestPending = false;

/**
 * SCENARIO 1: 1 January without 31 December. The countdown bars need yesterday's last prayers, and the Extras
 * night leading into today starts at 31 December's Magrib. Asked by year, the endpoint serves only the current
 * year, so 31 December is asked for alone, by date. When neither answers, 1 January still shows with its night
 * rows unreadable, and the next sync asks again because the day is still missing
 *
 * Not awaited: React Native's Android HTTP client has no timeout, so a stalled request would hold the launch
 * spinner and the background task's re-arm for as long as it hangs. Today is already on screen when it is
 * asked for, and both lists are rebuilt if the day lands
 */
const fetchLastDayOfPreviousYear = () => {
  const previousYear = TimeUtils.getCurrentYear() - 1;
  const lastDayOfPreviousYear = `${previousYear}-12-31`;
  if (Database.getPrayerByDateString(lastDayOfPreviousYear)) return;

  // Each resume syncs, and without a timeout a hanging request would otherwise gain a twin on every one
  if (lastDayRequestPending) {
    logger.info('SYNC: Previous year Dec 31 already requested, waiting for that answer');
    return;
  }
  lastDayRequestPending = true;

  logger.info('SYNC: Jan 1 detected, fetching previous year Dec 31 data');

  // Takes its place in line as it begins, like a refresh, so an older download of last year landing later is dropped
  const order = ++refreshesBegun;

  Api.fetchDay(lastDayOfPreviousYear)
    .then(
      (fetchedDay) => {
        if ((newestDownloadOfYear.get(previousYear) ?? 0) > order) return;

        // Not `fetched_years`: one day is not a year, and a marker may only vouch for what is stored
        saveDownloadedDays([fetchedDay]);
        newestDownloadOfYear.set(previousYear, order);
        logger.info('SYNC: Previous year Dec 31 fetched and saved');
        rebuildSequences();
      },
      // A refusal and a failed fetch are the same to the owner, and neither may keep today off the screen
      (error: unknown) => logger.warn('SYNC: Previous year Dec 31 not available, will retry on next sync', { error })
    )
    // Nothing awaits the request, so a failure storing the day or rebuilding the lists has to end here
    .catch((error: unknown) => logger.error('SYNC: Failed to apply previous year Dec 31', { error }))
    .finally(() => {
      lastDayRequestPending = false;
    });
};

/**
 * Initialize or reinitialize the app's core state
 * 1. Sets up both standard and extra prayer sequences
 * 2. Starts the prayer time monitoring countdowns
 * 3. On 1 January without 31 December, asks for that day without waiting for it
 * 4. Pushes fresh data to the iOS widgets (failure-tolerant)
 *
 * @param date Current London date
 * @param deferWidgetRefresh Fire the widget push without awaiting it — the
 *   timeline build+push costs ~0.5s per schedule on the A12 and must not gate
 *   first content. Only the startup path may defer; the background-task body
 *   still awaits so iOS keeps the process alive until widgets are refreshed.
 */
const initializeAppState = async (date: Date, deferWidgetRefresh: boolean) => {
  // Initialize prayer sequences (prayer-centric model)
  // See: ai/adr/005-timing-system-overhaul.md
  ScheduleStore.setSequence(ScheduleType.Standard, date);
  ScheduleStore.setSequence(ScheduleType.Extra, date);

  Countdown.startCountdowns();

  if (TimeUtils.isJanuaryFirst(date)) fetchLastDayOfPreviousYear();

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
 * 1. APP_CONFIG.isDev — anything that is NOT a prod or preview build. It is
 *    keyed off EXPO_PUBLIC_ENV (shared/config.ts:2), and it is opt-OUT, not
 *    opt-in: leave the variable unset and isDev is true, so a bare local build
 *    refetches on every check. Only EXPO_PUBLIC_ENV=prod or =preview turns it
 *    off, which is what a shipped build gets.
 * 2. Today is not stored, unless it is only a gap inside this year's latest download (see isTodayGapInStoredYear)
 * 3. It's December and next year's data needs fetching
 */
const needsDataUpdate = (): boolean => {
  if (APP_CONFIG.isDev) return true;

  const now = TimeUtils.createInstant();
  const data = Database.getPrayerByDate(now);

  if (!data && !isTodayGapInStoredYear()) return true;

  const needNewYear = shouldFetchNextYear();
  if (needNewYear) return true;

  return false;
};

/**
 * Whether this year needs no download of its own: marked with today stored, or today only a gap inside its latest
 * answer. December then adds next year alone, so a phone offline keeps its days rather than getting the error
 * screen, whose Refresh wipes them
 */
const isCurrentYearCached = (): boolean => {
  const fetchedYears = Database.getItem('fetched_years') || {};
  const currentYear = TimeUtils.getCurrentYear();
  const now = TimeUtils.createInstant();
  const todayData = Database.getPrayerByDate(now);

  return (Boolean(fetchedYears[currentYear]) && Boolean(todayData)) || isTodayGapInStoredYear();
};

/** Taken as each refresh begins, so downloads can be ordered by when they were asked for */
let refreshesBegun = 0;

/**
 * The newest refresh whose download wiped the cache, and per year the newest whose download of that
 * year is stored. An older download never replaces a newer one: the later request holds the
 * provider's newer answer, and the older one could bring back days that answer no longer has
 */
let newestSwap = 0;
const newestDownloadOfYear = new Map<number, number>();

/**
 * Whether a download holds the day it needs to be trusted over what is stored: today in this year, or
 * 1 January in a year still to come. One without it is added, but never wipes or blocks another
 */
const holdsAnchorDay = (prayers: ISingleApiResponseTransformed[], year: number) => {
  const today = TimeUtils.getTodayDateString();
  const todaysYear = Number(today.slice(0, 4));
  if (year < todaysYear) return true;

  const anchor = year === todaysYear ? today : `${year}-01-01`;
  return prayers.some((day) => day.date === anchor);
};

/**
 * Stores a freshly fetched year: swapped in for the cache, added to it when it lacks today or a refresh
 * that began later has already swapped, or dropped when one that began later has already stored it
 *
 * Nothing in here awaits: the wipe and the saves are synchronous MMKV calls, so nothing can find
 * the cache empty between them, and a fetch that fails never gets this far to touch it
 *
 * @param prayers The year just fetched, validated and transformed
 * @param year The year those prayers belong to
 * @param order The refresh's place in line, from `refreshesBegun`
 */
const replacePrayerCache = (prayers: ISingleApiResponseTransformed[], year: number, order: number) => {
  if ((newestDownloadOfYear.get(year) ?? 0) > order) {
    logger.info('SYNC: A refresh that began later already stored this year, keeping its download', { year });
    return;
  }

  // Read before the wipe, which would make every day the alarms read look new
  const armedBefore = readArmedDays();
  const trusted = holdsAnchorDay(prayers, year);

  if (trusted && newestSwap < order) {
    // Yesterday is carried across the wipe: the countdown bar and the Extras night leading into
    // today both read it, and on 1 January it belongs to last year, which would be downloaded again
    const today = TimeUtils.getTodayDateString();
    const yesterday = TimeUtils.getPreviousDateString(today);
    const yesterdayData = Database.getPrayerByDateString(yesterday);

    // Not `fetched_years`: a marker may only vouch for days that are actually stored. Kept
    // through the wipe, it would still claim next year after its days were gone, and December
    // would stop retrying them. It is written back below for the year being saved
    Database.clearAllExcept([
      'app_installed_version',
      'whats_new_shown_version',
      // Losing this marker reads as "cache of unknown shape" on the next upgrade, which
      // buys an unnecessary wipe, the opposite of what a full refresh just achieved
      'cache_schema_version',
      'preference_',
      // Names and fonts never change, and measuring the widths again visibly reflows the prayer list
      'prayer_max_english_width_',
      // Alarm records describe what the OS has armed, which a new timetable does not change. A
      // reschedule still writing them as the download lands would lose them, and its sweep would
      // then cancel those alarms
      'scheduled_notifications_',
      'scheduled_reminders_',
    ]);

    if (yesterdayData) Database.saveAllPrayers([yesterdayData]);
    // The wipe took every other year's days, so an entry left for one would drop a download holding its
    // only copy. The caller puts next year back, and yesterday's year keeps the day it needs
    const carriedYear = yesterdayData ? Number(yesterday.slice(0, 4)) : undefined;
    for (const storedYear of [...newestDownloadOfYear.keys()]) {
      if (storedYear !== year + 1 && storedYear !== carriedYear) newestDownloadOfYear.delete(storedYear);
    }
    newestSwap = order;
  } else {
    logger.info('SYNC: Adding this download without a wipe', { year, holdsToday: trusted });
  }

  saveDownloadedDays(prayers, armedBefore);
  Database.markYearAsFetched(year);
  if (trusted) newestDownloadOfYear.set(year, order);
};

/** Read before a swap, whose wipe takes next year's days and marker along with this year's */
const readStoredYear = (year: number) => {
  const days: ISingleApiResponseTransformed[] = Database.getAllWithPrefix(`prayer_${year}-`);
  // The marker stops December downloading the year, so it only goes back when 1 January is stored
  const marked = Boolean(Database.getItem('fetched_years')?.[year]) && days.some((day) => day.date === `${year}-01-01`);
  return { days, marked };
};

/** A marker may only vouch for days that are actually stored, so it goes back with them or not at all */
const restoreStoredYear = (year: number, stored: ReturnType<typeof readStoredYear>) => {
  if (stored.days.length === 0) return;

  Database.saveAllPrayers(stored.days);
  if (stored.marked) Database.markYearAsFetched(year);
};

/**
 * Stores next year unless a refresh that began later already has, clearing what an older download
 * left first, so a day the newer answer lacks cannot survive from the older one. A download without
 * 1 January stores nothing here: the caller adds it on top of what is kept, unmarked, so December asks again
 */
const storeNextYear = (prayers: ISingleApiResponseTransformed[], year: number, order: number) => {
  if ((newestDownloadOfYear.get(year) ?? 0) > order) return 'dropped';
  if (!holdsAnchorDay(prayers, year)) return 'incomplete';

  // Read before the clear, which would make next year's days the alarms read look new
  const armedBefore = readArmedDays();
  Database.clearPrefix(`prayer_${year}-`);
  saveDownloadedDays(prayers, armedBefore);
  Database.markYearAsFetched(year);
  newestDownloadOfYear.set(year, order);
  return 'stored';
};

/**
 * Fetches and stores new prayer time data
 * 1. Fetches current year (and optionally next year) data
 * 2. Swaps the current year into the cache once it has arrived, except in scenario 3a, which only adds next year
 * 3. Marks years as fetched
 */
const updatePrayerData = async () => {
  logger.info('SYNC: Starting data refresh');
  const order = ++refreshesBegun;

  try {
    const currentYear = TimeUtils.getCurrentYear();

    // SCENARIO 3a: December, current year already cached - fetch next year only
    // Keeps cache intact: no wipe, no current-year refetch on every December retry
    // while the next year dataset is not yet published on the API
    if (shouldFetchNextYear() && isCurrentYearCached()) {
      const nextYear = currentYear + 1;

      try {
        const nextYearData = await Api.fetchYear(nextYear);

        const outcome = storeNextYear(nextYearData, nextYear, order);
        if (outcome === 'incomplete') saveDownloadedDays(nextYearData);

        logger.info('SYNC: Data refresh complete (next year only)', { nextYear, outcome });
      } catch (error) {
        logger.warn('SYNC: Next year data not yet available, will retry on next sync', { nextYear, error });
      }

      return;
    }

    // SCENARIO 3b: December, current year not cached - Proactively fetch current year + next year
    // Next year may not be published yet, so its failure must not block this year's swap. The swap
    // takes next year's days too, so this branch runs whenever it is December and puts them back
    if (TimeUtils.isDecember()) {
      const nextYear = currentYear + 1;

      const [currentYearResult, nextYearResult] = await Promise.allSettled([
        Api.fetchYear(currentYear),
        Api.fetchYear(nextYear),
      ]);

      if (currentYearResult.status === 'rejected') throw currentYearResult.reason;

      // Read before the wipe takes them, so next year keeps what was stored when its own download fails
      // or a refresh that began later has already stored a newer one
      const storedNextYear = readStoredYear(nextYear);

      replacePrayerCache(currentYearResult.value, currentYear, order);

      const ownNextYear = nextYearResult.status === 'fulfilled' ? nextYearResult.value : [];
      const outcome = nextYearResult.status === 'fulfilled' ? storeNextYear(ownNextYear, nextYear, order) : 'failed';
      if (outcome !== 'stored') restoreStoredYear(nextYear, storedNextYear);
      // Added after what was kept, so the days this incomplete download does have are the newer ones
      if (outcome === 'incomplete') saveDownloadedDays(ownNextYear);

      if (nextYearResult.status === 'rejected') {
        logger.warn('SYNC: Next year data not yet available, will retry on next sync', {
          nextYear,
          error: nextYearResult.reason,
        });
      }

      logger.info('SYNC: Data refresh complete (current + next year)', { currentYear, nextYear });
    }
    // SCENARIO 2: Standard sync - Fetch current year only
    else {
      const data = await Api.fetchYear(currentYear);

      // A download that began in November can land after December has stored next year, and a wipe
      // would take those days with it
      const storedNextYear = readStoredYear(currentYear + 1);

      replacePrayerCache(data, currentYear, order);
      restoreStoredYear(currentYear + 1, storedNextYear);

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
 * 3. Fetches new data if required, carrying on when that fails while today to today+2 still has a stored day
 * 4. Initializes app state with current date
 *
 * @param options.deferWidgetRefresh Don't block completion on the iOS widget
 *   timeline push (startup only — the background task must await it)
 */
export const sync = async (options: { deferWidgetRefresh?: boolean } = {}) => {
  try {
    handleAppUpgrade();

    if (needsDataUpdate()) {
      try {
        await updatePrayerData();
      } catch (error) {
        // Only a launch with nothing usable stored may reach the error screen (DASHES-DESIGN §9): its Refresh wipes,
        // and the lists bootstrap already showed would go with it. The next sync asks again for what is missing
        if (!hasUsableDays()) throw error;
        logger.warn('SYNC: Refresh failed, showing the days already stored', { error });
      }
    } else logger.info('SYNC: Data already up to date');

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
