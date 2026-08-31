/**
 * Widget IO layer - pushes iOS home screen and Lock Screen widget timelines
 * for BOTH schedules: the standard pair (PrayerWidget + PrayerLockWidget)
 * and the extras pair (ExtrasWidget + ExtrasLockWidget).
 *
 * Reads the cached prayer data and the user's widget-relevant preferences,
 * builds one timeline per schedule with the pure builder in
 * shared/widgetTimeline.ts, and pushes each to its two widgets via
 * expo-widgets. WidgetKit renders each entry at its own date; while the app
 * runs, a label-flip scheduler re-pushes at the earliest countdown minute
 * change across both schedules so no widget shows a stale minute.
 *
 * @see shared/widgetTimeline.ts - pure timeline builder
 * @see widgets/PrayerWidget.tsx - home screen widget layouts (both schedules)
 * @see widgets/LockPrayerWidget.tsx - Lock Screen widget layouts (both schedules)
 */

import { addDays } from 'date-fns';
import { getDefaultStore } from 'jotai';
import { Platform } from 'react-native';

import logger from '@/shared/logger';
import * as PrayerUtils from '@/shared/prayer';
import * as TimeUtils from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { buildPrayerWidgetTimeline } from '@/shared/widgetTimeline';
import type { PrayerWidgetSettings } from '@/shared/widgetTypes';
import { hijriDateEnabledAtom } from '@/stores/ui';
import { ExtrasLockWidget, PrayerLockWidget } from '@/widgets/LockPrayerWidget';
import { ExtrasWidget, PrayerWidget } from '@/widgets/PrayerWidget';

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

let settingsPushTimer: ReturnType<typeof setTimeout> | null = null;
let labelFlipPushTimer: ReturnType<typeof setTimeout> | null = null;
let settingsSyncInitialized = false;

/**
 * Keeps the widgets aligned with in-app settings: any change to a
 * widget-visible preference re-pushes the timeline (debounced), so widgets
 * follow the app while it is in the foreground instead of waiting for the
 * next sync. Idempotent; no-op off iOS.
 */
export const initWidgetSettingsSync = (): void => {
  if (settingsSyncInitialized || Platform.OS !== 'ios') return;
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
 * Keeps the countdown labels of BOTH schedules in sync while the app runs:
 * the minute-ceil label changes exactly when the remaining time crosses a
 * whole minute, so each push schedules the next one at the earliest
 * upcoming flip across all live countdown targets — the widget whose label
 * changes next dictates the re-push instant. Each widget therefore
 * re-renders within a quarter second of every true minute flip — no blind
 * 60s polling, no drift. Re-arms from fresh data on every push; a suspended
 * (backgrounded) timer coalesces into one fire on foreground, which doubles
 * as a refresh when the user returns.
 */
const scheduleLabelFlipPush = (targets: number[]): void => {
  if (labelFlipPushTimer !== null) clearTimeout(labelFlipPushTimer);
  labelFlipPushTimer = null;

  const upcomingFlips = targets.map(msUntilMinuteFlip).filter((flip) => flip !== null);
  if (upcomingFlips.length === 0) return;

  const msUntilFlip = Math.min(...upcomingFlips);

  labelFlipPushTimer = setTimeout(() => {
    labelFlipPushTimer = null;
    void refreshPrayerWidgets();
  }, msUntilFlip);
};

/**
 * Pushes a fresh timeline to all four widgets from the cached prayer data —
 * one timeline per schedule, two widgets per timeline.
 *
 * Includes yesterday in the sequence span so the segment covering `now`
 * starts at the real previous prayer (yesterday's Isha or last extra time)
 * instead of `now` — the same reason the app's countdown bar fetches
 * yesterday's data.
 *
 * iOS only and failure-tolerant: widgets are a surface, not a critical
 * path, so any error is logged and swallowed. Safe to call at every point
 * where fresh data or preferences are known (sync, notification refresh,
 * background task, settings changes).
 */
export const refreshPrayerWidgets = async (): Promise<void> => {
  if (Platform.OS !== 'ios') return;

  try {
    const now = TimeUtils.createLondonDate();
    const startDate = addDays(now, -1);
    const settings = readWidgetSettings();

    const standardSequence = PrayerUtils.createPrayerSequence(ScheduleType.Standard, startDate, TIMELINE_DAYS + 1);
    const extraSequence = PrayerUtils.createPrayerSequence(ScheduleType.Extra, startDate, TIMELINE_DAYS + 1);

    const standardEntries = buildPrayerWidgetTimeline(now, standardSequence, settings);
    const extraEntries = buildPrayerWidgetTimeline(now, extraSequence, settings);

    if (standardEntries.length === 0 || extraEntries.length === 0) {
      logger.warn('WIDGET: Empty timeline built — prayer cache is likely empty', {
        standardEntries: standardEntries.length,
        extraEntries: extraEntries.length,
      });
    }

    const flipTargets: number[] = [];

    // Static imports register all widget layouts into the app group as a
    // side effect of module evaluation — required before updateTimeline works.
    if (standardEntries.length > 0) {
      PrayerWidget.updateTimeline(standardEntries);
      PrayerLockWidget.updateTimeline(standardEntries);
      flipTargets.push(standardEntries[0].props.nextEpochMs);

      logger.info('WIDGET: Standard timeline pushed', {
        entries: standardEntries.length,
        next: standardEntries[0].props.nextName,
        nextAt: standardEntries[0].props.nextTime,
      });
    }

    if (extraEntries.length > 0) {
      ExtrasWidget.updateTimeline(extraEntries);
      ExtrasLockWidget.updateTimeline(extraEntries);
      flipTargets.push(extraEntries[0].props.nextEpochMs);

      logger.info('WIDGET: Extras timeline pushed', {
        entries: extraEntries.length,
        next: extraEntries[0].props.nextName,
        nextAt: extraEntries[0].props.nextTime,
      });
    }

    scheduleLabelFlipPush(flipTargets);
  } catch (error) {
    logger.warn('WIDGET: Failed to refresh widget timelines', { error });
  }
};
