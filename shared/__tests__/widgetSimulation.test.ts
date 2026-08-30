/**
 * Model test for shared/widgetTimeline.ts — the "virtual week"
 *
 * Simulates the passage of time second-by-second across a 16-day span that
 * crosses the London DST fall-back transition (2026-10-25) and contains
 * early-morning Isha days, then asserts the ACTIVE timeline entry (the last
 * entry dated at or before each instant) matches an independently derived
 * expectation at every sampled instant:
 *
 * - segment: the entry's prev/next prayers are exactly the prayers
 *   surrounding the instant, so the countdown interval always brackets it
 * - countdown label: matches the minute-ceil formatter
 *   (formatCountdownMinutes) evaluated at the entry's date
 * - staleness: inside the stepped horizon the active entry is never more
 *   than one countdown step old
 * - date label: the next prayer's Islamic day, in the app's date format
 * - staleness guard: never before the stale entry's date, always after it
 * - spacing: every adjacent entry pair keeps the WidgetKit minimum
 *
 * This replaces weeks of physical-device observation with a deterministic
 * replay: if the builder ever emits a missing flip, a wrong label, or a
 * gap, some sampled instant exposes it.
 */

import { addDays } from 'date-fns';

import { createPrayerDatetime, formatCountdownMinutes, formatDateLong, formatDateShort } from '@/shared/time';
import { type Prayer, type PrayerSequence, ScheduleType } from '@/shared/types';
import {
  buildPrayerWidgetTimeline,
  COUNTDOWN_STEP_MS,
  MIN_ENTRY_SPACING_MS,
  STEPPED_COUNTDOWN_HOURS,
} from '@/shared/widgetTimeline';
import type { PrayerWidgetSettings } from '@/shared/widgetTypes';

// =============================================================================
// FIXTURE: 16 days across the DST fall-back (clocks change 2026-10-25)
// =============================================================================

const PUSH_AT = createPrayerDatetime('2026-10-18', '12:00');
const SPAN_START = '2026-10-17';
const SPAN_DAYS = 16;

const SETTINGS: PrayerWidgetSettings = {
  hijriDate: false,
};

/** Realistic October London times */
const OCTOBER_TIMES: [string, string, string][] = [
  ['Fajr', 'الفجر', '05:30'],
  ['Sunrise', 'الشروق', '07:10'],
  ['Dhuhr', 'الظهر', '12:45'],
  ['Asr', 'العصر', '15:20'],
  ['Magrib', 'المغرب', '18:05'],
  ['Isha', 'العشاء', '19:40'],
];

/** Days whose Isha crosses midnight (01:05 next day, belongs to this day) */
const EARLY_ISHA_DAYS = new Set(['2026-10-20', '2026-10-21']);

const makeFixturePrayer = (
  date: string,
  time: string,
  english: string,
  arabic: string,
  belongsToDate: string
): Prayer => ({
  type: ScheduleType.Standard,
  english,
  arabic,
  datetime: createPrayerDatetime(date, time),
  time,
  belongsToDate,
});

const makeSequence = (): PrayerSequence => {
  const prayers: Prayer[] = [];
  const startDay = createPrayerDatetime(SPAN_START, '12:00');

  for (let dayIndex = 0; dayIndex < SPAN_DAYS; dayIndex++) {
    const day = addDays(startDay, dayIndex);
    const dateString = formatDateShort(day);
    const ishaEarly = EARLY_ISHA_DAYS.has(dateString);

    for (const [english, arabic, time] of OCTOBER_TIMES) {
      if (english === 'Isha' && ishaEarly) {
        // Early-morning Isha: datetime lands the next calendar day but the
        // prayer belongs to this Islamic day (ADR-004)
        const nextDay = addDays(day, 1);
        const nextDayString = formatDateShort(nextDay);
        prayers.push(makeFixturePrayer(nextDayString, '01:05', english, arabic, dateString));
        continue;
      }
      prayers.push(makeFixturePrayer(dateString, time, english, arabic, dateString));
    }
  }

  prayers.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
  return { type: ScheduleType.Standard, prayers };
};

// =============================================================================
// INDEPENDENT EXPECTATION MODEL
// =============================================================================

const activeEntryAt = <T extends { date: Date }>(entries: T[], instant: number): T | undefined => {
  let active: T | undefined;
  for (const entry of entries) {
    if (entry.date.getTime() <= instant) active = entry;
    else break;
  }
  return active;
};

