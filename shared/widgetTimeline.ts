/**
 * Pure timeline builder for the Athan iOS widgets (standard + extras pairs).
 *
 * Builds timeline entries from a prayer sequence, ONE PER BOUNDARY, for
 * WidgetKit to render. The countdown needs no entries of its own: the
 * layouts draw it as a SwiftUI timer interval, which iOS ticks every second
 * in its own process between entries. WidgetKit archives a rendered view for
 * every entry and the total must fit the extension's ~30 MB budget, so entry
 * count is the constraint that matters here — a boundary-only timeline is
 * both the cheapest shape and the only one the widgets need.
 *
 * The widget has to follow exactly the rules the app's screens follow, so what
 * each entry shows comes from shared/sequence.ts rather than from positions in
 * the sequence: a row with no readable time is never a boundary and never
 * counted down to, and a list day with none, and the day before one, stays on
 * screen until 00:00 London (ai/features/uat-2/DASHES-DESIGN.md §8).
 *
 * Schedule-agnostic: the same loop serves both the Standard sequence (home
 * + Lock widgets) and the Extra sequence (extras home + Lock widgets); both
 * day lists read in their app page's order (Istijaba last on Fridays).
 * Every entry stamps its schedule and the caller's theme so the layouts can
 * branch (the extras medium pill renders rose; the theme selects the palette).
 *
 * Pure module: no React Native imports — deterministic and unit-testable.
 *
 * @see widgets/PrayerWidget.tsx - home screen widget layouts (both schedules)
 * @see widgets/LockPrayerWidget.tsx - Lock Screen widget layouts (both schedules)
 * @see stores/widget.ts - IO layer that pushes built entries to the widgets
 */

import type { WidgetTimelineEntry } from 'expo-widgets';

import { UNAVAILABLE_TIME } from '@/shared/constants';
import {
  compareListOrder,
  findNextReadable,
  findPreviousRow,
  getNextBoundary,
  isReadable,
  resolveDisplayDate,
} from '@/shared/sequence';
import * as TimeUtils from '@/shared/time';
import type { Prayer, PrayerSequence, ReadablePrayer } from '@/shared/types';
import type {
  AndroidWidgetDay,
  PrayerWidgetAndroidProps,
  PrayerWidgetProps,
  PrayerWidgetSettings,
  WidgetPrayerRow,
  WidgetTheme,
} from '@/shared/widgetTypes';
import { ANDROID_SNAPSHOT_VERSION, WIDGET_PROPS_VERSION } from '@/shared/widgetTypes';

/**
 * Minimum spacing between adjacent timeline entries. WidgetKit guidance asks
 * for entries "at least about 5 minutes apart" — closer entries may be
 * coalesced, which would silently skip a prayer-boundary flip or a countdown
 * step.
 */
export const MIN_ENTRY_SPACING_MS = 5 * 60 * 1000;

/**
 * Days of prayer boundaries each push carries, on both platforms. The widget
 * re-reads its stored timeline when it runs out, so this is how long a widget
 * stays correct with no app launch and no background refresh. Three days is
 * what the owner judged enough (owner 2026-09-25): the background task runs
 * every 3 hours and the foreground refresh every 2, so a phone in ordinary use
 * re-pushes dozens of times inside the window. 3 costs 23 iOS entries and
 * ~9.8KB, where 7 cost 47 and ~20KB; WidgetKit answers an over-budget timeline
 * with a silently black widget, never an error.
 *
 * It lives here rather than beside its caller so the volume guards can measure
 * the span that actually ships: `stores/widget.ts` imports react-native and a
 * native module, which a pure unit test cannot.
 */
export const TIMELINE_DAYS = 3;

/**
 * What the widget shows from one boundary until the next: the prayer counted
 * down to, the list day on screen, and when either changes
 */
interface Segment {
  next: ReadablePrayer;
  displayDate: string;
  boundary: Date;
}

/**
 * The segment starting at `at`, or null once no readable row is left to count
 * down to
 *
 * A list day held on screen after the last readable row still ends at 00:00,
 * but an entry has to name a prayer and count down to it, so the stale card
 * takes over from that row instead.
 */
const segmentFrom = (prayers: Prayer[], at: Date): Segment | null => {
  const next = findNextReadable(prayers, at);
  const displayDate = resolveDisplayDate(prayers, at);
  const boundary = getNextBoundary(prayers, at);

  // A readable row still to come always has a list day on screen and a boundary; the last two checks
  // only prove that to the compiler
  if (!next || !displayDate || !boundary) return null;
  return { next, displayDate, boundary };
};

/**
 * Formats a prayer's date in the app's date style (Hijri when the preference
 * is on), matching the home screen's Day component.
 *
 * @param belongsToDate The prayer's Islamic day (YYYY-MM-DD)
 * @param hijriDate Whether the app's Hijri date preference is on
 */
