/**
 * Widget IO layer - pushes iOS home screen and Lock Screen widget timelines
 *
 * Reads the cached prayer data and the user's widget-relevant preferences,
 * builds the timeline with the pure builder in shared/widgetTimeline.ts, and
 * pushes it to both widgets via expo-widgets. Between entries the widgets stay
 * live on their own: countdown text and progress bars use SwiftUI timer
 * intervals, so the system ticks them every second without any app involvement.
 *
 * @see shared/widgetTimeline.ts - pure timeline builder
 * @see widgets/PrayerWidget.tsx - home screen widget layout
 * @see widgets/LockPrayerWidget.tsx - Lock Screen widget layout
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
import { countdownBarColorAtom, countdownBarShownAtom, showArabicNamesAtom } from '@/stores/ui';
import PrayerLockWidget from '@/widgets/LockPrayerWidget';
import PrayerWidget from '@/widgets/PrayerWidget';

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
    accentColor: store.get(countdownBarColorAtom),
    showArabic: store.get(showArabicNamesAtom),
    showBar: store.get(countdownBarShownAtom),
  };
};

/**
 * Pushes a fresh timeline to both widgets from the cached prayer data.
 *
 * Includes yesterday in the sequence span so the segment covering `now`
 * starts at the real previous prayer (yesterday's Isha) instead of `now` —
 * the same reason the app's countdown bar fetches yesterday's data.
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
    const sequence = PrayerUtils.createPrayerSequence(ScheduleType.Standard, startDate, TIMELINE_DAYS + 1);

    const entries = buildPrayerWidgetTimeline(now, sequence, readWidgetSettings());
    if (entries.length === 0) {
      logger.warn('WIDGET: No timeline entries built — prayer cache is likely empty');
      return;
    }

    // Static imports register both widget layouts into the app group as a
    // side effect of module evaluation — required before updateTimeline works.
    PrayerWidget.updateTimeline(entries);
    PrayerLockWidget.updateTimeline(entries);

    logger.info('WIDGET: Timeline pushed', {
      entries: entries.length,
      next: entries[0].props.nextName,
      nextAt: entries[0].props.nextTime,
    });
  } catch (error) {
    logger.warn('WIDGET: Failed to refresh widget timelines', { error });
  }
};
