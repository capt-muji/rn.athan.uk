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
 * A second virtual week runs the SAME span through the Extra schedule
 * (two Fridays inside), additionally asserting the medium list's canonical
 * EXTRAS_ENGLISH ordering, Istijaba's Friday-only presence (5 rows on
 * Fridays, 4 otherwise), and the extras `schedule` stamp on every entry.
 *
 * Two more groups run the app's own list builder (createPrayerSequence) over
 * real London times from 2024. Fully readable spans must produce exactly the
 * bytes the builder produced before rows could be unreadable. Spans with
 * unreadable rows, one prayer, a whole day stored unreadable or not stored at
 * all, a last row, a Magrib or Fajr and the night rows it takes with it, run
 * through a model restating the rules the app's screens follow.
 *
 * This replaces weeks of physical-device observation with a deterministic
 * replay: if the builder ever emits a missing flip, a wrong label, or a
 * gap, some sampled instant exposes it.
 */

jest.mock('@/stores/database', () => ({ getPrayerByDateString: jest.fn() }));

import { createHash } from 'node:crypto';
import { addDays } from 'date-fns';

import { MOCK_DATA_FULL } from '@/mocks/full';
import { EXTRAS_ENGLISH, PRAYERS_ENGLISH } from '@/shared/constants';
import { createPrayerSequence, transformApiData } from '@/shared/prayer';
import {
  addDaysToDateString,
  createPrayerDatetime,
  formatCountdownMinutes,
  formatDateLong,
  formatDateShort,
  getPreviousDateString,
} from '@/shared/time';
import {
  type ISingleApiResponseTransformed,
  type IValidatedApiResponse,
  type Prayer,
  type PrayerSequence,
  type ReadablePrayer,
  type RequiredTimeName,
  ScheduleType,
} from '@/shared/types';
import {
  buildPrayerWidgetTimeline,
  COUNTDOWN_STEP_MS,
  MIN_ENTRY_SPACING_MS,
  STEPPED_COUNTDOWN_HOURS,
} from '@/shared/widgetTimeline';
import type { PrayerWidgetSettings } from '@/shared/widgetTypes';
import * as Database from '@/stores/database';

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
): ReadablePrayer => ({
  type: ScheduleType.Standard,
  english,
  arabic,
  datetime: createPrayerDatetime(date, time),
  time,
  belongsToDate,
});