const formatDateLabel = (belongsToDate: string, hijriDate: boolean): string => {
  return hijriDate ? TimeUtils.formatHijriDateLong(belongsToDate) : TimeUtils.formatDateLong(belongsToDate);
};

/**
 * Builds the medium widget's day list for a segment: the rows of the list day
 * on screen, in the order its app page lists them, with `--:--` for a time the
 * provider did not give. It is the day on screen rather than the countdown
 * target's own day because a day with no readable row, and the day before it
 * once its last row has passed, stay on screen until 00:00 London while the
 * countdown already runs to a later day (R8). Istijaba
 * appears only on Fridays by construction — the sequence itself excludes
 * it on non-Fridays (see getPrayerNamesForDate in shared/prayer.ts).
 *
 * @param prayers The prayer sequence
 * @param segment The segment the list is for
 * @returns The day's rows and the active row index (-1 when the prayer counted
 *   down to is not on the day's list, as on a day with no readable row)
 */
const buildDayList = (prayers: Prayer[], segment: Segment): { rows: WidgetPrayerRow[]; activeIndex: number } => {
  const dayPrayers = prayers.filter((prayer) => prayer.belongsToDate === segment.displayDate).sort(compareListOrder);
  const rows = dayPrayers.map((prayer) => ({ name: prayer.english, time: prayer.time ?? UNAVAILABLE_TIME }));

  return { rows, activeIndex: dayPrayers.indexOf(segment.next) };
};

/**
 * Builds one timeline entry per boundary, starting at `now` and capped by a
 * terminal stale entry after the last readable prayer. A boundary is a
 * readable prayer's moment, or 00:00 London ending a list on screen that
 * waits for its day to end (a day with no readable row, or the day before
 * one). Each entry carries the full props snapshot for its segment: the
 * upcoming prayer, the segment bounds (which the layouts hand to SwiftUI as
 * the ticking countdown's interval), the upcoming prayer's date, and the
 * medium widget's day list. Adjacent entries always keep at least
 * MIN_ENTRY_SPACING_MS apart: the first entry is backdated when a boundary
 * is too close to `now`, and a flip crowded by the entry before it waits for
 * its spacing.
 *
 * @param now Current instant
 * @param sequence Prayer sequence in list order (must span `now`)
 * @param settings The in-app settings snapshot the widget mirrors
 * @param theme Palette stamped on every entry — each gallery kind (the
 *   Light/Dark home pairs) receives its own theme-stamped timeline
 * @returns Chronological timeline entries ending with the stale guard, empty
 *  when no readable prayer in the sequence is still to come
 */
