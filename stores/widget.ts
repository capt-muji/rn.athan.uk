/**
 * Widget IO layer - pushes iOS home screen and Lock Screen widget timelines
 * for BOTH schedules and BOTH home themes. Each home kind is size-exclusive
 * (small and medium register separately so the gallery groups smalls before
 * mediums), and every kind receives its own schedule- and theme-stamped
 * timeline: the standard light trio (PrayerWidget + PrayerWidgetMedium +
 * PrayerLockWidget), the standard dark pair (PrayerWidgetDark +
 * PrayerWidgetDarkMedium), the extras light trio (ExtrasWidget +
 * ExtrasWidgetMedium + ExtrasLockWidget), and the extras dark pair
 * (ExtrasWidgetDark + ExtrasWidgetDarkMedium).
 *
 * Reads the cached prayer data and the user's widget-relevant preferences,
 * builds one timeline per schedule AND theme with the pure builder in
 * shared/widgetTimeline.ts, and pushes each to its widgets via
 * expo-widgets. A widget's theme is fixed at placement (the gallery's
 * Light/Dark kinds) — it never follows the system appearance. WidgetKit
 * renders each entry at its own date.
 *
 * While the app runs, PER-SCHEDULE label-flip schedulers re-push at each
 * countdown target's minute change: a standard flip re-pushes only the five
 * standard kinds, an extras flip only the five extras kinds (each schedule
 * pushes independently — one failing or empty schedule never blocks the
 * other; see ISSUES.md §G.1 for the render-cost context). Flip pushes
 * reuse a cached multi-day prayer sequence, so the per-minute pushes never
 * re-read the prayer DB — only data- or settings-driven refreshes do.
 *
 * @see shared/widgetTimeline.ts - pure timeline builder
 * @see widgets/PrayerWidget.tsx - home screen widget layouts (both schedules)
 * @see widgets/LockPrayerWidget.tsx - Lock Screen widget layouts (both schedules)
 */

import { getDefaultStore } from 'jotai';
import { Platform } from 'react-native';

import { FEATURE_FLAGS } from '@/shared/flags';
import logger from '@/shared/logger';
import * as PrayerUtils from '@/shared/prayer';
import * as TimeUtils from '@/shared/time';
import { type PrayerSequence, ScheduleType } from '@/shared/types';
import { buildPrayerWidgetTimeline } from '@/shared/widgetTimeline';
import type { PrayerWidgetSettings } from '@/shared/widgetTypes';
import { hijriDateEnabledAtom } from '@/stores/ui';

// Widget layout modules are required LAZILY inside the iOS-only push paths:
// their evaluation registers the layouts (a side effect) and pulls in
// @expo/ui, which only the iOS widget runtime needs. A synchronous require
// keeps everything in the main bundle (the widget Babel transform still
// applies at build time — the ERR_ARGUMENT_CAST invariant bans async dynamic
// import chunks, not deferred sync requires) while Android never evaluates
// ~170 modules of dead widget code at launch.
type HomeWidgets = typeof import('@/widgets/PrayerWidget');
type LockWidgets = typeof import('@/widgets/LockPrayerWidget');

let homeWidgets: HomeWidgets | null = null;
let lockWidgets: LockWidgets | null = null;

const getHomeWidgets = (): HomeWidgets => {
  const cached = homeWidgets;
  if (cached) return cached;
  const loaded = require('@/widgets/PrayerWidget') as HomeWidgets;
  homeWidgets = loaded;
  return loaded;
};

const getLockWidgets = (): LockWidgets => {
  const cached = lockWidgets;
  if (cached) return cached;
  const loaded = require('@/widgets/LockPrayerWidget') as LockWidgets;
  lockWidgets = loaded;
  return loaded;
};

/** Days of prayer boundaries scheduled ahead — the widget re-reads this
 *  stored timeline when it runs out, so this is how long the widget stays
 *  correct without the app opening. */
const TIMELINE_DAYS = 14;

/**
 * Reads the slice of in-app settings the widgets mirror. The widget has no
 * configuration of its own; adding a widget-visible setting means adding a
 * field here, on PrayerWidgetSettings, and honoring it in the layouts.
 */
export const readWidgetSettings = (): PrayerWidgetSettings => {
  const store = getDefaultStore();

  return {
    hijriDate: store.get(hijriDateEnabledAtom),
  };
};

/** Debounce for settings-driven pushes: batches a burst of preference changes
 *  (color picker drag, toggles) into a single timeline push. */
const SETTINGS_PUSH_DEBOUNCE_MS = 1000;

/** Epsilon after a countdown minute flip before re-pushing, so the push lands
 *  cleanly on the new minute rather than racing the boundary instant. */
const LABEL_FLIP_EPSILON_MS = 250;

/** Re-arm delay for a push that yielded no countdown target to flip on (a
 *  native throw, an empty build, or a boundary crossed mid-push). A minute
 *  matches the healthy cadence, so a recovered push resumes in step. */
