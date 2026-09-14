/**
 * Pure timeline builder for the Athan iOS widgets (standard + extras pairs).
 *
 * Builds timeline entries from a prayer sequence (one entry per boundary)
 * for WidgetKit to render. WidgetKit cannot tick custom-format
 * text, so the countdown — which must mirror the app's exact formatTime
 * style — is precomputed per entry and refreshed by stepped entries every
 * five minutes (WidgetKit's minimum entry spacing) within a 24-hour
 * horizon; beyond it, entries flip only at boundaries. The progress
 * bar stays live on its own between entries via SwiftUI timer intervals.
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
  resolveDisplayDate,
} from '@/shared/sequence';
import * as TimeUtils from '@/shared/time';
import type { Prayer, PrayerSequence, ReadablePrayer } from '@/shared/types';
import type { PrayerWidgetProps, PrayerWidgetSettings, WidgetPrayerRow, WidgetTheme } from '@/shared/widgetTypes';
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
 * the horizon the label refreshes at the step cadence; beyond it, entries
 * flip only at boundaries and carry NO countdown label at all — a
 * label that cannot be refreshed before its boundary would over-read by the
 * whole segment, so the widget shows the name and the absolute time instead
 * (acceptable degradation for a widget the app has not refreshed in over a
 * day, and it bounds the timeline payload size). Segment lengths
 * that are not multiples of the step absorb the remainder in one gap of up
 * to two steps mid-segment (WidgetKit's spacing floor makes one step
 * everywhere mathematically impossible); the final step always anchors
 * exactly one spacing before the boundary flip.
 */
export const STEPPED_COUNTDOWN_HOURS = 24;

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
 * Builds one timeline entry per boundary, with stepped countdown entries
 * every COUNTDOWN_STEP_MS inside the stepped horizon, starting at `now`,
 * capped by a terminal stale entry after the last readable prayer. A boundary
 * is a readable prayer's moment, or 00:00 London ending a list on screen that
 * waits for its day to end (a day with no readable row, or the day before
 * one). Each entry
 * carries the full props snapshot for its segment: the upcoming prayer, the
 * segment bounds (for the live progress bar), the precomputed countdown
 * label, the upcoming prayer's date, and the medium widget's day list.
 * Adjacent entries always keep at least MIN_ENTRY_SPACING_MS apart: the
 * first entry is backdated when a boundary is too close to `now`, steps
 * stop one spacing short of the boundary they precede, and a flip crowded by
 * the entry before it waits for its spacing.
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

  const makeEntry = (current: Segment, date: Date, labelAt: Date = date): WidgetTimelineEntry<PrayerWidgetProps> => {
    const { next } = current;
    const prev = findPreviousRow(prayers, next);
    const countdownLabel = formatCountdownAt(labelAt, next.datetime);
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
        countdownLabel,
        dateLabel,
        prayers: dayList.rows,
        activeIndex: dayList.activeIndex,
      },
    };
  };

  const steppedUntilMs = now.getTime() + STEPPED_COUNTDOWN_HOURS * 60 * 60 * 1000;

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

    // The backdated first entry displays immediately, so its label must
    // describe the remaining time at the push — not at its backdated date
    // (which would show a phantom larger countdown, e.g. "5m" for a prayer
    // only 2 minutes away). A flip that waited describes its own date.
    const segmentStart = new Date(segmentStartMs);
    const openingEntry = makeEntry(segment, segmentStart, lastEmittedMs === null ? now : segmentStart);
    entries.push(openingEntry);
    lastEmittedMs = segmentStartMs;
    let lastSegmentEntry = openingEntry;

    // Stepped countdown entries: the grid is anchored to the boundary cutoff,
    // and the FINAL step always sits exactly one spacing before the boundary
    // (the aligned grid alone can leave a tail gap of almost two spacings
    // when the segment length is not a multiple of the step — real prayer
    // times rarely are). When the horizon, not the boundary, caps the
    // segment, the plain aligned grid holds (staleness beyond the anchor is
    // accepted degradation outside the stepped window). A boundary within one
    // spacing of the segment start yields no steps.
    if (segmentStart.getTime() < steppedUntilMs) {
      const boundaryCutoffMs = boundaryMs - MIN_ENTRY_SPACING_MS;
      const cappedByHorizon = boundaryCutoffMs > steppedUntilMs;
      const lastStepMs = Math.min(boundaryCutoffMs, steppedUntilMs);
      // Aligned steps must keep one spacing of room to the boundary cutoff
      // so the anchor entry below never violates the spacing floor
      const alignedCutoffMs = cappedByHorizon ? lastStepMs : boundaryCutoffMs - MIN_ENTRY_SPACING_MS;

      // Anchored BACKWARDS from the cutoff, not forwards from the segment start. The
      // segment length is almost never a multiple of the step — real prayer intervals
      // are not — so the odd remainder has to sit in one gap somewhere. Forwards put it
      // in the LAST gap, where the countdown is smallest and the same absolute error is
      // proportionally largest: a widget reading "13m" with 5m10s actually left.
      // Backwards puts it in the FIRST gap, where the remaining time is largest and the
      // error is invisible. The five-minute cadence is WidgetKit-forced and unchanged;
      // only where the remainder lands moves.
      const stepsDescending: number[] = [];
      for (
        let stepMs = alignedCutoffMs;
        stepMs >= segmentStart.getTime() + COUNTDOWN_STEP_MS;
        stepMs -= COUNTDOWN_STEP_MS
      ) {
        stepsDescending.push(stepMs);
      }

      for (let index = stepsDescending.length - 1; index >= 0; index--) {
        const stepMs = stepsDescending[index] as number;
        lastSegmentEntry = makeEntry(segment, new Date(stepMs));
        entries.push(lastSegmentEntry);
        lastEmittedMs = stepMs;
      }

      if (!cappedByHorizon && lastStepMs - lastEmittedMs >= MIN_ENTRY_SPACING_MS) {
        lastSegmentEntry = makeEntry(segment, new Date(lastStepMs));
        entries.push(lastSegmentEntry);
        lastEmittedMs = lastStepMs;
      }
    }

    // Where the HORIZON — not WidgetKit's spacing floor — is what stops the
    // stepping, the segment's final entry stays freshest all the way to the
    // flip while its label describes its own date, so it over-reads by the
    // entire remaining gap. Beyond the horizon a segment gets no steps at
    // all, which is how a night segment still reads "9h 50m" five minutes
    // before Fajr: the name, the time and the day stay right and only the
    // countdown lies, with nothing to signal it for the twelve days until
    // the stale card. An empty label is the honest degradation — both
    // layouts already hide it and fall back to the name plus the absolute
    // time (see the length guards in PrayerWidget.tsx and LockPrayerWidget.tsx).
    // The gap that matters runs to the boundary, not to the prayer: a held
    // day's 00:00 entry refreshes the label even though the prayer is later.
    //
    // A gap the spacing floor forces (a segment too short for a second entry)
    // is left alone: that staleness is bounded by the segment and is the
    // settled WidgetKit cost, not this defect.
    const strandedByHorizon = lastEmittedMs + COUNTDOWN_STEP_MS > steppedUntilMs;
    if (strandedByHorizon && boundaryMs - lastEmittedMs > COUNTDOWN_STEP_MS) {
      lastSegmentEntry.props.countdownLabel = '';
    }
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
      countdownLabel: '0s',
      dateLabel: formatDateLabel(finalPrayer.belongsToDate, settings.hijriDate),
      stale: true,
    },
  });

  return entries;
};
