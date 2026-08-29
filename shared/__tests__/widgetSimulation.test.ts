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
 * - day list: rows and pass/next/upcoming states match the Islamic day of
 *   the entry's London date
 * - staleness: never before the stale entry's date, always after it
 * - spacing: every adjacent entry pair keeps the WidgetKit minimum
 *
 * This replaces weeks of physical-device observation with a deterministic
 * replay: if the builder ever emits a missing flip, a wrong rollover, or a
 * gap, some sampled instant exposes it.
 */

import { addDays } from 'date-fns';

import { createPrayerDatetime, formatDateShort } from '@/shared/time';
import { type Prayer, type PrayerSequence, ScheduleType } from '@/shared/types';
import { buildPrayerWidgetTimeline, MIN_ENTRY_SPACING_MS } from '@/shared/widgetTimeline';
import type { PrayerWidgetSettings } from '@/shared/widgetTypes';

// =============================================================================
// FIXTURE: 16 days across the DST fall-back (clocks change 2026-10-25)
// =============================================================================

const PUSH_AT = createPrayerDatetime('2026-10-18', '12:00');
const SPAN_START = '2026-10-17';
const SPAN_DAYS = 16;

const SETTINGS: PrayerWidgetSettings = { accentColor: '#ffd000', showArabic: true, showBar: true };

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

const expectedDayList = (prayers: Prayer[], entryDate: Date) => {
  const dateString = formatDateShort(entryDate);
  const lastPrayerAtOrBeforeEntry = (() => {
    let found: Prayer | undefined;
    for (const prayer of prayers) {
      if (prayer.datetime.getTime() <= entryDate.getTime()) found = prayer;
      else break;
    }
    return found;
  })();
  const prevIndex = lastPrayerAtOrBeforeEntry ? prayers.indexOf(lastPrayerAtOrBeforeEntry) : -1;

  return prayers
    .map((prayer, index) => ({ prayer, index }))
    .filter(({ prayer }) => prayer.belongsToDate === dateString)
    .map(({ prayer, index }) => ({
      name: prayer.english,
      time: prayer.time,
      state: index <= prevIndex ? 'passed' : index === prevIndex + 1 ? 'next' : 'upcoming',
    }));
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

  /** Every interesting instant: entry dates, prayers, midnights, stale — all ±1s */
  const sampleInstants = (): number[] => {
    const instants = new Set<number>();

    const add = (ms: number) => {
      instants.add(ms - 1000);
      instants.add(ms);
      instants.add(ms + 1000);
    };

    for (const entry of entries) add(entry.date.getTime());
    for (const prayer of prayers) add(prayer.datetime.getTime());

    const startDay = createPrayerDatetime(SPAN_START, '12:00');
    for (let dayIndex = 0; dayIndex <= SPAN_DAYS; dayIndex++) {
      const day = addDays(startDay, dayIndex);
      const midnight = createPrayerDatetime(formatDateShort(day), '00:00');
      add(midnight.getTime());
    }

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

  it('shows an active entry whose segment brackets the instant, with a matching day list', () => {
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

      // Day list matches the entry date's Islamic day
      const expectedRows = expectedDayList(prayers, active.date);
      const actualRows = props.dayPrayers.map((row) => ({ name: row.name, time: row.time, state: row.state }));
      expect(actualRows).toEqual(expectedRows);
    }
  });

  it('flips the highlighted day-list row exactly at the boundary instants', () => {
    const nextRowsAt = (instant: number) => {
      const active = activeEntryAt(entries, instant);
      return active?.props.dayPrayers.find((row) => row.state === 'next')?.name;
    };

    // Just before Asr on the push day the next row is Asr; just after the
    // Asr boundary the next row is Magrib
    const asrBoundary = createPrayerDatetime('2026-10-18', '15:20').getTime();
    expect(nextRowsAt(asrBoundary - 1000)).toBe('Asr');
    expect(nextRowsAt(asrBoundary)).toBe('Magrib');
    expect(nextRowsAt(asrBoundary + 1000)).toBe('Magrib');
  });

  it('rolls the day list at midnight while keeping the night segment', () => {
    // Midnight of the push day: Isha (19:40) already passed, Fajr is next —
    // but the list has already rolled to the new day
    const midnight = createPrayerDatetime('2026-10-19', '00:00').getTime();
    const active = activeEntryAt(entries, midnight);

    expect(active).toBeDefined();
    if (!active) return;
    expect(active.props.nextName).toBe('Fajr');
    expect(active.props.prevEpochMs).toBe(createPrayerDatetime('2026-10-18', '19:40').getTime());
    expect(active.props.dayPrayers.map((row) => row.name)).toEqual([
      'Fajr',
      'Sunrise',
      'Dhuhr',
      'Asr',
      'Magrib',
      'Isha',
    ]);
  });

  it('treats an early-morning Isha as the previous Islamic day next row', () => {
    // Oct 20's Isha is at 01:05 on Oct 21. After Oct 20's Magrib (18:05),
    // the next prayer is the early Isha and it appears as the next row of
    // Oct 20's day list.
    const afterMagrib = createPrayerDatetime('2026-10-20', '19:00').getTime();
    const active = activeEntryAt(entries, afterMagrib);

    expect(active).toBeDefined();
    if (!active) return;
    expect(active.props.nextName).toBe('Isha');
    expect(active.props.nextTime).toBe('01:05');

    const nextRow = active.props.dayPrayers.find((row) => row.state === 'next');
    expect(nextRow?.name).toBe('Isha');
    expect(nextRow?.time).toBe('01:05');
    // Six rows: the early Isha replaced the normal one on Oct 20's list
    expect(active.props.dayPrayers).toHaveLength(6);
  });

  it('crosses the DST fall-back night without gaps or double entries', () => {
    // The night of 2026-10-24 -> 2026-10-25 (clocks 02:00 BST -> 01:00 GMT).
    // Entries in this window must stay strictly increasing with spacing.
    const nightStart = createPrayerDatetime('2026-10-24', '20:00').getTime();
    const nightEnd = createPrayerDatetime('2026-10-25', '12:00').getTime();
    const windowEntries = entries.filter(
      (entry) => entry.date.getTime() >= nightStart && entry.date.getTime() <= nightEnd
    );

    // Midnight rollover, Fajr, Sunrise — plus the Isha boundary entry just
    // before the window opens keeps the segment continuous
    expect(windowEntries.length).toBeGreaterThanOrEqual(3);
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
