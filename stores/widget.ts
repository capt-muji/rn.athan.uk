/**
 * Widget IO layer - pushes iOS home screen and Lock Screen widget timelines
 * for BOTH schedules and BOTH home themes. Each home kind is size-exclusive
 * (small and medium register separately so the gallery groups smalls before
 * mediums), and every kind receives its own schedule- and theme-stamped
 * timeline: the standard light set (PrayerWidget + PrayerWidgetMedium +
 * PrayerLockWidget 1 to 3), the standard dark pair (PrayerWidgetDark +
 * PrayerWidgetDarkMedium), the extras light set (ExtrasWidget +
 * ExtrasWidgetMedium + ExtrasLockWidget 1 to 3), and the extras dark pair
 * (ExtrasWidgetDark + ExtrasWidgetDarkMedium).
 *
 * Reads the cached prayer data and the user's widget-relevant preferences,
 * builds one timeline per schedule AND theme with the pure builder in
 * shared/widgetTimeline.ts, and pushes each to its widgets via
 * expo-widgets. A widget's theme is fixed at placement (the gallery's
 * Light/Dark kinds) — it never follows the system appearance. WidgetKit
 * renders each entry at its own date.
 *
 * iOS pushes only when the data behind the widget changes: launch and
 * foreground sync, a notification reschedule, a widget-visible setting, and
 * the background task. There is deliberately NO per-minute re-push. Each
 * push costs a WidgetKit reload per kind, and a reload re-renders every
 * entry in that kind's timeline — measured at 5 to 13 CPU-seconds per kind
 * on an A12. Ten kinds a minute exceeded the extension's CPU budget (50%
 * over 180s), so iOS killed it mid-render and WidgetKit masked the missing
 * render as "Please adopt containerBackground API" (ISSUES.md §G.1).
 * Nothing user-visible is lost: iOS suspends JS timers the moment the app
 * leaves the foreground, so those pushes only ever ran while the widget was
 * impossible to look at. Between pushes the stepped timeline entries carry
 * the countdown, which is what the home screen reads from anyway.
 *
 * @see shared/widgetTimeline.ts - pure timeline builder
 * @see widgets/PrayerWidget.tsx - home screen widget layouts (both schedules)
 * @see widgets/LockPrayerWidget.tsx - Lock Screen widget layouts (both schedules)
 */

import { getDefaultStore } from 'jotai';
import { Platform } from 'react-native';

import { armWidgetRefreshChain } from '@/modules/widgetrefresh';
import { FEATURE_FLAGS } from '@/shared/flags';
import logger from '@/shared/logger';
import * as PrayerUtils from '@/shared/prayer';
import * as TimeUtils from '@/shared/time';
import { type PrayerSequence, ScheduleType } from '@/shared/types';
import { buildPrayerWidgetSnapshot, buildPrayerWidgetTimeline, TIMELINE_DAYS } from '@/shared/widgetTimeline';
import type { PrayerWidgetAndroidProps, PrayerWidgetSettings } from '@/shared/widgetTypes';
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

const buildSequence = (schedule: ScheduleType, startDate: Date): PrayerSequence =>
  PrayerUtils.createPrayerSequence(schedule, startDate, TIMELINE_DAYS + 1);

/**
 * Keeps the widgets aligned with in-app settings: any change to a
 * widget-visible preference re-pushes the timeline (debounced), so widgets
 * follow the app while it is in the foreground instead of waiting for the
 * next sync. Idempotent; no-op off iOS.
 */
