/**
 * Unit tests for shared/widgetTimeline.ts
 *
 * Tests the iOS widget timeline builder:
 * - buildPrayerWidgetTimeline: entry generation, midnight rollovers, sorting
 * - Day list states relative to each entry
 * - Empty-sequence and exhausted-span guards
 */

import { addDays } from 'date-fns';

import { createPrayerDatetime, formatDateShort } from '@/shared/time';
import { type Prayer, type PrayerSequence, ScheduleType } from '@/shared/types';
import { buildPrayerWidgetTimeline, MIN_ENTRY_SPACING_MS } from '@/shared/widgetTimeline';
import type { PrayerWidgetSettings } from '@/shared/widgetTypes';
import { WIDGET_PROPS_VERSION } from '@/shared/widgetTypes';

// =============================================================================
// TEST HELPERS
// =============================================================================

/** Fixed "now" for deterministic tests: 2026-06-15 14:00 London */
const NOW = createPrayerDatetime('2026-06-15', '14:00');

/** Default settings snapshot (mirrors app defaults) */
const SETTINGS: PrayerWidgetSettings = { accentColor: '#ffd000', showArabic: true, showBar: true };

/** Settings snapshot with Arabic names hidden */
const SETTINGS_HIDDEN_ARABIC: PrayerWidgetSettings = { accentColor: '#00ff88', showArabic: false, showBar: true };

/** Builds a Prayer with a real London datetime */
const makePrayer = (date: string, time: string, english: string, arabic: string, belongsToDate?: string): Prayer => {
  const datetime = createPrayerDatetime(date, time);
  return {
    type: ScheduleType.Standard,
    english,
    arabic,
    datetime,
    time,
    belongsToDate: belongsToDate ?? date,
  };
};

/** Six canonical prayers per day, matching the standard schedule */
const makeDay = (date: string, belongsToDate?: string): Prayer[] => {
  const times: [string, string, string][] = [
    ['Fajr', 'الفجر', '03:30'],
    ['Sunrise', 'الشروق', '05:20'],
    ['Dhuhr', 'الظهر', '13:10'],
    ['Asr', 'العصر', '17:45'],
    ['Magrib', 'المغرب', '21:15'],
    ['Isha', 'العشاء', '22:45'],
  ];

  return times.map(([english, arabic, time]) => makePrayer(date, time, english, arabic, belongsToDate));
};

/** Two-day sequence covering NOW (2026-06-15 14:00) */
const makeSequence = (): PrayerSequence => ({
  type: ScheduleType.Standard,
  prayers: [...makeDay('2026-06-15'), ...makeDay('2026-06-16')],
});

// =============================================================================
// BUILDPRAYERWIDGETTIMELINE TESTS
// =============================================================================