export const buildPrayerWidgetTimeline = (
  now: Date,
  sequence: PrayerSequence,
  settings: PrayerWidgetSettings,
  theme: WidgetTheme
): WidgetTimelineEntry<PrayerWidgetProps>[] => {
  const entries: WidgetTimelineEntry<PrayerWidgetProps>[] = [];
  const prayers = sequence.prayers;

  let segment = segmentFrom(prayers, now);
  if (!segment) return entries;

  const makeEntry = (current: Segment, date: Date): WidgetTimelineEntry<PrayerWidgetProps> => {
    const { next } = current;
    const prev = findPreviousRow(prayers, next);
    // The upcoming prayer's own day, not the day on screen: a held day's list has no active row, so the
    // layouts cannot draw it and show that prayer's name and time instead, and a real time must not sit
    // under a day that has none
    const dateLabel = formatDateLabel(next.belongsToDate, settings.hijriDate);
    const dayList = buildDayList(prayers, current);

    return {
      date,
      props: {
        v: WIDGET_PROPS_VERSION,
        schedule: sequence.type,
        theme,
        nextName: next.english,
        nextTime: next.time,
        nextEpochMs: next.datetime.getTime(),
        prevEpochMs: prev ? prev.datetime.getTime() : date.getTime(),
        dateLabel,
        prayers: dayList.rows,
        activeIndex: dayList.activeIndex,
      },
    };
  };

  let cursor = now;
  let lastEmittedMs: number | null = null;
  let finalPrayer = segment.next;

  for (; segment; segment = segmentFrom(prayers, cursor)) {
    const boundaryMs = segment.boundary.getTime();
    let segmentStartMs = cursor.getTime();
    finalPrayer = segment.next;
    cursor = segment.boundary;

    if (lastEmittedMs === null) {
      // The first entry must date at or before `now` so the widget has content
      // immediately, but the boundary flip still needs its 5 minutes of
      // spacing: backdate the first entry when the boundary is imminent. An
      // earlier-dated entry is already "active" at push time, so this is safe.
      // What it shows was worked out at `now`, before the backdating.
      if (boundaryMs - segmentStartMs < MIN_ENTRY_SPACING_MS) segmentStartMs = boundaryMs - MIN_ENTRY_SPACING_MS;
    } else {
      // Only the first entry may move earlier. Boundaries can crowd each other (a held day's 00:00 and the
      // next night's Midnight fall a minute or two apart in early summer), and WidgetKit may coalesce
      // entries closer than the spacing and silently skip a flip, so a crowded flip waits for its spacing
      segmentStartMs = Math.max(segmentStartMs, lastEmittedMs + MIN_ENTRY_SPACING_MS);
    }

    // A flip that had to wait until its own segment was over has nothing left to show: the next segment
    // takes its place and shows what is current by then
    if (segmentStartMs >= boundaryMs) continue;

    entries.push(makeEntry(segment, new Date(segmentStartMs)));
    lastEmittedMs = segmentStartMs;
  }

  // Terminal stale entry: once every real segment has passed, WidgetKit keeps
  // re-rendering the final entry — make that a designed "open Athan to
  // refresh" card instead of silently stale times with clamped 0:00 countdowns.
  // It flips at the last readable prayer, the last moment anything can be
  // counted down to, like every other boundary, pushed to the minimum spacing
  // if the last emitted entry sits pathologically close. Unreadable rows after
  // that prayer give it nothing more to show.
  const finalEpochMs = finalPrayer.datetime.getTime();
  const lastEntryMs = entries[entries.length - 1].date.getTime();
  const staleMs = Math.max(finalEpochMs, lastEntryMs + MIN_ENTRY_SPACING_MS);
  entries.push({
    date: new Date(staleMs),
    props: {
      v: WIDGET_PROPS_VERSION,
      schedule: sequence.type,
      theme,
      nextName: finalPrayer.english,
      nextTime: finalPrayer.time,
      nextEpochMs: finalEpochMs,
      prevEpochMs: finalEpochMs,
      dateLabel: formatDateLabel(finalPrayer.belongsToDate, settings.hijriDate),
      stale: true,
    },
  });

  return entries;
};

/**
 * Builds the Android widget snapshot: one day entry per list day of the
 * sequence (each row's name, time and epoch, unreadable rows as `--:--` with
 * a null epoch), the London midnight starting each day, the day's display
 * label, and the horizon (the last readable prayer) past which renders go
 * stale. The Android layout computes the next prayer, label, day list and
 * active row AT RENDER TIME from this data, so any render inside the window
 * is correct without the app pushing again.
 *
 * Answers null when the sequence holds no readable prayer: the caller skips
 * the push rather than storing an empty window.
 *
 * Pure: reads nothing, calls no clock, throws on nothing.
 *
 * @param sequence Prayer sequence in list order (the push layer builds it
 *   from yesterday, matching the timeline builder)
 * @param settings The in-app settings snapshot the widget mirrors
 */
export const buildPrayerWidgetSnapshot = (
  sequence: PrayerSequence,
  settings: PrayerWidgetSettings
): Omit<PrayerWidgetAndroidProps, 'theme' | 'size'> | null => {
  const days: AndroidWidgetDay[] = [];
  const dayIndexes = new Map<string, number>();
  let horizonEpochMs: number | null = null;

  for (const prayer of sequence.prayers) {
    const existingIndex = dayIndexes.get(prayer.belongsToDate);
    let day = existingIndex !== undefined ? days[existingIndex] : undefined;
    if (day === undefined) {
      day = {
        dateLabel: formatDateLabel(prayer.belongsToDate, settings.hijriDate),
        // London midnight STARTING the date (createPrayerDatetime resolves
        // the offset at the instant, DST-safe) — the render-time day picker
        // compares wall-clock days, and getDayAnchor's noon anchor would
        // keep yesterday picked through every morning
        startEpochMs: TimeUtils.createPrayerDatetime(prayer.belongsToDate, '00:00').getTime(),
        rows: [],
      };
      days.push(day);
      dayIndexes.set(prayer.belongsToDate, days.length - 1);
    }

    if (isReadable(prayer)) {
      day.rows.push({ name: prayer.english, time: prayer.time, epochMs: prayer.datetime.getTime() });
      horizonEpochMs = Math.max(horizonEpochMs ?? Number.NEGATIVE_INFINITY, prayer.datetime.getTime());
    } else {
      day.rows.push({ name: prayer.english, time: UNAVAILABLE_TIME, epochMs: 0 });
    }
  }

  if (horizonEpochMs === null) {
    return null;
  }

  return {
    v: ANDROID_SNAPSHOT_VERSION,
    schedule: sequence.type,
    days,
    horizonEpochMs,
  };
};