const FLIP_RETRY_MS = 60_000;

let settingsPushTimer: ReturnType<typeof setTimeout> | null = null;
let settingsSyncInitialized = false;

/** One label-flip timer per schedule — each schedule's label flips on its own
 *  countdown target, so each re-pushes independently of the other. */
const flipPushTimers: { [schedule in ScheduleType]: ReturnType<typeof setTimeout> | null } = {
  [ScheduleType.Standard]: null,
  [ScheduleType.Extra]: null,
};

interface CachedSequence {
  key: string;
  sequence: PrayerSequence;
}

/**
 * Cache of the multi-day prayer sequences, keyed by the London wall date of
 * the sequence's start (yesterday). Label-flip pushes fire every minute while
 * the app runs and only the head entry's label changes, so they reuse this
 * cache instead of re-reading ~30 days of MMKV records and re-running the
 * timezone math each time. Invalidation is by construction: the date key
 * rolls over at London midnight, and every full refresh (data sync,
 * notification reschedule, settings change) rebuilds before caching — so a
 * wipe or data change can never serve a stale sequence.
 */
const sequenceCache: { [schedule in ScheduleType]: CachedSequence | null } = {
  [ScheduleType.Standard]: null,
  [ScheduleType.Extra]: null,
};

const sequenceCacheKey = (startDate: Date): string => TimeUtils.formatDateShort(startDate);

const rebuildSequence = (schedule: ScheduleType, startDate: Date): PrayerSequence => {
  const sequence = PrayerUtils.createPrayerSequence(schedule, startDate, TIMELINE_DAYS + 1);
  sequenceCache[schedule] = { key: sequenceCacheKey(startDate), sequence };
  return sequence;
};

const sequenceFor = (schedule: ScheduleType, startDate: Date): PrayerSequence => {
  const cached = sequenceCache[schedule];
  const key = sequenceCacheKey(startDate);
  if (cached?.key === key) {
    return cached.sequence;
  }
  return rebuildSequence(schedule, startDate);
};

/**
 * Keeps the widgets aligned with in-app settings: any change to a
 * widget-visible preference re-pushes the timeline (debounced), so widgets
 * follow the app while it is in the foreground instead of waiting for the
 * next sync. Idempotent; no-op off iOS.
 */
export const initWidgetSettingsSync = (): void => {
  if (settingsSyncInitialized || Platform.OS !== 'ios' || !FEATURE_FLAGS.widgets) return;
  settingsSyncInitialized = true;

  const store = getDefaultStore();
  const schedulePush = () => {
    if (settingsPushTimer !== null) clearTimeout(settingsPushTimer);
    settingsPushTimer = setTimeout(() => {
      settingsPushTimer = null;
      void refreshPrayerWidgets();
    }, SETTINGS_PUSH_DEBOUNCE_MS);
  };

  store.sub(hijriDateEnabledAtom, schedulePush);
};

/**
 * Milliseconds until a countdown target's next minute flip (plus a small
 * epsilon so the push lands cleanly on the new minute rather than racing
 * the boundary instant), or null when the target has already passed.
 */
const msUntilMinuteFlip = (targetEpochMs: number): number | null => {
  const msRemaining = targetEpochMs - Date.now();
  if (msRemaining <= 0) return null;

  const msIntoMinute = msRemaining % 60000;
  return (msIntoMinute === 0 ? 60000 : msIntoMinute) + LABEL_FLIP_EPSILON_MS;
};

/**
 * Arms ONE schedule's label-flip push: the minute-ceil label changes exactly
 * when the remaining time crosses a whole minute, so each push re-arms at
 * that schedule's next flip — its widget re-renders within a quarter second
 * of every true minute change on its own countdown. Re-arms from fresh data
 * on every push; a suspended (backgrounded) timer coalesces into one fire on
 * foreground, which doubles as a refresh when the user returns.
 *
 * ALWAYS leaves a timer behind. A timer that has already fired has cleared
 * its own slot, and this is the only site that arms a new one, so any path
 * that declined to re-arm would end the chain for the life of the process —
 * the widget would then freeze at whatever minute the failure happened on,
 * with nothing to signal it. `null` (nothing usable was built) and a target
 * already in the past both fall back to a plain retry.
 */
const scheduleLabelFlipPush = (schedule: ScheduleType, targetEpochMs: number | null): void => {
  const existing = flipPushTimers[schedule];
  if (existing !== null) {
    clearTimeout(existing);
    flipPushTimers[schedule] = null;
  }

  const msUntilFlip = (targetEpochMs === null ? null : msUntilMinuteFlip(targetEpochMs)) ?? FLIP_RETRY_MS;

  flipPushTimers[schedule] = setTimeout(() => {
    flipPushTimers[schedule] = null;
    void pushScheduleTimelines(schedule, { reuseCachedSequence: true });
  }, msUntilFlip);
};