describe('buildPrayerWidgetTimeline', () => {
  it('starts with an entry at now', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS);

    expect(entries[0].date.getTime()).toBe(NOW.getTime());
  });

  it('first entry points at the next prayer after now (Asr)', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS);
    const first = entries[0].props;

    expect(first.nextName).toBe('Asr');
    expect(first.nextArabic).toBe('العصر');
    expect(first.nextTime).toBe('17:45');
    expect(first.nextEpochMs).toBe(createPrayerDatetime('2026-06-15', '17:45').getTime());
    // Segment starts at the previous prayer (Dhuhr at 13:10), not at now
    expect(first.prevEpochMs).toBe(createPrayerDatetime('2026-06-15', '13:10').getTime());
  });

  it('creates one entry per prayer boundary plus a midnight rollover and stale guard', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS);

    // Boundaries after now: Asr, Magrib, Isha today + 6 tomorrow = 9
    // Midnights: 1 (between Isha 22:45 and tomorrow's Fajr 03:30)
    // Stale guard: 1 (after the final prayer)
    expect(entries).toHaveLength(11);
  });

  it('ends with a stale guard entry exactly at the final prayer boundary', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS);

    const finalPrayer = createPrayerDatetime('2026-06-16', '22:45');
    const last = entries[entries.length - 1];

    // The final prayer flips straight to the stale card (the last real entry
    // is hours earlier, so the minimum spacing never delays it here)
    expect(last.date.getTime()).toBe(finalPrayer.getTime());
    expect(last.props.stale).toBe(true);
    expect(last.props.dayPrayers).toEqual([]);
    // Chronologically last
    expect(last.date.getTime()).toBe(Math.max(...entries.map((entry) => entry.date.getTime())));
  });

  it('never marks real segment entries as stale', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS);

    expect(entries.slice(0, -1).every((entry) => entry.props.stale !== true)).toBe(true);
  });

  it('sorts entries chronologically even when midnight precedes an early prayer', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS);

    const times = entries.map((entry) => entry.date.getTime());
    const sorted = [...times].sort((a, b) => a - b);
    expect(times).toEqual(sorted);
  });

  it('adds a midnight entry that keeps the current segment but rolls the day list', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS);

    // Midnight between Isha 22:45 (June 15) and Fajr 03:30 (June 16)
    const midnight = createPrayerDatetime('2026-06-16', '00:00');
    const midnightEntry = entries.find((entry) => entry.date.getTime() === midnight.getTime());
    expect(midnightEntry).toBeDefined();

    if (!midnightEntry) return;

    // Segment is unchanged: Isha already passed, Fajr is still next
    expect(midnightEntry.props.nextName).toBe('Fajr');
    expect(midnightEntry.props.nextTime).toBe('03:30');
    expect(midnightEntry.props.prevEpochMs).toBe(createPrayerDatetime('2026-06-15', '22:45').getTime());

    // Day list rolled over: June 16's six prayers, no June 15 rows
    expect(midnightEntry.props.dayPrayers.map((row) => row.name)).toEqual([
      'Fajr',
      'Sunrise',
      'Dhuhr',
      'Asr',
      'Magrib',
      'Isha',
    ]);
    expect(midnightEntry.props.dayPrayers[0].state).toBe('next');
    expect(midnightEntry.props.dayPrayers.slice(1).every((row) => row.state === 'upcoming')).toBe(true);
  });

  it('marks the boundary prayer as passed and the following prayer as next', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS);

    // At the Asr boundary the segment starts at Asr: the countdown flips to Magrib
    const asrBoundary = createPrayerDatetime('2026-06-15', '17:45');
    const asrEntry = entries.find((entry) => entry.date.getTime() === asrBoundary.getTime());
    expect(asrEntry).toBeDefined();

    if (!asrEntry) return;

    expect(asrEntry.props.nextName).toBe('Magrib');
    expect(asrEntry.props.prevEpochMs).toBe(asrBoundary.getTime());

    const states = Object.fromEntries(asrEntry.props.dayPrayers.map((row) => [row.name, row.state]));
    expect(states).toEqual({
      Fajr: 'passed',
      Sunrise: 'passed',
      Dhuhr: 'passed',
      Asr: 'passed',
      Magrib: 'next',
      Isha: 'upcoming',
    });
  });

  it('carries accent color and Arabic preference into every entry', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS_HIDDEN_ARABIC);

    expect(entries.every((entry) => entry.props.accentColor === '#00ff88')).toBe(true);
    expect(entries.every((entry) => entry.props.showArabic === false)).toBe(true);
  });

  it('carries the bar visibility and schema version into every entry', () => {
    const settings: PrayerWidgetSettings = { accentColor: '#ffd000', showArabic: true, showBar: false };
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), settings);

    expect(entries.every((entry) => entry.props.showBar === false)).toBe(true);
    expect(entries.every((entry) => entry.props.v === WIDGET_PROPS_VERSION)).toBe(true);
  });

  it('trims Arabic strings from the payload when Arabic names are hidden', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS_HIDDEN_ARABIC);

    expect(entries.every((entry) => entry.props.nextArabic === '')).toBe(true);
    const rowsWithArabic = entries.flatMap((entry) => entry.props.dayPrayers).filter((row) => row.arabic !== '');
    expect(rowsWithArabic).toEqual([]);
  });

  it('places an early-morning Isha in the previous Islamic day list as next', () => {
    // June 17's Isha at 01:10 crosses midnight and belongs to June 16's day
    const sequence: PrayerSequence = {
      type: ScheduleType.Standard,
      prayers: [...makeDay('2026-06-16'), makePrayer('2026-06-17', '01:10', 'Isha', 'العشاء', '2026-06-16')],
    };

    const entries = buildPrayerWidgetTimeline(NOW, sequence, SETTINGS);
    // At June 16's Isha boundary the segment flips to the after-midnight Isha
    const ishaBoundary = createPrayerDatetime('2026-06-16', '22:45');
    const ishaEntry = entries.find((entry) => entry.date.getTime() === ishaBoundary.getTime());

    expect(ishaEntry).toBeDefined();
    if (!ishaEntry) return;

    expect(ishaEntry.props.nextName).toBe('Isha');
    expect(ishaEntry.props.nextTime).toBe('01:10');

    // June 16's list has its six prayers plus the early-morning Isha
    const rows = ishaEntry.props.dayPrayers;
    expect(rows.map((row) => row.name)).toEqual(['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Magrib', 'Isha', 'Isha']);
    // The 01:10 Isha (datetime June 17) is the segment's next prayer
    expect(rows[6].time).toBe('01:10');
    expect(rows[6].state).toBe('next');
  });

  it('returns an empty array when the sequence has no prayers', () => {
    const entries = buildPrayerWidgetTimeline(NOW, { type: ScheduleType.Standard, prayers: [] }, SETTINGS);

    expect(entries).toEqual([]);
  });

  it('returns an empty array when now is past the last prayer in the sequence', () => {
    const late = createPrayerDatetime('2026-06-16', '23:59');
    const entries = buildPrayerWidgetTimeline(late, makeSequence(), SETTINGS);

    expect(entries).toEqual([]);
  });

  it('handles a segment that starts before now when now precedes all prayers', () => {
    // Sequence starts tomorrow; now has no previous prayer in the span
    const sequence: PrayerSequence = { type: ScheduleType.Standard, prayers: makeDay('2026-06-16') };

    const entries = buildPrayerWidgetTimeline(NOW, sequence, SETTINGS);

    expect(entries.length).toBeGreaterThan(0);
    // First entry's segment start falls back to the entry date itself
    expect(entries[0].props.prevEpochMs).toBe(NOW.getTime());
    expect(entries[0].props.nextName).toBe('Fajr');
  });
});

