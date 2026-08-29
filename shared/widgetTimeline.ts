/**
 * Pure timeline builder for the Athan iOS widgets.
 *
 * Builds timeline entries from a prayer sequence (one entry per prayer
 * boundary plus a midnight rollover per day) for WidgetKit to render: between
 * entries the widgets stay live on their own because countdown text and
 * progress bars use SwiftUI timer intervals, so the system ticks them every
 * second without any app involvement.
 *
 * Pure module: no React Native imports — deterministic and unit-testable.
 *
 * @see widgets/PrayerWidget.tsx - home screen widget layout
 * @see widgets/LockPrayerWidget.tsx - Lock Screen widget layout
 * @see stores/widget.ts - IO layer that pushes built entries to the widgets
 */

import { addDays, format } from 'date-fns';
import type { WidgetTimelineEntry } from 'expo-widgets';

import * as TimeUtils from '@/shared/time';
import type { Prayer, PrayerSequence } from '@/shared/types';
import type { PrayerWidgetDayPrayer, PrayerWidgetProps, PrayerWidgetSettings } from '@/shared/widgetTypes';
import { WIDGET_PROPS_VERSION } from '@/shared/widgetTypes';

/**
 * Minimum spacing between adjacent timeline entries. WidgetKit guidance asks
 * for entries "at least about 5 minutes apart" — closer entries may be
 * coalesced, which would silently skip a prayer-boundary flip or a midnight
 * day-list rollover.
 */
export const MIN_ENTRY_SPACING_MS = 5 * 60 * 1000;
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
const buildDayList = (
  prayers: Prayer[],
  entryDate: Date,
  prevIndex: number,
  showArabic: boolean
): PrayerWidgetDayPrayer[] => {
  const dateString = TimeUtils.formatDateShort(entryDate);

  return prayers
    .map((prayer, index) => ({ prayer, index }))
    .filter(({ prayer }) => prayer.belongsToDate === dateString)
    .map(({ prayer, index }) => ({
      name: prayer.english,
      arabic: showArabic ? prayer.arabic : '',
      time: prayer.time,
      state: index <= prevIndex ? 'passed' : index === prevIndex + 1 ? 'next' : 'upcoming',
    }));
};

/**
 * Builds one timeline entry per prayer boundary plus one per London midnight,
 * starting at `now`, capped by a terminal stale entry after the final prayer.
 * Each entry carries the full props snapshot for its segment: the upcoming
 * prayer, the segment bounds (for the live countdown and progress bar), and
 * that day's prayer list (which rolls over at midnight). Adjacent entries are
 * kept at least MIN_ENTRY_SPACING_MS apart (WidgetKit guidance): imminent
 * midnights are skipped and the first entry is backdated when a boundary is
 * too close to `now`.
 *
 * @param now Current instant
 * @param sequence Chronologically sorted prayer sequence (must span `now`)
 * @param settings The in-app settings snapshot the widget mirrors
 * @returns Sorted timeline entries ending with the stale guard, empty when the
 *  sequence does not cover `now`
 */
export const buildPrayerWidgetTimeline = (
  now: Date,
  sequence: PrayerSequence,
  settings: PrayerWidgetSettings
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
        v: WIDGET_PROPS_VERSION,
        nextName: next.english,
        nextArabic: settings.showArabic ? next.arabic : '',
        nextTime: next.time,
        nextEpochMs: next.datetime.getTime(),
        prevEpochMs: prev ? prev.datetime.getTime() : date.getTime(),
        accentColor: settings.accentColor,
        showArabic: settings.showArabic,
        showBar: settings.showBar,
        dayPrayers: buildDayList(prayers, date, prevIndex, settings.showArabic),
      },
    };
  };

  let cursor = now;
  let prevIndex = firstNextIndex - 1;
  let lastEmittedMs: number | null = null;

  while (prevIndex + 1 < prayers.length) {
    const nextPrayer = prayers[prevIndex + 1];
    const midnight = nextLondonMidnightAfter(cursor);
    const midnightMs = midnight.getTime();
    const boundaryMs = nextPrayer.datetime.getTime();

    // A midnight rollover is worth an entry only when it keeps the minimum
    // spacing on both sides: after the previously emitted entry, and before
    // the boundary that follows. When skipped, the day list simply rolls over
    // at the next boundary entry instead.
    const midnightEmitted =
      midnightMs < boundaryMs &&
      (lastEmittedMs === null || midnightMs - lastEmittedMs >= MIN_ENTRY_SPACING_MS) &&
      boundaryMs - midnightMs >= MIN_ENTRY_SPACING_MS;

    // The first entry must date at or before `now` so the widget has content
    // immediately, but the next emitted entry still needs its 5 minutes: when
    // a midnight or boundary is imminent, backdate the first entry. An
    // earlier-dated entry is already "active" at push time, so this is safe.
    if (lastEmittedMs === null) {
      const firstFollowingMs = midnightEmitted ? Math.min(midnightMs, boundaryMs) : boundaryMs;
      if (firstFollowingMs - cursor.getTime() < MIN_ENTRY_SPACING_MS) {
        cursor = new Date(firstFollowingMs - MIN_ENTRY_SPACING_MS);
      }
    }

    entries.push(makeEntry(cursor, prevIndex));
    lastEmittedMs = cursor.getTime();

    if (midnightEmitted) {
      entries.push(makeEntry(midnight, prevIndex));
      lastEmittedMs = midnightMs;
    }

    cursor = nextPrayer.datetime;
    prevIndex += 1;
  }

  // Terminal stale entry: once every real segment has passed, WidgetKit keeps
  // re-rendering the final entry — make that a designed "open Athan to
  // refresh" card instead of silently stale times with clamped 0:00 countdowns.
  // It flips exactly at the final prayer like every other boundary, pushed to
  // the minimum spacing if the last emitted entry sits pathologically close.
  const finalPrayer = prayers[prayers.length - 1];
  const finalEpochMs = finalPrayer.datetime.getTime();
  const staleMs = Math.max(finalEpochMs, (lastEmittedMs ?? finalEpochMs) + MIN_ENTRY_SPACING_MS);
  entries.push({
    date: new Date(staleMs),
    props: {
      v: WIDGET_PROPS_VERSION,
      nextName: finalPrayer.english,
      nextArabic: settings.showArabic ? finalPrayer.arabic : '',
      nextTime: finalPrayer.time,
      nextEpochMs: finalEpochMs,
      prevEpochMs: finalEpochMs,
      accentColor: settings.accentColor,
      showArabic: settings.showArabic,
      showBar: settings.showBar,
      dayPrayers: [],
      stale: true,
    },
  });

  // WidgetKit requires chronological entries; the midnight insertion can
  // otherwise land after a boundary that sits just past midnight (early
  // morning Isha in summer).
  entries.sort((a, b) => a.date.getTime() - b.date.getTime());

  return entries;
};