/**
 * Pushes ONE schedule's timelines to its five widget kinds — light small +
 * medium + lock share the light entries; the dark small + medium pair gets
 * the theme-stamped dark copy. Label-flip pushes (`reuseCachedSequence`)
 * skip the sequence rebuild; full refreshes always rebuild it first so data
 * and settings changes can never read through the cache.
 *
 * iOS only and failure-tolerant per schedule: widgets are a surface, not a
 * critical path, so any error is logged and swallowed. Safe to call at every
 * point where fresh data or preferences are known (sync, notification
 * refresh, background task, settings changes).
 */
const pushScheduleTimelines = async (
  schedule: ScheduleType,
  options?: { reuseCachedSequence?: boolean }
): Promise<void> => {
  if (Platform.OS !== 'ios' || !FEATURE_FLAGS.widgets) return;

  // Captured inside the try, consumed by the `finally` re-arm below, so every
  // exit from here — success, native throw, or empty build — leaves the chain
  // armed. Stays null until entries exist to flip on.
  let flipTargetEpochMs: number | null = null;

  try {
    const now = TimeUtils.createInstant();
    const today = TimeUtils.getTodayDateString();
    const yesterday = TimeUtils.getPreviousDateString(today);
    const startDate = TimeUtils.getDayAnchor(yesterday);
    const settings = readWidgetSettings();

    // Includes yesterday in the sequence span so the segment covering `now`
    // starts at the real previous prayer (yesterday's Isha or last extra
    // time) instead of `now` — the same reason the app's countdown bar
    // fetches yesterday's data.
    const sequence = options?.reuseCachedSequence
      ? sequenceFor(schedule, startDate)
      : rebuildSequence(schedule, startDate);

    const lightEntries = buildPrayerWidgetTimeline(now, sequence, settings, 'light');
    const darkEntries = buildPrayerWidgetTimeline(now, sequence, settings, 'dark');

    if (lightEntries.length === 0 || darkEntries.length === 0) {
      logger.warn('WIDGET: Empty timeline built — prayer cache is likely empty', {
        schedule,
        entries: lightEntries.length,
      });
      return;
    }

    // Taken BEFORE the native calls: entries this good deserve the true
    // cadence even if a push throws, so a native failure retries on the next
    // real minute flip rather than on a generic timer.
    flipTargetEpochMs = lightEntries[0].props.nextEpochMs;

    // The lazy requires register all widget layouts into the app group as a
    // side effect of module evaluation — required before updateTimeline works
    // (first iOS push pays the registration; Android never reaches here)
    if (schedule === ScheduleType.Standard) {
      const home = getHomeWidgets();
      const lock = getLockWidgets();
      home.PrayerWidget.updateTimeline(lightEntries);
      home.PrayerWidgetMedium.updateTimeline(lightEntries);
      lock.PrayerLockWidget.updateTimeline(lightEntries);
      home.PrayerWidgetDark.updateTimeline(darkEntries);
      home.PrayerWidgetDarkMedium.updateTimeline(darkEntries);
    } else {
      const home = getHomeWidgets();
      const lock = getLockWidgets();
      home.ExtrasWidget.updateTimeline(lightEntries);
      home.ExtrasWidgetMedium.updateTimeline(lightEntries);
      lock.ExtrasLockWidget.updateTimeline(lightEntries);
      home.ExtrasWidgetDark.updateTimeline(darkEntries);
      home.ExtrasWidgetDarkMedium.updateTimeline(darkEntries);
    }

    const scheduleLabel = schedule === ScheduleType.Standard ? 'Standard' : 'Extras';
    logger.info(`WIDGET: ${scheduleLabel} timeline pushed`, {
      entries: lightEntries.length,
      next: lightEntries[0].props.nextName,
      nextAt: lightEntries[0].props.nextTime,
    });
  } catch (error) {
    logger.warn('WIDGET: Failed to refresh widget timelines', { schedule, error });
  } finally {
    // Nothing usable came out, so the cached sequence is either empty or the
    // very thing that failed: drop it, or the retry would reuse it and repeat
    // the same failure every minute instead of re-reading a healed cache.
    if (flipTargetEpochMs === null) sequenceCache[schedule] = null;

    scheduleLabelFlipPush(schedule, flipTargetEpochMs);
  }
};

/**
 * Pushes a fresh timeline to all ten widgets from the cached prayer data —
 * both schedules, rebuilding their sequences so the caches repopulate.
 * Call this wherever fresh data or preferences are known; the per-schedule
 * label-flip timers handle the in-between minute pushes themselves.
 */
export const refreshPrayerWidgets = async (): Promise<void> => {
  if (Platform.OS !== 'ios' || !FEATURE_FLAGS.widgets) return;

  await pushScheduleTimelines(ScheduleType.Standard);
  await pushScheduleTimelines(ScheduleType.Extra);
};