// =============================================================================
// MINIMUM ENTRY SPACING (WidgetKit ~5-minute guidance)
// =============================================================================

describe('minimum entry spacing', () => {
  it('backdates the first entry when a midnight is under five minutes away', () => {
    // Push at 23:57 — midnight is 3 minutes later, so the first entry moves
    // to 23:55 (5 minutes before midnight). Earlier-dated entries are already
    // active at push time, so the widget still renders immediately.
    const pushAt = createPrayerDatetime('2026-06-15', '23:57');
    const entries = buildPrayerWidgetTimeline(pushAt, makeSequence(), SETTINGS);

    const midnight = createPrayerDatetime('2026-06-16', '00:00').getTime();
    expect(entries[0].date.getTime()).toBe(midnight - MIN_ENTRY_SPACING_MS);
    expect(midnight - entries[0].date.getTime()).toBeGreaterThanOrEqual(MIN_ENTRY_SPACING_MS);
  });

  it('backdates the first entry when a prayer boundary is under five minutes away', () => {
    // Push at 17:44 with Asr at 17:45 — the boundary flip must stay at 17:45,
    // so the first entry backs up to 17:40 to keep the spacing.
    const pushAt = createPrayerDatetime('2026-06-15', '17:44');
    const entries = buildPrayerWidgetTimeline(pushAt, makeSequence(), SETTINGS);

    const asrBoundary = createPrayerDatetime('2026-06-15', '17:45').getTime();
    expect(entries[0].props.nextName).toBe('Asr');
    expect(entries[0].date.getTime()).toBe(asrBoundary - MIN_ENTRY_SPACING_MS);
    expect(asrBoundary - entries[0].date.getTime()).toBeGreaterThanOrEqual(MIN_ENTRY_SPACING_MS);
  });

  it('skips a midnight entry when the following prayer is under five minutes after it', () => {
    // Synthetic Fajr at 00:03 the day after tomorrow — the midnight rollover
    // would sit 3 minutes before the boundary, so it is skipped and the day
    // list rolls over at the Fajr boundary entry instead.
    const sequence: PrayerSequence = {
      type: ScheduleType.Standard,
      prayers: [
        ...makeDay('2026-06-15'),
        makePrayer('2026-06-16', '00:03', 'Fajr', 'الفجر'),
        ...makeDay('2026-06-16').slice(1),
      ],
    };

    const entries = buildPrayerWidgetTimeline(NOW, sequence, SETTINGS);
    const midnight = createPrayerDatetime('2026-06-16', '00:00').getTime();

    expect(entries.some((entry) => entry.date.getTime() === midnight)).toBe(false);

    // The day list still rolls over — at the Fajr boundary entry
    const fajrBoundary = createPrayerDatetime('2026-06-16', '00:03').getTime();
    const fajrEntry = entries.find((entry) => entry.date.getTime() === fajrBoundary);
    expect(fajrEntry).toBeDefined();
    if (!fajrEntry) return;
    expect(fajrEntry.props.dayPrayers.map((row) => row.name)).toEqual([
      'Fajr',
      'Sunrise',
      'Dhuhr',
      'Asr',
      'Magrib',
      'Isha',
    ]);
    expect(fajrEntry.props.dayPrayers[0].state).toBe('passed');
  });

  it('keeps every adjacent entry at least five minutes apart across a full-day sweep of push instants', () => {
    const dayStart = createPrayerDatetime('2026-06-15', '00:00').getTime();

    for (let minute = 0; minute < 24 * 60; minute++) {
      const pushAt = new Date(dayStart + minute * 60 * 1000);
      const entries = buildPrayerWidgetTimeline(pushAt, makeSequence(), SETTINGS);

      for (let i = 1; i < entries.length; i++) {
        const gapMs = entries[i].date.getTime() - entries[i - 1].date.getTime();
        if (gapMs < MIN_ENTRY_SPACING_MS) {
          throw new Error(`Push at minute ${minute}: entries ${i - 1}→${i} only ${gapMs / 1000}s apart`);
        }
      }
    }
  });

  it('keeps the first entry dated at or before the push instant in every sweep case', () => {
    const dayStart = createPrayerDatetime('2026-06-15', '00:00').getTime();

    for (let minute = 0; minute < 24 * 60; minute++) {
      const pushAt = new Date(dayStart + minute * 60 * 1000);
      const entries = buildPrayerWidgetTimeline(pushAt, makeSequence(), SETTINGS);

      if (entries[0].date.getTime() > pushAt.getTime()) {
        throw new Error(`Push at minute ${minute}: first entry dated after now`);
      }
    }
  });
});