export const initWidgetSettingsSync = (): void => {
  const iosEligible = Platform.OS === 'ios' && FEATURE_FLAGS.iosWidgets;
  const androidEligible = Platform.OS === 'android' && FEATURE_FLAGS.androidWidgets;
  if (settingsSyncInitialized || (!iosEligible && !androidEligible)) return;
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
 * Pushes ONE schedule's timelines to its six widget kinds — light small +
 * medium + lock share the light entries; the dark small + medium pair gets
 * the theme-stamped dark copy. The sequence is always rebuilt: every caller
 * is a data, settings or launch event, so reading through a cache here could
 * only serve something older than the change that triggered the push.
 *
 * iOS only and failure-tolerant per schedule: widgets are a surface, not a
 * critical path, so any error is logged and swallowed. Safe to call at every
 * point where fresh data or preferences are known (sync, notification
 * refresh, background task, settings changes).
 */
const pushScheduleTimelines = async (schedule: ScheduleType): Promise<void> => {
  // No platform or flag check here: every push starts from refreshPrayerWidgets, which has one, and neither the
  // platform nor the build's flags change while the app runs

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
    const sequence = buildSequence(schedule, startDate);

    const lightEntries = buildPrayerWidgetTimeline(now, sequence, settings, 'light');
    const darkEntries = buildPrayerWidgetTimeline(now, sequence, settings, 'dark');

    if (lightEntries.length === 0 || darkEntries.length === 0) {
      logger.warn('WIDGET: Empty timeline built — prayer cache is likely empty', {
        schedule,
        entries: lightEntries.length,
      });
      return;
    }

    // The lazy requires register all widget layouts into the app group as a
    // side effect of module evaluation — required before updateTimeline works
    // (first iOS push pays the registration; Android never reaches here)
    if (schedule === ScheduleType.Standard) {
      const home = getHomeWidgets();
      const lock = getLockWidgets();
      home.PrayerWidget.updateTimeline(lightEntries);
      home.PrayerWidgetMedium.updateTimeline(lightEntries);
      lock.PrayerLockWidget.updateTimeline(lightEntries);
      lock.PrayerLockWidget2.updateTimeline(lightEntries);
      lock.PrayerLockWidget3.updateTimeline(lightEntries);
      home.PrayerWidgetDark.updateTimeline(darkEntries);
      home.PrayerWidgetDarkMedium.updateTimeline(darkEntries);
    } else {
      const home = getHomeWidgets();
      const lock = getLockWidgets();
      home.ExtrasWidget.updateTimeline(lightEntries);
      home.ExtrasWidgetMedium.updateTimeline(lightEntries);
      lock.ExtrasLockWidget.updateTimeline(lightEntries);
      lock.ExtrasLockWidget2.updateTimeline(lightEntries);
      lock.ExtrasLockWidget3.updateTimeline(lightEntries);
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
  }
};

/**
 * Pushes a fresh timeline to all ten widgets from the cached prayer data —
 * both schedules, rebuilding their sequences so the caches repopulate.
 * Call this wherever fresh data or preferences are known; the per-schedule
 * label-flip timers handle the in-between minute pushes themselves.
 */
export const refreshPrayerWidgets = async (): Promise<void> => {
  if (Platform.OS === 'ios' && !FEATURE_FLAGS.iosWidgets) return;
  if (Platform.OS === 'android' && !FEATURE_FLAGS.androidWidgets) return;

  if (Platform.OS === 'android') {
    await pushScheduleAndroid(ScheduleType.Standard);
    await pushScheduleAndroid(ScheduleType.Extra);
    // The native minute-refresh chain keeps the widgets ticking after the
    // host pauses this process's JS timers (owner ruling 2026-09-19)
    try {
      armWidgetRefreshChain();
    } catch (error) {
      logger.warn('WIDGET: Failed to arm the native refresh chain', { error });
    }
    return;
  }

  await pushScheduleTimelines(ScheduleType.Standard);
  await pushScheduleTimelines(ScheduleType.Extra);
};

// =============================================================================
// ANDROID PUSH PATH
// Android widgets have no timeline: each kind stores one snapshot and the
// layout computes its content at render time, so pushes carry data (the
// window) and the flip chain only triggers re-renders (reload).
// =============================================================================

/** One home kind's stamp: every kind renders its own theme at a fixed size. */
interface AndroidKindStamp {
  widget: { updateSnapshot: (props: PrayerWidgetAndroidProps) => void; reload: () => void };
  theme: 'light' | 'dark';
  size: 'small' | 'medium';
}

const androidKindsFor = (schedule: ScheduleType): AndroidKindStamp[] => {
  const home = getHomeWidgets();
  if (schedule === ScheduleType.Standard) {
    return [
      { widget: home.PrayerWidget, theme: 'light', size: 'small' },
      { widget: home.PrayerWidgetMedium, theme: 'light', size: 'medium' },
      { widget: home.PrayerWidgetDark, theme: 'dark', size: 'small' },
      { widget: home.PrayerWidgetDarkMedium, theme: 'dark', size: 'medium' },
    ];
  }
  return [
    { widget: home.ExtrasWidget, theme: 'light', size: 'small' },
    { widget: home.ExtrasWidgetMedium, theme: 'light', size: 'medium' },
    { widget: home.ExtrasWidgetDark, theme: 'dark', size: 'small' },
    { widget: home.ExtrasWidgetDarkMedium, theme: 'dark', size: 'medium' },
  ];
};

/** The earliest readable epoch still in the future: the countdown target. */
const nextFutureEpochMs = (
  snapshot: Omit<PrayerWidgetAndroidProps, 'theme' | 'size'>,
  nowMs: number
): number | null => {
  let earliest: number | null = null;
  for (const day of snapshot.days) {
    for (const row of day.rows) {
      if (row.epochMs <= nowMs) continue;
      if (earliest === null || row.epochMs < earliest) earliest = row.epochMs;
    }
  }
  return earliest;
};

/** Re-renders a schedule's home kinds from their stored snapshots. */
const reloadAndroidKinds = (schedule: ScheduleType): void => {
  for (const kind of androidKindsFor(schedule)) {
    kind.widget.reload();
  }
};

/**
 * Arms ONE schedule's Android flip chain: while the countdown target is
 * still ahead, every minute flip reloads the four home kinds (the render
 * recomputes the label from the epochs); once the target has passed, a full
 * re-push takes over so the widget rolls onto the next prayer with fresh
 * data. Always leaves a timer behind, mirroring the iOS chain's invariant.
 */
const scheduleLabelFlipReload = (schedule: ScheduleType, targetEpochMs: number | null): void => {
  const existing = flipPushTimers[schedule];
  if (existing !== null) {
    clearTimeout(existing);
    flipPushTimers[schedule] = null;
  }

  const msUntilFlip = (targetEpochMs === null ? null : msUntilMinuteFlip(targetEpochMs)) ?? FLIP_RETRY_MS;

  flipPushTimers[schedule] = setTimeout(() => {
    flipPushTimers[schedule] = null;
    if (targetEpochMs !== null && targetEpochMs > Date.now()) {
      reloadAndroidKinds(schedule);
      scheduleLabelFlipReload(schedule, targetEpochMs);
      return;
    }
    void pushScheduleAndroid(schedule);
  }, msUntilFlip);
};

/**
 * Pushes ONE schedule's snapshot to its four home kinds on Android. Pushes are
 * rare — a full refresh, or a flip chain reaching its target — so each one
 * reads the prayer days afresh; the per-minute flips in between only reload
 * the kinds, which re-renders from the snapshot already in place.
 */
const pushScheduleAndroid = async (schedule: ScheduleType): Promise<void> => {
  let flipTargetEpochMs: number | null = null;

  try {
    const now = TimeUtils.createInstant();
    const today = TimeUtils.getTodayDateString();
    const yesterday = TimeUtils.getPreviousDateString(today);
    const startDate = TimeUtils.getDayAnchor(yesterday);
    const settings = readWidgetSettings();

    const sequence = buildSequence(schedule, startDate);

    const snapshot = buildPrayerWidgetSnapshot(sequence, settings);
    if (snapshot === null) {
      logger.warn('WIDGET: Empty snapshot built — prayer cache is likely empty', { schedule });
      return;
    }

    const nextEpoch = nextFutureEpochMs(snapshot, now.getTime());
    const nextRow = (() => {
      for (const day of snapshot.days) {
        for (const row of day.rows) {
          if (row.epochMs === nextEpoch) return row;
        }
      }
      return null;
    })();

    for (const kind of androidKindsFor(schedule)) {
      kind.widget.updateSnapshot({ ...snapshot, theme: kind.theme, size: kind.size });
    }

    flipTargetEpochMs = nextEpoch;

    const scheduleLabel = schedule === ScheduleType.Standard ? 'Standard' : 'Extras';
    logger.info(`WIDGET: ${scheduleLabel} snapshot pushed`, {
      next: nextRow?.name,
      nextAt: nextRow?.time,
    });
  } catch (error) {
    logger.warn('WIDGET: Failed to refresh widget snapshots', { schedule, error });
  } finally {
    scheduleLabelFlipReload(schedule, flipTargetEpochMs);
  }
};