const makeSequence = () => {
  const prayers: ReadablePrayer[] = [];
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
  const entries = buildPrayerWidgetTimeline(PUSH_AT, sequence, SETTINGS, 'light');

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

      // An entry the horizon strands — no further step fits inside the
      // horizon and the boundary is still more than a step away — shows no
      // countdown at all, because one computed at its date would over-read
      // by the whole remaining gap. Every other entry carries the minute-ceil
      // value at its own date (the push instant for a backdated first entry).
      if (props.countdownLabel === '') {
        const noStepFits = active.date.getTime() + COUNTDOWN_STEP_MS > horizonMs;
        const boundaryFarther = nextMs - active.date.getTime() > COUNTDOWN_STEP_MS;
        if (!noStepFits || !boundaryFarther) {
          throw new Error(
            `Countdown blanked without cause at ${new Date(instant).toISOString()}: entry dated ` +
              `${active.date.toISOString()}, horizon ${new Date(horizonMs).toISOString()}, boundary ${new Date(nextMs).toISOString()}`
          );
        }
      } else {
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
      }

      // The date label is the next prayer's Islamic day in the app format
      if (props.dateLabel !== formatDateLong(nextPrayer.belongsToDate)) {
        throw new Error(
          `Date label mismatch at ${new Date(instant).toISOString()}: entry says ` +
            `"${props.dateLabel}", expected "${formatDateLong(nextPrayer.belongsToDate)}"`
        );
      }

      // The medium widget's day list is exactly the app's Standard page for
      // the next prayer's day (same rows, same order), and the active row is
      // the countdown target itself
      const dayPrayers = prayers.filter((prayer) => prayer.belongsToDate === nextPrayer.belongsToDate);
      const expectedRows = dayPrayers.map((prayer) => ({ name: prayer.english, time: prayer.time }));
      const expectedActiveIndex = dayPrayers.findIndex((prayer) => prayer.datetime.getTime() === nextMs);

      if (!Array.isArray(props.prayers) || props.activeIndex !== expectedActiveIndex) {
        throw new Error(
          `Day list state mismatch at ${new Date(instant).toISOString()}: entry says ` +
            `activeIndex ${props.activeIndex}, expected ${expectedActiveIndex}`
        );
      }
      if (JSON.stringify(props.prayers) !== JSON.stringify(expectedRows)) {
        throw new Error(`Day list rows mismatch at ${new Date(instant).toISOString()}`);
      }
      if (props.prayers?.[expectedActiveIndex]?.name !== props.nextName) {
        throw new Error(`Active row is not the countdown target at ${new Date(instant).toISOString()}`);
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

  it('slides the active row down the list and rolls it over after Isha', () => {
    const activeRowAt = (instant: number) => {
      const active = activeEntryAt(entries, instant);
      const props = active?.props;
      if (!props || !Array.isArray(props.prayers) || typeof props.activeIndex !== 'number') return null;
      return { index: props.activeIndex, name: props.prayers[props.activeIndex]?.name };
    };

    // Within Oct 18 the active index advances one row per prayer boundary
    const magribBoundary = createPrayerDatetime('2026-10-18', '18:05').getTime();
    expect(activeRowAt(magribBoundary - 1000)).toEqual({ index: 4, name: 'Magrib' });
    expect(activeRowAt(magribBoundary + 1000)).toEqual({ index: 5, name: 'Isha' });

    // After Isha the list rolls to the NEXT day with the pill back on row 1
    const afterIsha = createPrayerDatetime('2026-10-18', '20:00').getTime();
    expect(activeRowAt(afterIsha)).toEqual({ index: 0, name: 'Fajr' });

    const rolled = activeEntryAt(entries, afterIsha)?.props;
    const rolledDay = prayers.filter((prayer) => prayer.belongsToDate === '2026-10-19');
    expect(rolled?.prayers?.map((row) => row.time)).toEqual(rolledDay.map((prayer) => prayer.time));
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

// =============================================================================
// EXTRAS VIRTUAL WEEK — same span, extra schedule, two Fridays inside
// =============================================================================

/**
 * Winter extras clock times (see transformApiData): Midnight 23:52 sits the
 * PREVIOUS calendar evening while belonging to the raw day (the creation
 * rule for night prayers with hours >= 12); Last Third 02:15, Suhoor 05:55,
 * Duha 08:10 land on the raw day; Istijaba 16:00 exists only on Fridays
 * (2026-10-23 and 2026-10-30 inside the span).
 */
const EXTRAS_TIMES = {
  midnight: '23:52',
  lastThird: '02:15',
  suhoor: '05:55',
  duha: '08:10',
  istijaba: '16:00',
} as const;

const makeExtrasFixturePrayer = (
  date: string,
  time: string,
  english: string,
  belongsToDate: string
): ReadablePrayer => ({
  type: ScheduleType.Extra,
  english,
  arabic: english,
  datetime: createPrayerDatetime(date, time),
  time,
  belongsToDate,
});

const makeExtrasSequence = () => {
  const prayers: ReadablePrayer[] = [];
  const startDay = createPrayerDatetime(SPAN_START, '12:00');

  for (let dayIndex = 0; dayIndex < SPAN_DAYS; dayIndex++) {
    const day = addDays(startDay, dayIndex);
    const dateString = formatDateShort(day);
    const previousDay = formatDateShort(addDays(day, -1));
    const isFriday = createPrayerDatetime(dateString, '12:00').getUTCDay() === 5;

    prayers.push(makeExtrasFixturePrayer(previousDay, EXTRAS_TIMES.midnight, 'Midnight', dateString));
    prayers.push(makeExtrasFixturePrayer(dateString, EXTRAS_TIMES.lastThird, 'Last Third', dateString));
    prayers.push(makeExtrasFixturePrayer(dateString, EXTRAS_TIMES.suhoor, 'Suhoor', dateString));
    prayers.push(makeExtrasFixturePrayer(dateString, EXTRAS_TIMES.duha, 'Duha', dateString));

    if (isFriday) {
      prayers.push(makeExtrasFixturePrayer(dateString, EXTRAS_TIMES.istijaba, 'Istijaba', dateString));
    }
  }

  prayers.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
  return { type: ScheduleType.Extra, prayers };
};

/** Canonical display rank of an extras prayer (EXTRAS_ENGLISH order) */
const extrasRank = (english: string): number => {
  const rank = EXTRAS_ENGLISH.indexOf(english);
  return rank === -1 ? EXTRAS_ENGLISH.length : rank;
};

describe('extras virtual week model test', () => {
  const sequence = makeExtrasSequence();
  const prayers = sequence.prayers;
  const entries = buildPrayerWidgetTimeline(PUSH_AT, sequence, SETTINGS, 'light');

  const finalPrayer = prayers[prayers.length - 1];
  const lastRealEntryMs = entries[entries.length - 2].date.getTime();
  const staleDateMs = Math.max(finalPrayer.datetime.getTime(), lastRealEntryMs + MIN_ENTRY_SPACING_MS);
  const horizonMs = PUSH_AT.getTime() + STEPPED_COUNTDOWN_HOURS * 60 * 60 * 1000;

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

  it('stamps every entry with the extras schedule', () => {
    expect(entries.every((entry) => entry.props.schedule === 'extra')).toBe(true);
  });

  it('shows an active entry that brackets the instant with a canonical day list', () => {
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
        if (props.stale !== true) {
          throw new Error(`Expected stale card active at ${new Date(instant).toISOString()}`);
        }
        continue;
      }

      if (props.stale === true) {
        throw new Error(`Stale card active too early at ${new Date(instant).toISOString()}`);
      }

      // Independent expectation: the extras surrounding this instant
      const prevPrayer = prayers.filter((prayer) => prayer.datetime.getTime() <= instant).at(-1);
      const nextPrayer = prayers.find((prayer) => prayer.datetime.getTime() > instant);

      if (!prevPrayer || !nextPrayer) {
        throw new Error(`Instant ${new Date(instant).toISOString()} not bracketed by fixture prayers`);
      }

      const nextMs = nextPrayer.datetime.getTime();

      if (props.nextEpochMs !== nextMs || props.prevEpochMs !== prevPrayer.datetime.getTime()) {
        throw new Error(`Segment mismatch at ${new Date(instant).toISOString()}`);
      }

      // An entry the horizon strands shows no countdown (see the standard
      // sweep); every other entry carries the minute-ceil value at its date
      if (props.countdownLabel === '') {
        const noStepFits = active.date.getTime() + COUNTDOWN_STEP_MS > horizonMs;
        const boundaryFarther = nextMs - active.date.getTime() > COUNTDOWN_STEP_MS;
        if (!noStepFits || !boundaryFarther) {
          throw new Error(`Countdown blanked without cause at ${new Date(instant).toISOString()}`);
        }
      } else {
        const labelAnchorMs = Math.max(active.date.getTime(), PUSH_AT.getTime());
        const msLeft = nextMs - labelAnchorMs;
        const secondsRemaining = Math.max(1, Math.ceil(msLeft / 1000));
        const expectedLabel = formatCountdownMinutes(secondsRemaining);
        if (props.countdownLabel !== expectedLabel) {
          throw new Error(`Countdown label mismatch at ${new Date(instant).toISOString()}`);
        }
      }

      // The date label is the next prayer's Islamic day in the app format
      if (props.dateLabel !== formatDateLong(nextPrayer.belongsToDate)) {
        throw new Error(`Date label mismatch at ${new Date(instant).toISOString()}`);
      }

      // The medium widget's day list is exactly the app's Extras page for
      // the next prayer's day: same rows in CANONICAL order (chronological
      // filtering, then EXTRAS_ENGLISH ranking), Istijaba present only on
      // Fridays, and the active row is the countdown target itself
      const dayPrayers = prayers
        .filter((prayer) => prayer.belongsToDate === nextPrayer.belongsToDate)
        .sort((a, b) => extrasRank(a.english) - extrasRank(b.english));
      const expectedRows = dayPrayers.map((prayer) => ({ name: prayer.english, time: prayer.time }));
      const expectedActiveIndex = dayPrayers.findIndex((prayer) => prayer.datetime.getTime() === nextMs);

      if (!Array.isArray(props.prayers) || props.activeIndex !== expectedActiveIndex) {
        throw new Error(
          `Day list state mismatch at ${new Date(instant).toISOString()}: entry says ` +
            `activeIndex ${props.activeIndex}, expected ${expectedActiveIndex}`
        );
      }
      if (JSON.stringify(props.prayers) !== JSON.stringify(expectedRows)) {
        throw new Error(`Day list rows mismatch at ${new Date(instant).toISOString()}`);
      }
      if (props.prayers?.[expectedActiveIndex]?.name !== props.nextName) {
        throw new Error(`Active row is not the countdown target at ${new Date(instant).toISOString()}`);
      }

      // Istijaba appears in a day list only when that day is a Friday
      const istijabaRow = props.prayers?.find((row) => row.name === 'Istijaba');
      if (istijabaRow !== undefined) {
        const isFridayBelong = createPrayerDatetime(nextPrayer.belongsToDate, '12:00').getUTCDay() === 5;
        if (!isFridayBelong) {
          throw new Error(`Istijaba listed on a non-Friday day at ${new Date(instant).toISOString()}`);
        }
      }

      // Inside the stepped horizon the label is never more than two steps
      // old. One step is the design cadence, but a segment whose length is
      // not a multiple of the step (real prayer times rarely are) must
      // absorb the remainder somewhere: with WidgetKit's 5-minute spacing
      // floor, a uniform one-step grid cannot hit both the segment start
      // and the boundary anchor — one gap of up to two steps is
      // mathematically unavoidable (the builder places it mid-segment and
      // guarantees the anchor sits exactly one spacing before the flip).
      if (instant <= horizonMs && instant - active.date.getTime() > 2 * COUNTDOWN_STEP_MS) {
        throw new Error(`Label at ${new Date(instant).toISOString()} is more than two steps stale`);
      }
    }
  });

  it('flips the countdown target exactly at the Duha boundary on a Friday', () => {
    const nextAt = (instant: number) => activeEntryAt(entries, instant)?.props.nextName;

    // Friday 2026-10-23: Duha 08:10 hands off to Istijaba 16:00
    const duhaBoundary = createPrayerDatetime('2026-10-23', '08:10').getTime();
    expect(nextAt(duhaBoundary - 1000)).toBe('Duha');
    expect(nextAt(duhaBoundary)).toBe('Istijaba');
    expect(nextAt(duhaBoundary + 1000)).toBe('Istijaba');
  });

  it('grows Friday to five rows with Istijaba active last, then rolls at its boundary', () => {
    const activeRowAt = (instant: number) => {
      const active = activeEntryAt(entries, instant);
      const props = active?.props;
      if (!props || !Array.isArray(props.prayers) || typeof props.activeIndex !== 'number') return null;
      return {
        index: props.activeIndex,
        name: props.prayers[props.activeIndex]?.name,
        rowCount: props.prayers.length,
      };
    };

    // Friday midday: Istijaba active at canonical index 4 of 5 rows
    const fridayNoon = createPrayerDatetime('2026-10-23', '12:00').getTime();
    expect(activeRowAt(fridayNoon)).toEqual({ index: 4, name: 'Istijaba', rowCount: 5 });

    // At the Istijaba boundary the list rolls to Saturday's four rows with
    // the night's Midnight active at index 0 — Istijaba disappears
    const istijabaBoundary = createPrayerDatetime('2026-10-23', '16:00').getTime();
    expect(activeRowAt(istijabaBoundary)).toEqual({ index: 0, name: 'Midnight', rowCount: 4 });

    // A non-Friday midday list is four rows with Duha active at index 3
    const sundayNoon = createPrayerDatetime('2026-10-25', '12:00').getTime();
    expect(activeRowAt(sundayNoon)).toEqual({ index: 0, name: 'Midnight', rowCount: 4 });
  });

  it('ends the timeline with an extras-stamped stale guard after the final prayer', () => {
    const last = entries[entries.length - 1];
    expect(last.props.stale).toBe(true);
    expect(last.props.schedule).toBe('extra');
    expect(last.date.getTime()).toBe(staleDateMs);
    expect(activeEntryAt(entries, staleDateMs)?.props.stale).toBe(true);
    expect(activeEntryAt(entries, staleDateMs - 1000)?.props.stale).not.toBe(true);
  });
});

// =============================================================================
// REAL SEQUENCES: the app's own list builder over real London times (2024)
// =============================================================================

const isReadableRow = (prayer: Prayer): prayer is ReadablePrayer => prayer.datetime !== null;

/** Real 2024 times as a download stores them, with the named times unreadable and the named days not stored */
const storedDays = (
  unreadable: Record<string, RequiredTimeName[]>,
  notStored: string[]
): ISingleApiResponseTransformed[] => {
  const times: IValidatedApiResponse['times'] = {};

  for (const [date, day] of Object.entries(MOCK_DATA_FULL.times)) {
    if (notStored.includes(date)) continue;

    const record: Record<RequiredTimeName, string | null> = {
      fajr: day.fajr,
      sunrise: day.sunrise,
      dhuhr: day.dhuhr,
      asr: day.asr,
      magrib: day.magrib,
      isha: day.isha,
    };
    for (const name of unreadable[date] ?? []) record[name] = null;
    times[date] = record;
  }

  return transformApiData({ city: MOCK_DATA_FULL.city, times });
};

/** A sequence built as stores/widget.ts builds one, with `records` as the only stored days */
const buildStoredSequence = (
  type: ScheduleType,
  records: ISingleApiResponseTransformed[],
  firstDate: string,
  dayCount: number
): PrayerSequence => {
  const stored = new Map(records.map((record) => [record.date, record]));
  (Database.getPrayerByDateString as jest.Mock).mockImplementation((date: string) => stored.get(date) ?? null);

  return createPrayerSequence(type, createPrayerDatetime(firstDate, '12:00'), dayCount);
};

describe('fully readable real sequences', () => {
  const records = storedDays({}, []);

  /**
   * SHA-256 of every timeline each case builds, from shared/widgetTimeline.ts as it was before a row
   * could be unreadable (1d855ea). A sequence with no unreadable row meets the same rules it met then,
   * so it must get the same bytes: a mismatch here is a change to the widgets, not to unreadable rows.
   */
  const BEFORE_UNREADABLE_ROWS: [string, string][] = [
    ['2024-01-10', '492a066d5ea2782f16f7f4cf874c152e4f7194809c555d7315dfb5eeae674dcf'],
    ['2024-02-20', 'c42d7e3aa9a4a6dbf6f2f62d6af864c51de3f5358e7ba00581a1ab51b9632b4c'],
    // Across the spring clock change (31 March)
    ['2024-03-24', 'b896daf2ec4c97130f8cb6493c8d5db6e78d87a84b96448e335748a90b4a3abb'],
    ['2024-04-15', '68aa9c4bb72be0dfdac083cadc5ebf3acbd3f668cb4ac5904e683bb20be1f3aa'],
    ['2024-05-06', '7c076269cd8dde076d3dce9eda28bf779ed00b0a194b6feca1fb244dcd56473c'],
    ['2024-06-14', '94decf789e374a02e5e0c7d8484cb67161b4edb3684b4e1544cf0062f50aac05'],
    ['2024-07-01', 'e3188e71bfeffe8a8f36c5589c3e871ce5d5f5136fbf8854e223b33ccc73782c'],
    ['2024-08-12', 'fa62e666290d3b7464083a0313c56031ee488dc306e6fae553c85b94326e76c7'],
    ['2024-09-02', 'f594a06bbe8d92f6281ab2bfd69399f8ad991dba08bb096717cb47de8750de73'],
    // Across the autumn clock change (27 October)
    ['2024-10-20', 'ad586ecbc6da3078503e290236e2b0454d6ce025360ca85245a24b7ab01a2f83'],
    ['2024-11-11', 'a90e1a5586905cf1a114422c12671abcada70897c8d2d0a686dd3f87af45d36c'],
    ['2024-12-15', '089098062d794ee1fda0316dcbe78e4bc721428e90edff5a343a10bbecc71cf6'],
  ];

  /** Midnight, noon, and two minutes before and exactly on every row of the push day's list */
  const pushInstants = (sequence: PrayerSequence, pushDate: string): Date[] => [
    createPrayerDatetime(pushDate, '00:00'),
    createPrayerDatetime(pushDate, '12:00'),
    ...sequence.prayers
      .filter(isReadableRow)
      .filter((prayer) => prayer.belongsToDate === pushDate)
      .flatMap((prayer) => [new Date(prayer.datetime.getTime() - 2 * 60 * 1000), prayer.datetime]),
  ];

  it.each(BEFORE_UNREADABLE_ROWS)('builds the same bytes as before from the span starting %s', (firstDate, digest) => {
    const hash = createHash('sha256');

    for (const type of [ScheduleType.Standard, ScheduleType.Extra]) {
      const sequence = buildStoredSequence(type, records, firstDate, SPAN_DAYS);
      // One unreadable row would take the case outside what this test can claim
      expect(sequence.prayers.every(isReadableRow)).toBe(true);

      for (const pushAt of pushInstants(sequence, addDaysToDateString(firstDate, 1))) {
        hash.update(JSON.stringify(buildPrayerWidgetTimeline(pushAt, sequence, SETTINGS, 'light')));
      }
    }

    expect(hash.digest('hex')).toBe(digest);
  });
});

// =============================================================================
// UNREADABLE ROWS OVER REAL SEQUENCES
//
// The same kind of span the widget pushes (yesterday plus fifteen days), across
// the clock change of 27 October 2024, with a fault wherever a rule has
// something to do.
// =============================================================================

const REAL_PUSH_AT = createPrayerDatetime('2024-10-20', '12:00');
const REAL_SPAN_START = '2024-10-19';

/** A day with no readable time at all, inside the stepped horizon: either stored that way or not stored */
const HELD_DAY = '2024-10-21';

/** A day not stored at all, beyond the horizon */
const NOT_STORED = '2024-10-28';

const REAL_FAULTS: Record<string, RequiredTimeName[]> = {
  // One prayer, on the push day
  '2024-10-20': ['asr'],
  // The last row of a Standard list
  '2024-10-23': ['isha'],
  // A Friday's Magrib, which takes its Istijaba and the next night's Midnight and Last Third with it
  '2024-10-25': ['magrib'],
  // A Fajr, which takes its Suhoor and the night leading into its day with it
  '2024-10-31': ['fajr'],
  // The span ends on unreadable rows on both lists: Isha, and Duha by way of Sunrise
  '2024-11-03': ['sunrise', 'isha'],
};

const EXTRAS_WEEKDAY = ['Midnight', 'Last Third', 'Suhoor', 'Duha'];

/** Every unreadable row the faults above must produce, by list day; any other day is fully readable */
const EXPECTED_UNREADABLE: Record<ScheduleType, Record<string, string[]>> = {
  [ScheduleType.Standard]: {
    '2024-10-20': ['Asr'],
    [HELD_DAY]: PRAYERS_ENGLISH,
    '2024-10-23': ['Isha'],
    '2024-10-25': ['Magrib'],
    [NOT_STORED]: PRAYERS_ENGLISH,
    '2024-10-31': ['Fajr'],
    '2024-11-03': ['Sunrise', 'Isha'],
  },
  [ScheduleType.Extra]: {
    [HELD_DAY]: EXTRAS_WEEKDAY,
    '2024-10-22': ['Midnight', 'Last Third'],
    '2024-10-25': ['Istijaba'],
    '2024-10-26': ['Midnight', 'Last Third'],
    [NOT_STORED]: EXTRAS_WEEKDAY,
    '2024-10-29': ['Midnight', 'Last Third'],
    '2024-10-31': ['Midnight', 'Last Third', 'Suhoor'],
    '2024-11-03': ['Duha'],
  },
};

/** Moments where passing over an unreadable row is visible, with what the widget must show then */
const SPOT_CHECKS: Record<
  ScheduleType,
  { at: [string, string]; nextName: string; listDay: string; activeIndex: number; dashed: string[] }[]
> = {
  [ScheduleType.Standard]: [
    // Dhuhr has passed and Asr is unreadable, so the countdown is already on Magrib
    { at: ['2024-10-20', '14:00'], nextName: 'Magrib', listDay: '2024-10-20', activeIndex: 4, dashed: ['Asr'] },
    // Isha is unreadable, so the list moved on at Magrib
    { at: ['2024-10-23', '19:00'], nextName: 'Fajr', listDay: '2024-10-24', activeIndex: 0, dashed: [] },
    { at: ['2024-10-25', '17:00'], nextName: 'Isha', listDay: '2024-10-25', activeIndex: 5, dashed: ['Magrib'] },
  ],
  [ScheduleType.Extra]: [
    // Friday's Istijaba is unreadable, so after Duha the list is Saturday's, whose night rows went with Magrib
    {
      at: ['2024-10-25', '12:00'],
      nextName: 'Suhoor',
      listDay: '2024-10-26',
      activeIndex: 2,
      dashed: ['Midnight', 'Last Third'],
    },
    {
      at: ['2024-10-30', '12:00'],
      nextName: 'Duha',
      listDay: '2024-10-31',
      activeIndex: 3,
      dashed: ['Midnight', 'Last Third', 'Suhoor'],
    },
  ],
};

describe.each([
  [ScheduleType.Standard, 'stored with every time unreadable'],
  [ScheduleType.Standard, 'not stored'],
  [ScheduleType.Extra, 'stored with every time unreadable'],
  [ScheduleType.Extra, 'not stored'],
])('%s virtual fortnight with unreadable rows, the held day %s', (type, heldDay) => {
  const records =
    heldDay === 'not stored'
      ? storedDays(REAL_FAULTS, [HELD_DAY, NOT_STORED])
      : storedDays({ ...REAL_FAULTS, [HELD_DAY]: ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'] }, [NOT_STORED]);
  const sequence = buildStoredSequence(type, records, REAL_SPAN_START, SPAN_DAYS);
  const prayers = sequence.prayers;
  const entries = buildPrayerWidgetTimeline(REAL_PUSH_AT, sequence, SETTINGS, 'light');

  const readable = prayers.filter(isReadableRow);
  const listDays = [...new Set(prayers.map((prayer) => prayer.belongsToDate))].sort();
  const readableOn = (date: string): ReadablePrayer[] => readable.filter((prayer) => prayer.belongsToDate === date);
  const endOfListDay = (date: string): number => createPrayerDatetime(addDaysToDateString(date, 1), '00:00').getTime();
  const listPosition = (prayer: Prayer): number =>
    (type === ScheduleType.Standard ? PRAYERS_ENGLISH : EXTRAS_ENGLISH).indexOf(prayer.english);
  const earliest = (rows: ReadablePrayer[]): ReadablePrayer =>
    rows.reduce((found, prayer) => (prayer.datetime < found.datetime ? prayer : found));
  const latest = (rows: ReadablePrayer[]): ReadablePrayer =>
    rows.reduce((found, prayer) => (prayer.datetime > found.datetime ? prayer : found));

  const lastReadable = latest(readable);
  const lastRealEntryMs = entries[entries.length - 2].date.getTime();
  const staleDateMs = Math.max(lastReadable.datetime.getTime(), lastRealEntryMs + MIN_ENTRY_SPACING_MS);
  const horizonMs = REAL_PUSH_AT.getTime() + STEPPED_COUNTDOWN_HOURS * 60 * 60 * 1000;

  /**
   * What the app's screens show at `instant`, restated from the rules (DASHES-DESIGN.md §4) rather than
   * taken from shared/sequence.ts
   */
  const expectedAt = (instant: number) => {
    const upcoming = readable.filter((prayer) => prayer.datetime.getTime() > instant);
    const displayDate = listDays.find((date) => {
      const rows = readableOn(date);
      return (
        rows.some((prayer) => prayer.datetime.getTime() > instant) ||
        (rows.length === 0 && instant < endOfListDay(date))
      );
    });
    if (upcoming.length === 0 || !displayDate) {
      throw new Error(`Nothing left to show at ${new Date(instant).toISOString()}`);
    }

    const next = earliest(upcoming);
    const held = readableOn(displayDate).length === 0;
    const previous = readable.filter(
      (prayer) =>
        prayer.datetime < next.datetime &&
        (prayer.belongsToDate === next.belongsToDate ||
          prayer.belongsToDate === getPreviousDateString(next.belongsToDate))
    );
    const dayRows = prayers
      .filter((prayer) => prayer.belongsToDate === displayDate)
      .sort((a, b) => listPosition(a) - listPosition(b));

    return {
      next,
      displayDate,
      boundaryMs: held ? Math.min(next.datetime.getTime(), endOfListDay(displayDate)) : next.datetime.getTime(),
      previousMs: previous.length > 0 ? latest(previous).datetime.getTime() : null,
      rows: dayRows.map((prayer) => ({ name: prayer.english, time: prayer.time ?? '--:--' })),
      activeIndex: dayRows.indexOf(next),
    };
  };

  const sampleInstants = (): number[] => {
    const instants = new Set<number>();
    const add = (ms: number) => {
      instants.add(ms - 1000);
      instants.add(ms);
      instants.add(ms + 1000);
    };

    for (const entry of entries) add(entry.date.getTime());
    for (const prayer of readable) add(prayer.datetime.getTime());
    for (const date of listDays) add(endOfListDay(date));
    add(staleDateMs);
    for (let ms = REAL_PUSH_AT.getTime(); ms <= staleDateMs; ms += 7 * 60 * 1000) instants.add(ms);

    return [...instants].filter((ms) => ms >= REAL_PUSH_AT.getTime()).sort((a, b) => a - b);
  };

  it('has exactly the unreadable rows its faults call for', () => {
    for (const date of listDays) {
      const unreadableNames = prayers
        .filter((prayer) => prayer.belongsToDate === date && prayer.datetime === null)
        .map((prayer) => prayer.english);
      expect([date, unreadableNames]).toEqual([date, EXPECTED_UNREADABLE[type][date] ?? []]);
    }
  });

  it('keeps the timeline start at or before the push, and every adjacent pair at least the minimum spacing apart', () => {
    expect(entries[0].date.getTime()).toBeLessThanOrEqual(REAL_PUSH_AT.getTime());
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i].date.getTime() - entries[i - 1].date.getTime()).toBeGreaterThanOrEqual(MIN_ENTRY_SPACING_MS);
    }
  });

  it('shows at every sampled instant the entry the rules call for', () => {
    for (const instant of sampleInstants()) {
      const at = new Date(instant).toISOString();
      const active = activeEntryAt(entries, instant);
      if (!active) throw new Error(`No active entry at ${at}`);
      const props = active.props;

      if (instant >= staleDateMs) {
        if (props.stale !== true) throw new Error(`Expected the stale card at ${at}`);
        continue;
      }
      if (props.stale === true) throw new Error(`Stale card active too early at ${at}`);

      const expected = expectedAt(instant);

      if (
        props.nextName !== expected.next.english ||
        props.nextTime !== expected.next.time ||
        props.nextEpochMs !== expected.next.datetime.getTime()
      ) {
        throw new Error(
          `Next mismatch at ${at}: entry says ${props.nextName} ${props.nextTime}, expected ${expected.next.english} ${expected.next.time}`
        );
      }

      if (props.prevEpochMs !== (expected.previousMs ?? active.date.getTime())) {
        throw new Error(`Previous mismatch at ${at}: entry says ${props.prevEpochMs}, expected ${expected.previousMs}`);
      }
      if (instant < props.prevEpochMs || instant > props.nextEpochMs) {
        throw new Error(`Countdown interval does not bracket ${at}`);
      }

      if (props.dateLabel !== formatDateLong(expected.displayDate)) {
        throw new Error(
          `Date label mismatch at ${at}: entry says "${props.dateLabel}", expected ${expected.displayDate}`
        );
      }
      if (
        JSON.stringify(props.prayers) !== JSON.stringify(expected.rows) ||
        props.activeIndex !== expected.activeIndex
      ) {
        throw new Error(
          `Day list mismatch at ${at}: entry says ${JSON.stringify(props.prayers)} active ${props.activeIndex}, ` +
            `expected ${JSON.stringify(expected.rows)} active ${expected.activeIndex}`
        );
      }

      // A blank label is only for an entry the horizon strands short of its boundary, which for a held
      // day is 00:00 rather than the prayer counted down to
      if (props.countdownLabel === '') {
        const noStepFits = active.date.getTime() + COUNTDOWN_STEP_MS > horizonMs;
        const boundaryFarther = expected.boundaryMs - active.date.getTime() > COUNTDOWN_STEP_MS;
        if (!noStepFits || !boundaryFarther) throw new Error(`Countdown blanked without cause at ${at}`);
      } else {
        const labelAnchorMs = Math.max(active.date.getTime(), REAL_PUSH_AT.getTime());
        const expectedLabel = formatCountdownMinutes(
          Math.max(1, Math.ceil((expected.next.datetime.getTime() - labelAnchorMs) / 1000))
        );
        if (props.countdownLabel !== expectedLabel) {
          throw new Error(
            `Countdown label mismatch at ${at}: entry says "${props.countdownLabel}", expected "${expectedLabel}"`
          );
        }
      }

      if (instant <= horizonMs && instant - active.date.getTime() > 2 * COUNTDOWN_STEP_MS) {
        throw new Error(`Label at ${at} is more than two steps stale`);
      }
    }
  });

  it('never moves the list back a day', () => {
    const labels = listDays.map((date) => formatDateLong(date));
    let previousIndex = -1;

    for (const entry of entries.slice(0, -1)) {
      const index = labels.indexOf(entry.props.dateLabel);
      expect(index).toBeGreaterThanOrEqual(previousIndex);
      previousIndex = index;
    }
  });

  it('passes over unreadable rows where the app does', () => {
    for (const check of SPOT_CHECKS[type]) {
      const props = activeEntryAt(entries, createPrayerDatetime(...check.at).getTime())?.props;

      expect(props).toMatchObject({
        nextName: check.nextName,
        dateLabel: formatDateLong(check.listDay),
        activeIndex: check.activeIndex,
      });
      expect(props?.prayers?.filter((row) => row.time === '--:--').map((row) => row.name)).toEqual(check.dashed);
    }
  });

  it('holds the day with no readable time on screen until 00:00 London with no active row, then shows the day after', () => {
    const dayAfter = addDaysToDateString(HELD_DAY, 1);
    const holdEndMs = endOfListDay(HELD_DAY);
    const firstOfDayAfter = earliest(readableOn(dayAfter));
    const held = entries.filter((entry) => entry.props.dateLabel === formatDateLong(HELD_DAY));

    // Standard hands over after the 20th's Isha. The 20th's last Extras row, Duha, passed before the
    // push, so on Extras the held day is on screen from the first entry
    const handoverMs =
      type === ScheduleType.Standard ? latest(readableOn('2024-10-20')).datetime.getTime() : REAL_PUSH_AT.getTime();
    expect(held.length).toBeGreaterThan(1);
    expect(held[0].date.getTime()).toBe(handoverMs);
    expect(held[held.length - 1].date.getTime()).toBeLessThan(holdEndMs);

    for (const entry of held) {
      expect(entry.props.prayers?.map((row) => row.time)).toEqual(
        (type === ScheduleType.Standard ? PRAYERS_ENGLISH : EXTRAS_WEEKDAY).map(() => '--:--')
      );
      expect(entry.props.activeIndex).toBe(-1);
      expect(entry.props.nextEpochMs).toBe(firstOfDayAfter.datetime.getTime());
    }

    const rollover = entries.find((entry) => entry.date.getTime() === holdEndMs);
    expect(rollover?.props).toMatchObject({
      nextEpochMs: firstOfDayAfter.datetime.getTime(),
      dateLabel: formatDateLong(dayAfter),
      activeIndex: type === ScheduleType.Standard ? 0 : 2,
    });
  });

  it('ends with the stale card at the last readable row, however many unreadable rows follow it', () => {
    const last = entries[entries.length - 1];

    expect(lastReadable).toMatchObject({
      belongsToDate: '2024-11-03',
      english: type === ScheduleType.Standard ? 'Magrib' : 'Suhoor',
    });
    expect(last.date.getTime()).toBe(lastReadable.datetime.getTime());
    expect(last.props).toMatchObject({
      stale: true,
      nextName: lastReadable.english,
      nextTime: lastReadable.time,
      nextEpochMs: lastReadable.datetime.getTime(),
      dateLabel: formatDateLong('2024-11-03'),
    });
  });
});