// =============================================================================
// DST TRANSITIONS (Europe/London)
// =============================================================================

describe('DST transitions', () => {
  it('builds correct midnights and boundaries across the autumn clock change (2026-10-25)', () => {
    // Clocks fall back 02:00 BST → 01:00 GMT on Sunday 2026-10-25
    const sequence: PrayerSequence = {
      type: ScheduleType.Standard,
      prayers: [...makeDay('2026-10-24'), ...makeDay('2026-10-25'), ...makeDay('2026-10-26')],
    };
    const pushAt = createPrayerDatetime('2026-10-24', '12:00');

    const entries = buildPrayerWidgetTimeline(pushAt, sequence, SETTINGS);

    // One midnight per London day in the span — the final day's midnight
    // never materializes: the timeline ends at the final prayer, and the
    // stale guard takes over from there
    for (const date of ['2026-10-25', '2026-10-26']) {
      const midnight = createPrayerDatetime(date, '00:00').getTime();
      expect(entries.some((entry) => entry.date.getTime() === midnight)).toBe(true);
    }

    // Chronological order, no duplicate instants
    const times = entries.map((entry) => entry.date.getTime());
    const sorted = [...times].sort((a, b) => a - b);
    expect(times).toEqual(sorted);
    expect(new Set(times).size).toBe(times.length);
  });

  it('builds correct midnights across the spring clock change (2027-03-28)', () => {
    // Clocks spring forward 01:00 GMT → 02:00 BST on Sunday 2027-03-28
    const sequence: PrayerSequence = {
      type: ScheduleType.Standard,
      prayers: [...makeDay('2027-03-27'), ...makeDay('2027-03-28'), ...makeDay('2027-03-29')],
    };
    const pushAt = createPrayerDatetime('2027-03-27', '12:00');

    const entries = buildPrayerWidgetTimeline(pushAt, sequence, SETTINGS);

    for (const date of ['2027-03-28', '2027-03-29']) {
      const midnight = createPrayerDatetime(date, '00:00').getTime();
      expect(entries.some((entry) => entry.date.getTime() === midnight)).toBe(true);
    }

    const times = entries.map((entry) => entry.date.getTime());
    const sorted = [...times].sort((a, b) => a - b);
    expect(times).toEqual(sorted);
    expect(new Set(times).size).toBe(times.length);
  });
});

// =============================================================================
// EDGE CASES AT BOUNDARIES AND INSTANTS
// =============================================================================

