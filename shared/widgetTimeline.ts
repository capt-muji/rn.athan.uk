/**
 * Pure timeline builder for the Athan iOS widgets.
 *
 * Builds timeline entries from a prayer sequence (one entry per prayer
 * boundary) for WidgetKit to render. WidgetKit cannot tick custom-format
 * text, so the countdown — which must mirror the app's exact formatTime
 * style — is precomputed per entry and refreshed by stepped entries every
 * five minutes (WidgetKit's minimum entry spacing) within a 24-hour
 * horizon; beyond it, entries flip only at prayer boundaries. The progress
 * bar stays live on its own between entries via SwiftUI timer intervals.
 *
 * Pure module: no React Native imports — deterministic and unit-testable.
 *
 * @see widgets/PrayerWidget.tsx - home screen widget layout
 * @see widgets/LockPrayerWidget.tsx - Lock Screen widget layout
 * @see stores/widget.ts - IO layer that pushes built entries to the widgets
 */

import type { WidgetTimelineEntry } from 'expo-widgets';

import * as TimeUtils from '@/shared/time';
import type { Prayer, PrayerSequence } from '@/shared/types';
import type { PrayerWidgetProps, PrayerWidgetSettings, WidgetPrayerRow } from '@/shared/widgetTypes';
import { WIDGET_PROPS_VERSION } from '@/shared/widgetTypes';

/**
 * Minimum spacing between adjacent timeline entries. WidgetKit guidance asks
 * for entries "at least about 5 minutes apart" — closer entries may be
 * coalesced, which would silently skip a prayer-boundary flip or a countdown
 * step.
 */
export const MIN_ENTRY_SPACING_MS = 5 * 60 * 1000;

/**
 * Cadence of the stepped countdown entries. Equal to the minimum entry
 * spacing by design: the label refreshes as often as WidgetKit will reliably
 * honor.
 */
export const COUNTDOWN_STEP_MS = MIN_ENTRY_SPACING_MS;

/**
 * How long from the push instant the countdown label stays stepped. Within
 * the horizon the label is at most one step stale; beyond it, entries flip
 * only at prayer boundaries (the label then holds until the next boundary —
 * acceptable degradation for a widget the app has not refreshed in over a
 * day, and it bounds the timeline payload size).
 */
export const STEPPED_COUNTDOWN_HOURS = 24;

/**
 * Formats the countdown for a timeline entry as a minute-ceil label
 * ("1h 12m", "45m", "1m") — seconds never render at any distance and the
 * value always rounds up, so the label holds until the true minute flips.
 * The rounding mirrors getSecondsRemaining in shared/time.ts — ceil, with a
 * floor of 1s.
 *
 * @param at The instant the label describes (entry date, or the push for a
 *   backdated first entry)
 * @param target The upcoming prayer datetime
 */
const formatCountdownAt = (at: Date, target: Date): string => {
  const msLeft = target.getTime() - at.getTime();
  const secondsRemaining = Math.max(1, Math.ceil(msLeft / 1000));
  return TimeUtils.formatCountdownMinutes(secondsRemaining);
};

/**
 * Formats the next prayer's date in the app's date style (Hijri when the
 * preference is on), matching the home screen's Day component.
 *
 * @param belongsToDate The prayer's Islamic day (YYYY-MM-DD)
 * @param hijriDate Whether the app's Hijri date preference is on
 */
const formatDateLabel = (belongsToDate: string, hijriDate: boolean): string => {
  return hijriDate ? TimeUtils.formatHijriDateLong(belongsToDate) : TimeUtils.formatDateLong(belongsToDate);
};

/**
 * Builds the medium widget's day list for a segment: the six Standard
 * prayers of the upcoming prayer's belongsToDate, in chronological order —
 * the same set the app's Standard page shows for its displayDate. The list
 * rolls to the next day exactly when the countdown target does (at Isha),
 * mirroring the app's displayDate semantics. The active row is the upcoming
 * prayer itself; rows before it have passed, rows after it are upcoming.
 *
 * @param prayers Chronologically sorted prayer sequence
 * @param next The upcoming prayer anchoring the displayed day
 * @returns The day's rows and the active row index (-1 when `next` is not
 *   part of its own day — a malformed sequence; the layout degrades)
 */
