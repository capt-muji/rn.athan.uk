/**
 * Sync layer - App initialization
 *
 * Prayer days are baked into the binary (stores/timetable.ts): there is no
 * fetch, no year marker, no gap rule, no December rollover and no 31-December
 * day fetch any more. What remains of a sync is the upgrade bookkeeping, the
 * wait for the timetable to be ready to serve (a first-ever launch stages the
 * artifact bytes; every later launch reads them synchronously), and the app
 * state initialisation that has always followed it.
 *
 */

import { type Atom, atom } from 'jotai';
import { unwrap } from 'jotai/utils';

import logger from '@/shared/logger';
import { perfMark, perfMeasure } from '@/shared/perf';
import * as TimeUtils from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import * as Countdown from '@/stores/countdown';
import * as ScheduleStore from '@/stores/schedule';
import * as Timetable from '@/stores/timetable';
import { handleAppUpgrade } from '@/stores/version';
import * as PrayerWidgets from '@/stores/widget';

/** The three states a consumer reads off `syncLoadable`, as jotai 2's `loadable` reported them */
type Loadable<Value> =
  | { state: 'loading' }
  | { state: 'hasError'; error: unknown }
  | { state: 'hasData'; data: Awaited<Value> };

// jotai 3 deleted `loadable`; this is the replacement its deprecation notice gives (pmndrs/jotai#3217).
// The sentinel is compared by identity because a resolved value can itself be undefined.
const loadable = <Value>(anAtom: Atom<Value>): Atom<Loadable<Value>> => {
  const LOADING: Loadable<Value> = { state: 'loading' };
  const unwrapped = unwrap(anAtom, () => LOADING as never);

  return atom((get) => {
    try {
      const data = get(unwrapped);
      return data === LOADING ? LOADING : { state: 'hasData', data: data as Awaited<Value> };
    } catch (error) {
      return { state: 'hasError', error };
    }
  });
};

// --- Atoms ---
// Startup defers the widget timeline push past first content (see sync options)
export const syncLoadable = loadable(atom(async () => sync({ deferWidgetRefresh: true })));

// --- Helpers ---

/** Whether any of today to today+2, the days the lists are built from, is readable: the check stores/bootstrap.ts hydrates on */
const hasUsableDays = () => {
  const today = TimeUtils.getTodayDateString();
  try {
    return [0, 1, 2].some((offset) => Boolean(Timetable.getTimetableDay(TimeUtils.addDaysToDateString(today, offset))));
  } catch (error) {
    // A read that fails cannot prove the timetable empty, and every failure gate below answers through here: treating the
    // days as usable keeps a storage hiccup from turning into the error screen over days that may be readable
    logger.warn('SYNC: Could not read which days are readable, treating them as usable', { error });
    return true;
  }
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
 * 3. Pushes fresh data to the iOS widgets
 *
 * Every step is failure-tolerant over readable days: a failure is warned and the launch keeps its
 * data, and only the sequence and countdown rebuilds still throw on a launch with nothing usable
 * stored, where the error screen is the honest landing.
 *
 * @param date Current London date
 * @param deferWidgetRefresh Fire the widget push without awaiting it — the
 *   timeline build+push costs ~0.5s per schedule on the A12 and must not gate
 *   first content. Only the startup path may defer; the background-task body
 *   still awaits so iOS keeps the process alive until widgets are refreshed.
 */
/**
 * The deferred widget push both reschedule paths share: the timeline build
 * saturates the JS thread, so the push lands past the next paint (rAF plus a
 * macrotask hop), and a failed push costs a stale widget, never a crash
 */
export const deferPrayerWidgetRefresh = (): void => {
  requestAnimationFrame(() => {
    setTimeout(() => {
      perfMark('widget_push_start');
      PrayerWidgets.refreshPrayerWidgets()
        .catch((error) => {
          logger.warn('WIDGET: Deferred push failed', { error });
        })
        .finally(() => {
          perfMeasure('widget_push', 'widget_push_start');
        });
    }, 0);
  });
};

const initializeAppState = async (date: Date, deferWidgetRefresh: boolean) => {
  // Initialize prayer sequences (prayer-centric model). A rebuild that fails must not cost the launch its readable
  // days: stores/bootstrap.ts has already hydrated the lists, so the screen keeps what it has and the next sync
  // rebuilds again. With nothing readable the throw stands, keeping the error screen the honest first-install landing
  for (const type of [ScheduleType.Standard, ScheduleType.Extra]) {
    try {
      ScheduleStore.setSequence(type, date);
    } catch (error) {
      if (!hasUsableDays()) throw error;
      logger.warn('SYNC: Failed to rebuild a sequence, showing the days already readable', { type, error });
    }
  }

  try {
    Countdown.startCountdowns();
  } catch (error) {
    if (!hasUsableDays()) throw error;
    logger.warn('SYNC: Failed to start the countdowns, showing the days already readable', { error });
  }

  // Push fresh data to the iOS widgets (no-op off iOS, failure-tolerant).
  // Deferred path: see deferPrayerWidgetRefresh above.
  // Deferred path needs the explicit catch: an unhandled rejection here would
  // crash the app after syncLoadable has already resolved (nothing awaits it).
  // A plain fire-and-forget still contends with the first content render —
  // the timeline build saturates the JS thread for ~0.5s per schedule, so the
  // defer must land past the first paint (rAF + setTimeout macrotask hop)
  if (deferWidgetRefresh) {
    deferPrayerWidgetRefresh();
  } else {
    // A failed push costs a stale widget until the next one, never a failed sync over readable days
    try {
      await PrayerWidgets.refreshPrayerWidgets();
    } catch (error) {
      logger.warn('WIDGET: Awaited refresh failed', { error });
    }
  }
};

/**
 * Main synchronization function - App entry point
 * Flow:
 * 1. Checks for app upgrade and clears cache if needed
 * 2. Waits for the baked timetable to be ready to serve
 * 3. Initializes app state with current date
 *
 * Every step carries step 2's rule: over readable days a failure is caught and warned, never thrown to the
 * error screen whose Refresh would wipe those days.
 *
 * @param options.deferWidgetRefresh Don't block completion on the iOS widget
 *   timeline push (startup only — the background task must await it)
 */
export const sync = async (options: { deferWidgetRefresh?: boolean } = {}) => {
  try {
    // Both checks carry the same rule as a failed readiness below: nothing they can throw costs the days already
    // readable, and with nothing readable the error screen stays the honest landing (its Refresh wipes)
    try {
      handleAppUpgrade();
    } catch (error) {
      if (!hasUsableDays()) throw error;
      logger.warn('SYNC: Upgrade check failed, showing the days already readable', { error });
    }

    try {
      // In a dev or test build this also reseeds the launch-relative mock window for this sync run
      await Timetable.ensureTimetableReady();
    } catch (error) {
      // Only a launch with nothing readable may reach the error screen (session 3 dashes rules §9): its Refresh wipes.
      // The next sync asks the artifact to stage again
      if (!hasUsableDays()) throw error;
      logger.warn('SYNC: The baked timetable is not readable, showing the days already readable', { error });
    }

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
