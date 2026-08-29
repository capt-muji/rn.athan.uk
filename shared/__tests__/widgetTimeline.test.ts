/**
 * Unit tests for shared/widgetTimeline.ts
 *
 * Tests the iOS widget timeline builder:
 * - buildPrayerWidgetTimeline: entry generation, midnight rollovers, sorting
 * - Day list states relative to each entry
 * - Empty-sequence and exhausted-span guards
 */

import { createPrayerDatetime } from '@/shared/time';
import { type Prayer, type PrayerSequence, ScheduleType } from '@/shared/types';
import { buildPrayerWidgetTimeline } from '@/shared/widgetTimeline';

// =============================================================================
// TEST HELPERS
// =============================================================================

/** Fixed "now" for deterministic tests: 2026-06-15 14:00 London */
const NOW = createPrayerDatetime('2026-06-15', '14:00');

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
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), '#ffd000', true);

    expect(entries[0].date.getTime()).toBe(NOW.getTime());
  });

  it('first entry points at the next prayer after now (Asr)', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), '#ffd000', true);
    const first = entries[0].props;

    expect(first.nextName).toBe('Asr');
    expect(first.nextArabic).toBe('العصر');
    expect(first.nextTime).toBe('17:45');
    expect(first.nextEpochMs).toBe(createPrayerDatetime('2026-06-15', '17:45').getTime());
    // Segment starts at the previous prayer (Dhuhr at 13:10), not at now
    expect(first.prevEpochMs).toBe(createPrayerDatetime('2026-06-15', '13:10').getTime());
  });

  it('creates one entry per prayer boundary plus a midnight rollover and stale guard', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), '#ffd000', true);

    // Boundaries after now: Asr, Magrib, Isha today + 6 tomorrow = 9
    // Midnights: 1 (between Isha 22:45 and tomorrow's Fajr 03:30)
    // Stale guard: 1 (after the final prayer)
    expect(entries).toHaveLength(11);
  });

  it('ends with a stale guard entry five minutes after the final prayer', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), '#ffd000', true);

    const finalPrayer = createPrayerDatetime('2026-06-16', '22:45');
    const last = entries[entries.length - 1];

    expect(last.date.getTime()).toBe(finalPrayer.getTime() + 5 * 60 * 1000);
    expect(last.props.stale).toBe(true);
    expect(last.props.dayPrayers).toEqual([]);
    // Chronologically last
    expect(last.date.getTime()).toBe(Math.max(...entries.map((entry) => entry.date.getTime())));
  });

  it('never marks real segment entries as stale', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), '#ffd000', true);

    expect(entries.slice(0, -1).every((entry) => entry.props.stale !== true)).toBe(true);
  });

  it('sorts entries chronologically even when midnight precedes an early prayer', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), '#ffd000', true);

    const times = entries.map((entry) => entry.date.getTime());
    const sorted = [...times].sort((a, b) => a - b);
    expect(times).toEqual(sorted);
  });

  it('adds a midnight entry that keeps the current segment but rolls the day list', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), '#ffd000', true);

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
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), '#ffd000', true);

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
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), '#00ff88', false);

    expect(entries.every((entry) => entry.props.accentColor === '#00ff88')).toBe(true);
    expect(entries.every((entry) => entry.props.showArabic === false)).toBe(true);
  });

  it('places an early-morning Isha in the previous Islamic day list as next', () => {
    // June 17's Isha at 01:10 crosses midnight and belongs to June 16's day
    const sequence: PrayerSequence = {
      type: ScheduleType.Standard,
      prayers: [...makeDay('2026-06-16'), makePrayer('2026-06-17', '01:10', 'Isha', 'العشاء', '2026-06-16')],
    };

    const entries = buildPrayerWidgetTimeline(NOW, sequence, '#ffd000', true);
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
    const entries = buildPrayerWidgetTimeline(NOW, { type: ScheduleType.Standard, prayers: [] }, '#ffd000', true);

    expect(entries).toEqual([]);
  });

  it('returns an empty array when now is past the last prayer in the sequence', () => {
    const late = createPrayerDatetime('2026-06-16', '23:59');
    const entries = buildPrayerWidgetTimeline(late, makeSequence(), '#ffd000', true);

    expect(entries).toEqual([]);
  });

  it('handles a segment that starts before now when now precedes all prayers', () => {
    // Sequence starts tomorrow; now has no previous prayer in the span
    const sequence: PrayerSequence = { type: ScheduleType.Standard, prayers: makeDay('2026-06-16') };

    const entries = buildPrayerWidgetTimeline(NOW, sequence, '#ffd000', true);

    expect(entries.length).toBeGreaterThan(0);
    // First entry's segment start falls back to the entry date itself
    expect(entries[0].props.prevEpochMs).toBe(NOW.getTime());
    expect(entries[0].props.nextName).toBe('Fajr');
  });
});