const buildDayList = (prayers: Prayer[], next: Prayer): { rows: WidgetPrayerRow[]; activeIndex: number } => {
  const dayPrayers = prayers.filter((prayer) => prayer.belongsToDate === next.belongsToDate);
  const activeIndex = dayPrayers.findIndex((prayer) => prayer.datetime.getTime() === next.datetime.getTime());
  const rows = dayPrayers.map((prayer) => ({ name: prayer.english, time: prayer.time }));

  return { rows, activeIndex };
};

/**
 * Builds one timeline entry per prayer boundary, with stepped countdown
 * entries every COUNTDOWN_STEP_MS inside the stepped horizon, starting at
 * `now`, capped by a terminal stale entry after the final prayer. Each entry
 * carries the full props snapshot for its segment: the upcoming prayer, the
 * segment bounds (for the live progress bar), the precomputed countdown
 * label, the upcoming prayer's date, and the medium widget's day list.
 * Adjacent entries always keep at least MIN_ENTRY_SPACING_MS apart: the
 * first entry is backdated when a boundary is too close to `now`, and steps
 * stop one spacing short of the boundary they precede.
 *
 * @param now Current instant
 * @param sequence Chronologically sorted prayer sequence (must span `now`)
 * @param settings The in-app settings snapshot the widget mirrors
 * @returns Chronological timeline entries ending with the stale guard, empty
 *  when the sequence does not cover `now`
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

  const makeEntry = (date: Date, prevIndex: number, labelAt: Date = date): WidgetTimelineEntry<PrayerWidgetProps> => {
    const next = prayers[prevIndex + 1];
    const prev = prevIndex >= 0 ? prayers[prevIndex] : null;
    const countdownLabel = formatCountdownAt(labelAt, next.datetime);
    const dateLabel = formatDateLabel(next.belongsToDate, settings.hijriDate);
    const dayList = buildDayList(prayers, next);

    return {
      date,
      props: {
        v: WIDGET_PROPS_VERSION,
        nextName: next.english,
        nextTime: next.time,
        nextEpochMs: next.datetime.getTime(),
        prevEpochMs: prev ? prev.datetime.getTime() : date.getTime(),
        countdownLabel,
        dateLabel,
        prayers: dayList.rows,
        activeIndex: dayList.activeIndex,
      },
    };
  };

  const steppedUntilMs = now.getTime() + STEPPED_COUNTDOWN_HOURS * 60 * 60 * 1000;

  let cursor = now;
  let prevIndex = firstNextIndex - 1;
  let lastEmittedMs: number | null = null;

  while (prevIndex + 1 < prayers.length) {
    const nextPrayer = prayers[prevIndex + 1];
    const boundaryMs = nextPrayer.datetime.getTime();

    // The first entry must date at or before `now` so the widget has content
    // immediately, but the boundary flip still needs its 5 minutes of
    // spacing: backdate the first entry when the boundary is imminent. An
    // earlier-dated entry is already "active" at push time, so this is safe.
    if (lastEmittedMs === null && boundaryMs - cursor.getTime() < MIN_ENTRY_SPACING_MS) {
      cursor = new Date(boundaryMs - MIN_ENTRY_SPACING_MS);
    }

    // The backdated first entry displays immediately, so its label must
    // describe the remaining time at the push — not at its backdated date
    // (which would show a phantom larger countdown, e.g. "5m" for a prayer
    // only 2 minutes away).
    const segmentStart = cursor;
    entries.push(makeEntry(segmentStart, prevIndex, lastEmittedMs === null ? now : segmentStart));
    lastEmittedMs = segmentStart.getTime();

    // Stepped countdown entries: stop one spacing short of the boundary so
    // the flip entry keeps its gap. A boundary that somehow predates the
    // segment start (duplicate prayer datetimes) yields no steps.
    if (segmentStart.getTime() < steppedUntilMs) {
      const lastStepMs = Math.min(boundaryMs - MIN_ENTRY_SPACING_MS, steppedUntilMs);
      for (let stepMs = segmentStart.getTime() + COUNTDOWN_STEP_MS; stepMs <= lastStepMs; stepMs += COUNTDOWN_STEP_MS) {
        entries.push(makeEntry(new Date(stepMs), prevIndex));
        lastEmittedMs = stepMs;
      }
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
      nextTime: finalPrayer.time,
      nextEpochMs: finalEpochMs,
      prevEpochMs: finalEpochMs,
      countdownLabel: '0s',
      dateLabel: formatDateLabel(finalPrayer.belongsToDate, settings.hijriDate),
      stale: true,
    },
  });

  return entries;
};
