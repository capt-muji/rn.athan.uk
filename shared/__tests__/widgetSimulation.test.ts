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
import type { WidgetTimelineEntry } from 'expo-widgets';

import { MOCK_DATA_FULL } from '@/mocks/full';
import { EXTRAS_ENGLISH, PRAYERS_ENGLISH } from '@/shared/constants';
import { createPrayerSequence, transformApiData } from '@/shared/prayer';
import {
  addDaysToDateString,
  createPrayerDatetime,
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
import { buildPrayerWidgetTimeline, MIN_ENTRY_SPACING_MS } from '@/shared/widgetTimeline';
import type { PrayerWidgetProps, PrayerWidgetSettings } from '@/shared/widgetTypes';
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
   * SHA-256 of every timeline each case builds, over a year of real London data. These pin the builder's
   * exact output: a mismatch means what the widgets SHOW changed, so treat it as a deliberate design
   * change to re-gold, never as a test to silence.
   *
   * Last re-golded when the countdown moved to a SwiftUI timer interval and the five-minute stepped
   * entries were deleted (session 16a) — the fix for the archive-budget blackout.
   */
  const REAL_YEAR_TIMELINES: [string, string][] = [
    ['2024-01-10', '5049d110f76ea186316fb833984d1f3978c3a27acfea62591f0dc25056075328'],
    ['2024-02-20', 'eef7b2330b71a09dbd858a53358775288acf2c841a089d39416192797434b806'],
    // Across the spring clock change (31 March)
    ['2024-03-24', '27e918bef398be897713f4a06c717553d1876312e84e0e44ffc6770721a9e771'],
    ['2024-04-15', '2c369132ebb212c9e1ecf669bd07c1d324e3220aef834695071d2b76096ea54e'],
    ['2024-05-06', 'e39cc602d75e10b64873441264b349d40ecff6454fffaa406b281693242b7780'],
    ['2024-06-14', '6be1ee27287846b66b9dbcda3e9ecf7b14b4c0e59723b833176d9aa6f1162d66'],
    ['2024-07-01', '495df1f97098cee939ae8abae52c4bb6ddbaf21835b28e5b611c8adb3da395d2'],
    ['2024-08-12', 'ee5483cc3889bf1bc28339ca78e93304b6a35c8a1d37f65557438b078827e984'],
    ['2024-09-02', '229adbd8d9a7a6447f1d834de52e9eef6a8ba51ef03317ebe775160dfd118f29'],
    // Across the autumn clock change (27 October)
    ['2024-10-20', 'e09ffc45a502758142ea642f9b3df449d9c0b2beacc74e69f7678f245f14ad20'],
    ['2024-11-11', '339f5a17afe71dde06aed2c807ac2319f78fbe8b816f44f9e574d3d4cf2c6f61'],
    ['2024-12-15', 'c8897481277c1ac852c9466028899b787bda891c19e11641d7a167bbd2785195'],
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

  it.each(REAL_YEAR_TIMELINES)('builds byte-identical timelines from the span starting %s', (firstDate, digest) => {
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

const earliest = (rows: ReadablePrayer[]): ReadablePrayer =>
  rows.reduce((found, prayer) => (prayer.datetime < found.datetime ? prayer : found));

const latest = (rows: ReadablePrayer[]): ReadablePrayer =>
  rows.reduce((found, prayer) => (prayer.datetime > found.datetime ? prayer : found));

/** 00:00 London at the end of a list day */
const endOfListDay = (date: string): number => createPrayerDatetime(addDaysToDateString(date, 1), '00:00').getTime();

/**
 * What the app's screens show over `prayers`, restated from the rules (DASHES-DESIGN.md §4) rather than
 * taken from shared/sequence.ts
 */
const rulesFor = (type: ScheduleType, prayers: Prayer[]) => {
  const readable = prayers.filter(isReadableRow);
  const listDays = [...new Set(prayers.map((prayer) => prayer.belongsToDate))].sort();
  const readableOn = (date: string): ReadablePrayer[] => readable.filter((prayer) => prayer.belongsToDate === date);
  const listPosition = (prayer: Prayer): number =>
    (type === ScheduleType.Standard ? PRAYERS_ENGLISH : EXTRAS_ENGLISH).indexOf(prayer.english);

  const expectedAt = (instant: number) => {
    const upcoming = readable.filter((prayer) => prayer.datetime.getTime() > instant);
    if (upcoming.length === 0) {
      throw new Error(`Nothing left to show at ${new Date(instant).toISOString()}`);
    }
    const next = earliest(upcoming);

    // Worked out from moments rather than by walking list days: normally the next prayer's own day is on screen.
    // A day with no readable time takes the screen for its own 24 hours, once nothing of an earlier day is still
    // due; and the day of the prayer that passed last keeps it until its own 00:00 when the day after has none.
    const blankDays = listDays.filter((date) => readableOn(date).length === 0);
    const startOfListDay = (date: string): number => createPrayerDatetime(date, '00:00').getTime();
    const blankNow = blankDays.find(
      (date) => instant >= startOfListDay(date) && instant < endOfListDay(date) && next.belongsToDate > date
    );
    const passed = readable.filter((prayer) => prayer.datetime.getTime() <= instant);
    const lastPassed = passed.length > 0 ? latest(passed) : null;
    const waiting =
      lastPassed &&
      blankDays.includes(addDaysToDateString(lastPassed.belongsToDate, 1)) &&
      instant < endOfListDay(lastPassed.belongsToDate) &&
      next.belongsToDate > lastPassed.belongsToDate
        ? lastPassed.belongsToDate
        : undefined;
    const displayDate = blankNow ?? waiting ?? next.belongsToDate;
    const held = !readableOn(displayDate).some((prayer) => prayer.datetime.getTime() > instant);
    // The bar measures from one row only: the row just above next on its list, or for a first row the last row of
    // the list before. When that row has no time, or does not fall before next, there is no previous prayer
    const position = listPosition(next);
    const aboveDay = position > 0 ? next.belongsToDate : getPreviousDateString(next.belongsToDate);
    const above = prayers
      .filter((prayer) => prayer.belongsToDate === aboveDay && (position === 0 || listPosition(prayer) < position))
      .sort((a, b) => listPosition(b) - listPosition(a))[0];
    const previousMs =
      above && isReadableRow(above) && above.datetime < next.datetime ? above.datetime.getTime() : null;
    const dayRows = prayers
      .filter((prayer) => prayer.belongsToDate === displayDate)
      .sort((a, b) => listPosition(a) - listPosition(b));

    return {
      next,
      displayDate,
      boundaryMs: held ? Math.min(next.datetime.getTime(), endOfListDay(displayDate)) : next.datetime.getTime(),
      previousMs,
      rows: dayRows.map((prayer) => ({ name: prayer.english, time: prayer.time ?? '--:--' })),
      activeIndex: dayRows.indexOf(next),
    };
  };

  return { readable, listDays, readableOn, expectedAt };
};

/** Why `entry`, the one showing at `instant`, is not what the rules call for there, or null when it is */
const mismatchAt = (
  entry: WidgetTimelineEntry<PrayerWidgetProps>,
  instant: number,
  expected: ReturnType<ReturnType<typeof rulesFor>['expectedAt']>
): string | null => {
  const { props } = entry;
  const at = new Date(instant).toISOString();

  if (
    props.nextName !== expected.next.english ||
    props.nextTime !== expected.next.time ||
    props.nextEpochMs !== expected.next.datetime.getTime()
  ) {
    return `Next mismatch at ${at}: entry says ${props.nextName} ${props.nextTime}, expected ${expected.next.english} ${expected.next.time}`;
  }
  if (props.prevEpochMs !== (expected.previousMs ?? entry.date.getTime())) {
    return `Previous mismatch at ${at}: entry says ${props.prevEpochMs}, expected ${expected.previousMs}`;
  }
  if (instant < props.prevEpochMs || instant > props.nextEpochMs) {
    return `Countdown interval does not bracket ${at}`;
  }

  // The upcoming prayer's own day rather than the day on screen: a held day's list has no active row and
  // cannot be drawn, so the layouts show that prayer's name and time, and the date under them must be theirs
  if (props.dateLabel !== formatDateLong(expected.next.belongsToDate)) {
    return `Date label mismatch at ${at}: entry says "${props.dateLabel}", expected ${expected.next.belongsToDate}`;
  }
  if (JSON.stringify(props.prayers) !== JSON.stringify(expected.rows) || props.activeIndex !== expected.activeIndex) {
    return (
      `Day list mismatch at ${at}: entry says ${JSON.stringify(props.prayers)} active ${props.activeIndex}, ` +
      `expected ${JSON.stringify(expected.rows)} active ${expected.activeIndex}`
    );
  }

  return null;
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
  const { readable, listDays, readableOn, expectedAt } = rulesFor(type, prayers);

  const lastReadable = latest(readable);
  const lastRealEntryMs = entries[entries.length - 2].date.getTime();
  const staleDateMs = Math.max(lastReadable.datetime.getTime(), lastRealEntryMs + MIN_ENTRY_SPACING_MS);

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

      if (instant >= staleDateMs) {
        if (active.props.stale !== true) throw new Error(`Expected the stale card at ${at}`);
        continue;
      }
      if (active.props.stale === true) throw new Error(`Stale card active too early at ${at}`);

      const problem = mismatchAt(active, instant, expectedAt(instant));
      if (problem) throw new Error(problem);
    }
  });

  it('never moves the date back a day', () => {
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

  it('keeps the day before until 00:00, then holds the day with no readable time until its own 00:00 with no active row', () => {
    const dayBefore = getPreviousDateString(HELD_DAY);
    const dayAfter = addDaysToDateString(HELD_DAY, 1);
    const dayStartMs = endOfListDay(dayBefore);
    const holdEndMs = endOfListDay(HELD_DAY);
    const firstOfDayAfter = earliest(readableOn(dayAfter));
    const dashes = (type === ScheduleType.Standard ? PRAYERS_ENGLISH : EXTRAS_WEEKDAY).map(() => '--:--');

    // Standard keeps the day before's list after its Isha, and Extras after its Duha, which passed before the
    // push, with no active row until 00:00 (R8)
    const waitStartMs =
      type === ScheduleType.Standard ? latest(readableOn(dayBefore)).datetime.getTime() : REAL_PUSH_AT.getTime();
    const waiting = entries.filter((entry) => entry.date.getTime() >= waitStartMs && entry.date.getTime() < dayStartMs);
    // The wait is one segment, so one entry carries it to 00:00
    expect(waiting.length).toBeGreaterThanOrEqual(1);
    for (const entry of waiting) {
      expect(entry.props.prayers?.map((row) => row.time)).not.toEqual(dashes);
      expect(entry.props).toMatchObject({
        activeIndex: -1,
        nextEpochMs: firstOfDayAfter.datetime.getTime(),
        dateLabel: formatDateLong(dayAfter),
      });
    }

    const held = entries.filter((entry) => entry.date.getTime() >= dayStartMs && entry.date.getTime() < holdEndMs);
    // The whole hold is one segment: 00:00 opens it and the day's own 00:00 ends it
    expect(held.length).toBeGreaterThanOrEqual(1);
    expect(held[0].date.getTime()).toBe(dayStartMs);

    for (const entry of held) {
      expect(entry.props.prayers?.map((row) => row.time)).toEqual(dashes);
      // Dated by the prayer counted down to, whose name and time are what the layouts show on a held day
      expect(entry.props).toMatchObject({
        activeIndex: -1,
        nextEpochMs: firstOfDayAfter.datetime.getTime(),
        dateLabel: formatDateLong(dayAfter),
      });
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

// =============================================================================
// CROWDED BOUNDARIES
//
// With Fajr and Sunrise unreadable, a weekday Extras list has no readable row,
// so it is held until 00:00 London, and from mid-May to late June and in early
// October the next night's Midnight falls within minutes of that 00:00. Every
// such day of 2024 in turn, on both lists.
// =============================================================================

const datesBetween = (first: string, last: string): string[] => {
  const dates: string[] = [];
  for (let date = first; date <= last; date = addDaysToDateString(date, 1)) dates.push(date);
  return dates;
};

const CROWDED_FAULT_DAYS = [...datesBetween('2024-05-10', '2024-06-30'), ...datesBetween('2024-10-03', '2024-10-14')];

describe.each([ScheduleType.Standard, ScheduleType.Extra])(
  '%s timelines around a day whose Fajr and Sunrise are unreadable',
  (type) => {
    const cases = CROWDED_FAULT_DAYS.flatMap((faultDay) => {
      const dayBefore = getPreviousDateString(faultDay);
      const sequence = buildStoredSequence(type, storedDays({ [faultDay]: ['fajr', 'sunrise'] }, []), dayBefore, 4);
      const rules = rulesFor(type, sequence.prayers);

      // The night after the fault day beyond the stepped horizon, then inside it
      return [createPrayerDatetime(dayBefore, '12:00'), createPrayerDatetime(faultDay, '22:00')].map((pushAt) => ({
        label: `${faultDay}, pushed ${pushAt.toISOString()}`,
        faultDay,
        sequence,
        rules,
        pushAt,
        entries: buildPrayerWidgetTimeline(pushAt, sequence, SETTINGS, 'light'),
      }));
    });

    it('reaches the fault: its rows are unreadable, and on Extras a held 00:00 lands minutes from a Midnight', () => {
      const crowded = new Set<string>();

      for (const { faultDay, sequence, rules } of cases) {
        const unreadableNames = sequence.prayers
          .filter((prayer) => prayer.belongsToDate === faultDay && prayer.datetime === null)
          .map((prayer) => prayer.english);
        expect([faultDay, unreadableNames]).toEqual([
          faultDay,
          type === ScheduleType.Standard ? ['Fajr', 'Sunrise'] : EXTRAS_WEEKDAY,
        ]);

        const midnight = rules
          .readableOn(addDaysToDateString(faultDay, 1))
          .find((prayer) => prayer.english === 'Midnight');
        if (midnight && Math.abs(midnight.datetime.getTime() - endOfListDay(faultDay)) < MIN_ENTRY_SPACING_MS) {
          crowded.add(faultDay);
        }
      }

      if (type === ScheduleType.Extra) {
        expect(crowded).toContain('2024-06-01');
        expect(crowded).toContain('2024-10-08');
      } else {
        expect(crowded.size).toBe(0);
      }
    });

    it('keeps every adjacent entry at least the minimum spacing apart', () => {
      const tooClose: string[] = [];

      for (const { label, entries } of cases) {
        for (let i = 1; i < entries.length; i++) {
          if (entries[i].date.getTime() - entries[i - 1].date.getTime() < MIN_ENTRY_SPACING_MS) {
            tooClose.push(`${label}: ${entries[i - 1].date.toISOString()} then ${entries[i].date.toISOString()}`);
          }
        }
      }

      expect(tooClose).toEqual([]);
    });

    it('starts at the push, shows at each entry what the rules call for at its own moment, and ends at the last readable row', () => {
      const wrong: string[] = [];

      for (const { label, entries, rules, pushAt } of cases) {
        if (entries[0].date.getTime() > pushAt.getTime()) wrong.push(`${label}: starts after the push`);

        for (const entry of entries.slice(0, -1)) {
          const moment = Math.max(entry.date.getTime(), pushAt.getTime());
          const problem = mismatchAt(entry, moment, rules.expectedAt(moment));
          if (problem) wrong.push(`${label}: ${problem}`);
        }

        const stale = entries[entries.length - 1];
        const lastReadableMs = latest(rules.readable).datetime.getTime();
        if (stale.props.stale !== true || stale.props.nextEpochMs !== lastReadableMs) {
          wrong.push(`${label}: the stale card is not at the last readable row`);
        }
      }

      expect(wrong.slice(0, 5)).toEqual([]);
    });

    it('shows every flip within one spacing of its boundary', () => {
      const late: string[] = [];

      for (const { label, entries, rules, pushAt } of cases) {
        const lastReadableMs = latest(rules.readable).datetime.getTime();
        const boundaries = [
          ...rules.readable.map((prayer) => prayer.datetime.getTime()),
          ...rules.listDays.map(endOfListDay),
        ].filter((ms) => ms > pushAt.getTime() && ms + MIN_ENTRY_SPACING_MS < lastReadableMs);

        for (const boundaryMs of boundaries) {
          const instant = boundaryMs + MIN_ENTRY_SPACING_MS;
          const active = activeEntryAt(entries, instant);
          const expected = rules.expectedAt(instant);
          if (
            active?.props.nextEpochMs !== expected.next.datetime.getTime() ||
            JSON.stringify(active.props.prayers) !== JSON.stringify(expected.rows)
          ) {
            late.push(`${label}: still ${active?.props.nextName} at ${new Date(instant).toISOString()}`);
          }
        }
      }

      expect(late.slice(0, 5)).toEqual([]);
    });
  }
);
