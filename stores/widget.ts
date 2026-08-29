/**
 * Widget layer - iOS home screen and Lock Screen widget timelines
 *
 * Builds timeline entries from the cached prayer data (one entry per prayer
 * boundary plus a midnight rollover per day) and pushes them to both widgets
 * via expo-widgets. Between entries the widgets stay live on their own:
 * countdown text and progress bars use SwiftUI timer intervals, so the system
 * ticks them every second without any app involvement.
 *
 * @see widgets/PrayerWidget.tsx - home screen widget layout
 * @see widgets/LockPrayerWidget.tsx - Lock Screen widget layout
 */

import { addDays, format } from 'date-fns';
import type { WidgetTimelineEntry } from 'expo-widgets';
import { getDefaultStore } from 'jotai';
import { Platform } from 'react-native';

import logger from '@/shared/logger';
import * as PrayerUtils from '@/shared/prayer';
import * as TimeUtils from '@/shared/time';
import { type Prayer, type PrayerSequence, ScheduleType } from '@/shared/types';
import { countdownBarColorAtom, showArabicNamesAtom } from '@/stores/ui';
import PrayerLockWidget from '@/widgets/LockPrayerWidget';
import PrayerWidget from '@/widgets/PrayerWidget';
import type { PrayerWidgetDayPrayer, PrayerWidgetProps } from '@/widgets/types';

/** Days of prayer boundaries scheduled ahead — the widget re-reads this
 *  stored timeline when it runs out, so this is how long the widget stays
 *  correct without the app opening. */
const TIMELINE_DAYS = 14;

/**
 * Finds the first London midnight strictly after the given instant.
 * Uses the same zoned-time conversion as prayer datetimes, so DST
 * transitions resolve to the correct instant.
 */
const nextLondonMidnightAfter = (date: Date): Date => {
  const londonWall = TimeUtils.createLondonDate(date);
  const nextDay = addDays(londonWall, 1);
  const dateString = format(nextDay, 'yyyy-MM-dd');
  return TimeUtils.createPrayerDatetime(dateString, '00:00');
};

/**
 * Builds the six-row day list for the Islamic day matching the entry's
 * London date. States are relative to the entry date: prayers at or before
 * the segment start are passed, the next one is highlighted, the rest upcoming.
 *
 * @param prayers Chronologically sorted sequence prayers
 * @param entryDate Date of the timeline entry
 * @param prevIndex Index of the prayer starting the entry's segment
 */
const buildDayList = (prayers: Prayer[], entryDate: Date, prevIndex: number): PrayerWidgetDayPrayer[] => {
  const dateString = TimeUtils.formatDateShort(entryDate);

  return prayers
    .map((prayer, index) => ({ prayer, index }))
    .filter(({ prayer }) => prayer.belongsToDate === dateString)
    .map(({ prayer, index }) => ({
      name: prayer.english,
      arabic: prayer.arabic,
      time: prayer.time,
      state: index <= prevIndex ? 'passed' : index === prevIndex + 1 ? 'next' : 'upcoming',
    }));
};

/**
 * Builds one timeline entry per prayer boundary plus one per London midnight,
 * starting at `now`. Each entry carries the full props snapshot for its
 * segment: the upcoming prayer, the segment bounds (for the live countdown
 * and progress bar), and that day's prayer list (which rolls over at midnight).
 *
 * @param now Current instant
 * @param sequence Chronologically sorted prayer sequence (must span `now`)
 * @param accentColor User's countdown bar accent color (hex)
 * @param showArabic Whether Arabic prayer names are enabled
 * @returns Sorted timeline entries, empty when the sequence does not cover `now`
 */
export const buildPrayerWidgetTimeline = (
  now: Date,
  sequence: PrayerSequence,
  accentColor: string,
  showArabic: boolean
): WidgetTimelineEntry<PrayerWidgetProps>[] => {
  const entries: WidgetTimelineEntry<PrayerWidgetProps>[] = [];
  const prayers = sequence.prayers;
  if (prayers.length === 0) return entries;

  const firstNextIndex = prayers.findIndex((prayer) => prayer.datetime.getTime() > now.getTime());
  if (firstNextIndex === -1) return entries;

  const makeEntry = (date: Date, prevIndex: number): WidgetTimelineEntry<PrayerWidgetProps> => {
    const next = prayers[prevIndex + 1];
    const prev = prevIndex >= 0 ? prayers[prevIndex] : null;

    return {
      date,
      props: {
        nextName: next.english,
        nextArabic: next.arabic,
        nextTime: next.time,
        nextEpochMs: next.datetime.getTime(),
        prevEpochMs: prev ? prev.datetime.getTime() : date.getTime(),
        accentColor,
        showArabic,
        dayPrayers: buildDayList(prayers, date, prevIndex),
      },
    };
  };

  let cursor = now;
  let prevIndex = firstNextIndex - 1;

  while (prevIndex + 1 < prayers.length) {
    const nextPrayer = prayers[prevIndex + 1];

    entries.push(makeEntry(cursor, prevIndex));

    const midnight = nextLondonMidnightAfter(cursor);
    if (midnight.getTime() < nextPrayer.datetime.getTime()) {
      entries.push(makeEntry(midnight, prevIndex));
    }

    cursor = nextPrayer.datetime;
    prevIndex += 1;
  }

  // WidgetKit requires chronological entries; the midnight insertion can
  // otherwise land after a boundary that sits just past midnight (early
  // morning Isha in summer).
  entries.sort((a, b) => a.date.getTime() - b.date.getTime());

  return entries;
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
 * background task).
 */
export const refreshPrayerWidgets = async (): Promise<void> => {
  if (Platform.OS !== 'ios') return;

  try {
    const now = TimeUtils.createLondonDate();
    const startDate = addDays(now, -1);
    const sequence = PrayerUtils.createPrayerSequence(ScheduleType.Standard, startDate, TIMELINE_DAYS + 1);

    const store = getDefaultStore();
    const accentColor = store.get(countdownBarColorAtom);
    const showArabic = store.get(showArabicNamesAtom);

    const entries = buildPrayerWidgetTimeline(now, sequence, accentColor, showArabic);
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