describe('boundary edge cases', () => {
  it('flips immediately when now is exactly on a prayer datetime', () => {
    // At the Asr instant itself the segment flips to Magrib (Asr is prev)
    const pushAt = createPrayerDatetime('2026-06-15', '17:45');
    const entries = buildPrayerWidgetTimeline(pushAt, makeSequence(), SETTINGS);

    expect(entries[0].props.nextName).toBe('Magrib');
    expect(entries[0].props.prevEpochMs).toBe(pushAt.getTime());
  });

  it('treats now exactly at midnight as the start of the new day', () => {
    const pushAt = createPrayerDatetime('2026-06-16', '00:00');
    const entries = buildPrayerWidgetTimeline(pushAt, makeSequence(), SETTINGS);

    expect(entries[0].date.getTime()).toBe(pushAt.getTime());
    expect(entries[0].props.nextName).toBe('Fajr');
    expect(entries[0].props.dayPrayers[0].name).toBe('Fajr');
    expect(entries[0].props.dayPrayers[0].state).toBe('next');
  });

  it('survives duplicate prayer datetimes without duplicate entries', () => {
    const duplicated = makePrayer('2026-06-15', '17:45', 'Asr', 'العصر');
    const sequence: PrayerSequence = {
      type: ScheduleType.Standard,
      prayers: [...makeSequence().prayers, duplicated],
    };

    const entries = buildPrayerWidgetTimeline(NOW, sequence, SETTINGS);

    const times = entries.map((entry) => entry.date.getTime());
    expect(new Set(times).size).toBe(times.length);
    const sorted = [...times].sort((a, b) => a - b);
    expect(times).toEqual(sorted);
  });

  it('degrades gracefully across a missing cache day', () => {
    // Day 2026-06-16 absent from the sequence: the widget keeps the last
    // segment across the gap; the gap day's midnight entry carries an empty
    // day list (no prayers belong to it).
    const sequence: PrayerSequence = {
      type: ScheduleType.Standard,
      prayers: [...makeDay('2026-06-15'), ...makeDay('2026-06-17')],
    };

    const entries = buildPrayerWidgetTimeline(NOW, sequence, SETTINGS);

    const gapMidnight = createPrayerDatetime('2026-06-16', '00:00').getTime();
    const gapEntry = entries.find((entry) => entry.date.getTime() === gapMidnight);
    expect(gapEntry).toBeDefined();
    if (!gapEntry) return;
    expect(gapEntry.props.dayPrayers).toEqual([]);

    const times = entries.map((entry) => entry.date.getTime());
    const sorted = [...times].sort((a, b) => a - b);
    expect(times).toEqual(sorted);
    expect(entries[entries.length - 1].props.stale).toBe(true);
  });
});

// =============================================================================
// VOLUME & PAYLOAD INVARIANTS (16-day span, as pushed in production)
// =============================================================================

describe('volume and payload invariants', () => {
  const SPAN_DAYS = 16;
  const makeSpanSequence = (): PrayerSequence => {
    const baseDay = createPrayerDatetime('2026-06-14', '12:00');
    const prayers: Prayer[] = [];
    for (let i = 0; i < SPAN_DAYS; i++) {
      const day = addDays(baseDay, i);
      const dateString = formatDateShort(day);
      prayers.push(...makeDay(dateString));
    }
    return { type: ScheduleType.Standard, prayers };
  };

  it('emits exactly one entry per boundary and date-rollover plus the stale guard', () => {
    const sequence = makeSpanSequence();
    const entries = buildPrayerWidgetTimeline(NOW, sequence, SETTINGS);

    // The last prayer at or before now starts the first segment — iterations
    // (and their midnight rollovers) only run from there onward
    const lastPrayerAtOrBeforeNow = sequence.prayers
      .filter((prayer) => prayer.datetime.getTime() <= NOW.getTime())
      .at(-1);
    expect(lastPrayerAtOrBeforeNow).toBeDefined();
    if (!lastPrayerAtOrBeforeNow) return;

    const boundariesAfterNow = sequence.prayers.filter((prayer) => prayer.datetime.getTime() > NOW.getTime());
    // Every prayer after now becomes a boundary entry, except the final one
    // (the loop stops there — the stale guard takes over after it)
    const expectedBoundaryEntries = boundariesAfterNow.length - 1;
    // One midnight per adjacent pair that crosses a London date change, from
    // the first segment onward (pairs entirely in the past emit nothing)
    const expectedMidnights = sequence.prayers.filter((prayer, index) => {
      if (index === 0) return false;
      const previous = sequence.prayers[index - 1];
      const crossesLondonDate = formatDateShort(previous.datetime) !== formatDateShort(prayer.datetime);
      const fromFirstSegmentOnward = previous.datetime.getTime() >= lastPrayerAtOrBeforeNow.datetime.getTime();
      return crossesLondonDate && fromFirstSegmentOnward;
    }).length;

    expect(entries).toHaveLength(1 + expectedBoundaryEntries + expectedMidnights + 1);
    expect(entries[entries.length - 1].props.stale).toBe(true);
  });

  it('keeps the serialized payload well under UserDefaults comfort size', () => {
    const sequence = makeSpanSequence();
    const entries = buildPrayerWidgetTimeline(NOW, sequence, SETTINGS);

    const payloadSize = JSON.stringify(entries).length;
    expect(payloadSize).toBeLessThan(120_000);
  });
});