// =============================================================================
// THE VIRTUAL WEEK
// =============================================================================

describe('virtual week model test', () => {
  const sequence = makeSequence();
  const prayers = sequence.prayers;
  const entries = buildPrayerWidgetTimeline(PUSH_AT, sequence, SETTINGS);

  const finalPrayer = prayers[prayers.length - 1];
  // The stale entry flips at the final prayer, pushed later only if the last
  // real entry sits within the minimum spacing of it
  const lastRealEntryMs = entries[entries.length - 2].date.getTime();
  const staleDateMs = Math.max(finalPrayer.datetime.getTime(), lastRealEntryMs + MIN_ENTRY_SPACING_MS);
  const horizonMs = PUSH_AT.getTime() + STEPPED_COUNTDOWN_HOURS * 60 * 60 * 1000;

  /** Every interesting instant: entry dates, prayers, stale — all ±1s */
  const sampleInstants = (): number[] => {
    const instants = new Set<number>();

    const add = (ms: number) => {
      instants.add(ms - 1000);
      instants.add(ms);
      instants.add(ms + 1000);
    };

    for (const entry of entries) add(entry.date.getTime());
    for (const prayer of prayers) add(prayer.datetime.getTime());
    add(staleDateMs);

    // Deterministic coverage between events: every 7 minutes across the span
    const spanStart = PUSH_AT.getTime();
    for (let ms = spanStart; ms <= staleDateMs; ms += 7 * 60 * 1000) {
      instants.add(ms);
    }

    return [...instants].sort((a, b) => a - b);
  };

  it('keeps the timeline start at or before the push instant', () => {
    expect(entries[0].date.getTime()).toBeLessThanOrEqual(PUSH_AT.getTime());
  });

  it('keeps every adjacent entry pair at least the minimum spacing apart', () => {
    for (let i = 1; i < entries.length; i++) {
      const gapMs = entries[i].date.getTime() - entries[i - 1].date.getTime();
      expect(gapMs).toBeGreaterThanOrEqual(MIN_ENTRY_SPACING_MS);
    }
  });

  it('shows an active entry that brackets the instant with an app-format countdown', () => {
    const instants = sampleInstants();
    const timelineStartMs = entries[0].date.getTime();

    for (const instant of instants) {
      if (instant < timelineStartMs) continue;

      const active = activeEntryAt(entries, instant);
      if (active === undefined) {
        throw new Error(`No active entry at ${new Date(instant).toISOString()}`);
      }

      const props = active.props;

      if (instant >= staleDateMs) {
        // After the final prayer + delay the stale card owns the surface
        if (props.stale !== true) {
          throw new Error(`Expected stale card active at ${new Date(instant).toISOString()}`);
        }
        continue;
      }

      if (props.stale === true) {
        throw new Error(`Stale card active too early at ${new Date(instant).toISOString()}`);
      }

      // Independent expectation: the prayers surrounding this instant
      const prevPrayer = prayers.filter((prayer) => prayer.datetime.getTime() <= instant).at(-1);
      const nextPrayer = prayers.find((prayer) => prayer.datetime.getTime() > instant);

      if (!prevPrayer || !nextPrayer) {
        throw new Error(`Instant ${new Date(instant).toISOString()} not bracketed by fixture prayers`);
      }

      const prevMs = prevPrayer.datetime.getTime();
      const nextMs = nextPrayer.datetime.getTime();

      if (props.nextEpochMs !== nextMs || props.prevEpochMs !== prevMs) {
        throw new Error(
          `Segment mismatch at ${new Date(instant).toISOString()}: entry says ` +
            `${props.prevEpochMs}->${props.nextEpochMs}, expected ${prevMs}->${nextMs}`
        );
      }

      // The countdown interval must bracket the instant being displayed
      if (instant < props.prevEpochMs || instant > props.nextEpochMs) {
        throw new Error(`Countdown interval does not bracket ${new Date(instant).toISOString()}`);
      }

      // The label is the minute-ceil value at the entry's date (the push
      // instant for a backdated first entry)
      const labelAnchorMs = Math.max(active.date.getTime(), PUSH_AT.getTime());
      const msLeft = nextMs - labelAnchorMs;
      const secondsRemaining = Math.max(1, Math.ceil(msLeft / 1000));
      const expectedLabel = formatCountdownMinutes(secondsRemaining);
      if (props.countdownLabel !== expectedLabel) {
        throw new Error(
          `Countdown label mismatch at ${new Date(instant).toISOString()}: entry says ` +
            `"${props.countdownLabel}", app formatter says "${expectedLabel}"`
        );
      }

      // The date label is the next prayer's Islamic day in the app format
      if (props.dateLabel !== formatDateLong(nextPrayer.belongsToDate)) {
        throw new Error(
          `Date label mismatch at ${new Date(instant).toISOString()}: entry says ` +
            `"${props.dateLabel}", expected "${formatDateLong(nextPrayer.belongsToDate)}"`
        );
      }

      // Inside the stepped horizon the label is never more than one step old
      if (instant <= horizonMs && instant - active.date.getTime() > COUNTDOWN_STEP_MS) {
        throw new Error(
          `Label at ${new Date(instant).toISOString()} is ${(instant - active.date.getTime()) / 60000} minutes stale (max one step)`
        );
      }
    }
  });

  it('flips the countdown target exactly at the boundary instants', () => {
    const nextAt = (instant: number) => activeEntryAt(entries, instant)?.props.nextName;

    // Just before Asr on the push day the target is Asr; just after the
    // Asr boundary it is Magrib
    const asrBoundary = createPrayerDatetime('2026-10-18', '15:20').getTime();
    expect(nextAt(asrBoundary - 1000)).toBe('Asr');
    expect(nextAt(asrBoundary)).toBe('Magrib');
    expect(nextAt(asrBoundary + 1000)).toBe('Magrib');
  });

  it('shows the next day before midnight once Isha has passed', () => {
    // 23:00 on the push day: Isha (19:40) has passed, Fajr is next — the
    // date label already rolls to the 19th while it is still the 18th
    const lateEvening = createPrayerDatetime('2026-10-18', '23:00').getTime();
    const active = activeEntryAt(entries, lateEvening);

    expect(active).toBeDefined();
    if (!active) return;
    expect(active.props.nextName).toBe('Fajr');
    expect(active.props.prevEpochMs).toBe(createPrayerDatetime('2026-10-18', '19:40').getTime());
    expect(active.props.dateLabel).toBe(formatDateLong('2026-10-19'));
  });

  it('treats an early-morning Isha as the next prayer of its Islamic day', () => {
    // Oct 20's Isha is at 01:05 on Oct 21. After Oct 20's Magrib (18:05),
    // the next prayer is the early Isha and the date label is Oct 20's day.
    const afterMagrib = createPrayerDatetime('2026-10-20', '19:00').getTime();
    const active = activeEntryAt(entries, afterMagrib);

    expect(active).toBeDefined();
    if (!active) return;
    expect(active.props.nextName).toBe('Isha');
    expect(active.props.nextTime).toBe('01:05');
    expect(active.props.dateLabel).toBe(formatDateLong('2026-10-20'));
  });

  it('crosses the DST fall-back night without gaps or double entries', () => {
    // The night of 2026-10-24 -> 2026-10-25 (clocks 02:00 BST -> 01:00 GMT).
    // Entries in this window must stay strictly increasing with spacing.
    const nightStart = createPrayerDatetime('2026-10-24', '20:00').getTime();
    const nightEnd = createPrayerDatetime('2026-10-25', '12:00').getTime();
    const windowEntries = entries.filter(
      (entry) => entry.date.getTime() >= nightStart && entry.date.getTime() <= nightEnd
    );

    // Beyond the stepped horizon only boundary flips cross this window
    // (Fajr and Sunrise on Oct 25) — still continuous with legal spacing
    expect(windowEntries.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < windowEntries.length; i++) {
      const gapMs = windowEntries[i].date.getTime() - windowEntries[i - 1].date.getTime();
      expect(gapMs).toBeGreaterThanOrEqual(MIN_ENTRY_SPACING_MS);
    }
  });

  it('ends the timeline with the stale guard after the final prayer', () => {
    const last = entries[entries.length - 1];
    expect(last.props.stale).toBe(true);
    expect(last.date.getTime()).toBe(staleDateMs);
    expect(activeEntryAt(entries, staleDateMs)?.props.stale).toBe(true);
    expect(activeEntryAt(entries, staleDateMs - 1000)?.props.stale).not.toBe(true);
  });
});
