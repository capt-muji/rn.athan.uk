/**
 * Unit tests for shared/widgetTimeline.ts
 *
 * Tests the iOS widget timeline builder:
 * - buildPrayerWidgetTimeline: entry generation, boundary flips, stepped
 *   countdown entries, backdating, sorting
 * - Countdown labels as minute-ceil values (seconds never render, always
 *   round up: 11m 37s left → "12m", 59s left → "1m")
 * - Date labels tied to the next prayer's Islamic day (Hijri preference)
 * - Empty-sequence and exhausted-span guards
 */

import { addDays } from 'date-fns';

import { PRAYERS_ENGLISH } from '@/shared/constants';
import { isReadable } from '@/shared/sequence';
import { createPrayerDatetime, formatDateLong, formatDateShort, formatHijriDateLong } from '@/shared/time';
import {
  type Prayer,
  type PrayerSequence,
  type ReadablePrayer,
  ScheduleType,
  type UnreadablePrayer,
} from '@/shared/types';
import { buildPrayerWidgetTimeline, MIN_ENTRY_SPACING_MS, TIMELINE_DAYS } from '@/shared/widgetTimeline';
import type { PrayerWidgetSettings } from '@/shared/widgetTypes';
import { WIDGET_PROPS_VERSION } from '@/shared/widgetTypes';

// =============================================================================
// TEST HELPERS
// =============================================================================

/** Fixed "now" for deterministic tests: 2026-06-15 14:00 London */
const NOW = createPrayerDatetime('2026-06-15', '14:00');

/** Default settings snapshot (mirrors app defaults: Gregorian) */
const SETTINGS: PrayerWidgetSettings = {
  hijriDate: false,
};

/** Settings snapshot with Hijri dates (preference_hijri_date) */
const SETTINGS_HIJRI: PrayerWidgetSettings = { ...SETTINGS, hijriDate: true };

/** Builds a Prayer with a real London datetime */
const makePrayer = (
  date: string,
  time: string,
  english: string,
  arabic: string,
  belongsToDate?: string,
  type: ScheduleType = ScheduleType.Standard
): ReadablePrayer => {
  const datetime = createPrayerDatetime(date, time);
  return {
    type,
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
// EXTRAS FIXTURES — mirror createPrayerSequence(ScheduleType.Extra, ...)
// =============================================================================

/**
 * Winter extras times for raw day X (from transformApiData): Midnight
 * 23:52 (hours >= 12 — the creation rules place it the PREVIOUS calendar
 * evening with belongsToDate X), Last Third 02:15, Suhoor 05:55, Duha
 * 08:10, Istijaba 16:00 (Fridays only). Chronological extras order per raw
 * day X: [Midnight X-1 23:52, Last Third X 02:15, Suhoor X 05:55, Duha X
 * 08:10, Istijaba X 16:00].
 */
const EXTRA_TIMES = {
  midnight: '23:52',
  lastThird: '02:15',
  suhoor: '05:55',
  duha: '08:10',
  istijaba: '16:00',
} as const;

/** 2026-06-19 is a Friday; the fixture spans Mon 2026-06-15 → Sat 2026-06-20 */
const FRIDAY = '2026-06-19';

/** Builds day X's extras prayers exactly as createPrayerSequence(Extra) would */
const makeExtrasDay = (rawDate: string, isFriday: boolean): ReadablePrayer[] => {
  const prayers: ReadablePrayer[] = [];
  const previousDay = formatDateShort(addDays(createPrayerDatetime(rawDate, '12:00'), -1));

  prayers.push(makePrayer(previousDay, EXTRA_TIMES.midnight, 'Midnight', 'منتصف الليل', rawDate, ScheduleType.Extra));
  prayers.push(makePrayer(rawDate, EXTRA_TIMES.lastThird, 'Last Third', 'الثلث الأخير', rawDate, ScheduleType.Extra));
  prayers.push(makePrayer(rawDate, EXTRA_TIMES.suhoor, 'Suhoor', 'السحور', rawDate, ScheduleType.Extra));
  prayers.push(makePrayer(rawDate, EXTRA_TIMES.duha, 'Duha', 'الضحى', rawDate, ScheduleType.Extra));

  if (isFriday) {
    prayers.push(makePrayer(rawDate, EXTRA_TIMES.istijaba, 'Istijaba', 'الاستجابة', rawDate, ScheduleType.Extra));
  }

  return prayers;
};

/** Extras sequence spanning 2026-06-15 → 2026-06-20 (Friday 19 included) */
const makeExtrasSequence = (): PrayerSequence => {
  const baseDay = createPrayerDatetime('2026-06-15', '12:00');
  const prayers: ReadablePrayer[] = [];

  for (let i = 0; i < 6; i++) {
    const day = addDays(baseDay, i);
    const dateString = formatDateShort(day);
    prayers.push(...makeExtrasDay(dateString, dateString === FRIDAY));
  }

  prayers.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
  return { type: ScheduleType.Extra, prayers };
};

// =============================================================================
// BUILDPRAYERWIDGETTIMELINE TESTS
// =============================================================================

describe('buildPrayerWidgetTimeline', () => {
  it('starts with an entry at now', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS, 'light');

    expect(entries[0].date.getTime()).toBe(NOW.getTime());
  });

  it('first entry points at the next prayer after now (Asr) with app-format labels', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS, 'light');
    const first = entries[0].props;

    expect(first.nextName).toBe('Asr');
    expect(first.nextTime).toBe('17:45');
    expect(first.nextEpochMs).toBe(createPrayerDatetime('2026-06-15', '17:45').getTime());
    // Segment starts at the previous prayer (Dhuhr at 13:10), not at now.
    // With nextEpochMs this is the interval the layouts tick against.
    expect(first.prevEpochMs).toBe(createPrayerDatetime('2026-06-15', '13:10').getTime());
    expect(first.dateLabel).toBe(formatDateLong('2026-06-15'));
  });

  it('emits nothing between boundaries, since the countdown ticks itself', () => {
    const sequence = makeSequence();
    const entries = buildPrayerWidgetTimeline(NOW, sequence, SETTINGS, 'light');
    const boundaryMs = new Set(sequence.prayers.filter(isReadable).map((prayer) => prayer.datetime.getTime()));

    // The opening entry is dated at the push, every later one at a boundary
    // it flips on, and the guard closes the timeline.
    for (const entry of entries.slice(1)) {
      expect(boundaryMs.has(entry.date.getTime()) || entry.props.stale === true).toBe(true);
    }
  });

  it('flips to the next day at the Isha boundary, before midnight', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS, 'light');

    // Isha boundary 22:45 on June 15: next becomes June 16's Fajr and the
    // date label rolls to the 16th while it is still the 15th
    const ishaBoundary = createPrayerDatetime('2026-06-15', '22:45');
    const ishaEntry = entries.find((entry) => entry.date.getTime() === ishaBoundary.getTime());
    expect(ishaEntry).toBeDefined();
    if (!ishaEntry) return;

    expect(ishaEntry.props.nextName).toBe('Fajr');
    expect(ishaEntry.props.nextTime).toBe('03:30');
    expect(ishaEntry.props.dateLabel).toBe(formatDateLong('2026-06-16'));
  });

  it('dates an early-morning Isha by its Islamic day, not its calendar day', () => {
    // June 17's Isha at 01:10 crosses midnight and belongs to June 16's day
    const sequence: PrayerSequence = {
      type: ScheduleType.Standard,
      prayers: [...makeDay('2026-06-16'), makePrayer('2026-06-17', '01:10', 'Isha', 'العشاء', '2026-06-16')],
    };

    const entries = buildPrayerWidgetTimeline(createPrayerDatetime('2026-06-16', '12:00'), sequence, SETTINGS, 'light');

    expect(entries[0].props.nextName).toBe('Dhuhr');
    const ishaLabel = entries.find((entry) => entry.props.nextTime === '01:10');
    expect(ishaLabel).toBeDefined();
    if (!ishaLabel) return;
    expect(ishaLabel.props.nextName).toBe('Isha');
    expect(ishaLabel.props.dateLabel).toBe(formatDateLong('2026-06-16'));
  });

  it('ends with a stale guard entry at the final prayer boundary', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS, 'light');

    const finalPrayer = createPrayerDatetime('2026-06-16', '22:45');
    const last = entries[entries.length - 1];

    // The final prayer flips straight to the stale card (the last real entry
    // keeps its spacing, so the flip is never delayed here)
    expect(last.date.getTime()).toBe(finalPrayer.getTime());
    expect(last.props.stale).toBe(true);
    // Chronologically last
    expect(last.date.getTime()).toBe(Math.max(...entries.map((entry) => entry.date.getTime())));
  });

  it('never marks real segment entries as stale', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS, 'light');

    expect(entries.slice(0, -1).every((entry) => entry.props.stale !== true)).toBe(true);
  });

  it('sorts entries chronologically', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS, 'light');

    const times = entries.map((entry) => entry.date.getTime());
    const sorted = [...times].sort((a, b) => a - b);
    expect(times).toEqual(sorted);
  });

  it('carries the schema version into every entry', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS, 'light');

    expect(entries.every((entry) => entry.props.v === WIDGET_PROPS_VERSION)).toBe(true);
  });

  it('stamps standard entries and lists the day chronologically for the medium list', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS, 'light');
    const first = entries[0].props;

    expect(first.schedule).toBe('standard');
    expect(first.prayers?.map((row) => row.name)).toEqual(['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Magrib', 'Isha']);
    expect(first.activeIndex).toBe(3);
  });

  it('stamps the theme on every entry, stale guard included', () => {
    const darkEntries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS, 'dark');
    const lightEntries = buildPrayerWidgetTimeline(NOW, makeExtrasSequence(), SETTINGS, 'light');

    expect(darkEntries.every((entry) => entry.props.theme === 'dark')).toBe(true);
    expect(lightEntries.every((entry) => entry.props.theme === 'light')).toBe(true);
    expect(darkEntries[darkEntries.length - 1].props.stale).toBe(true);
  });

  it('builds identical light and dark timelines except the theme stamp', () => {
    const lightEntries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS, 'light');
    const darkEntries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS, 'dark');

    expect(lightEntries.length).toBe(darkEntries.length);
    for (let index = 0; index < lightEntries.length; index++) {
      const { theme: _lightTheme, ...lightProps } = lightEntries[index].props;
      const { theme: _darkTheme, ...darkProps } = darkEntries[index].props;
      expect(lightEntries[index].date).toEqual(darkEntries[index].date);
      expect(lightProps).toEqual(darkProps);
    }
  });

  it('gives every entry a forward-running segment for the countdown to tick', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS, 'light');

    for (const entry of entries) {
      // SwiftUI silently renders an empty string for an inverted interval,
      // so lower <= upper is what keeps the countdown on screen at all
      expect(entry.props.prevEpochMs).toBeLessThanOrEqual(entry.props.nextEpochMs);
    }
  });

  it('runs each segment from the previous prayer to the one counted down to', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS, 'light');
    const ishaBoundary = createPrayerDatetime('2026-06-15', '22:45');
    const ishaEntry = entries.find((entry) => entry.date.getTime() === ishaBoundary.getTime());

    expect(ishaEntry).toBeDefined();
    if (!ishaEntry) return;

    // Isha has just passed, so the segment runs Isha to the next day's Fajr
    expect(ishaEntry.props.prevEpochMs).toBe(ishaBoundary.getTime());
    expect(ishaEntry.props.nextEpochMs).toBe(createPrayerDatetime('2026-06-16', '03:30').getTime());
  });

  it('formats date labels in Hijri when the preference is on', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS_HIJRI, 'light');

    expect(entries[0].props.dateLabel).toBe(formatHijriDateLong('2026-06-15'));
    expect(entries.every((entry) => entry.props.dateLabel.length > 0)).toBe(true);
  });

  it('returns an empty array when the sequence has no prayers', () => {
    const entries = buildPrayerWidgetTimeline(NOW, { type: ScheduleType.Standard, prayers: [] }, SETTINGS, 'light');

    expect(entries).toEqual([]);
  });

  it('returns an empty array when now is past the last prayer in the sequence', () => {
    const late = createPrayerDatetime('2026-06-16', '23:59');
    const entries = buildPrayerWidgetTimeline(late, makeSequence(), SETTINGS, 'light');

    expect(entries).toEqual([]);
  });

  it('handles a segment that starts before now when now precedes all prayers', () => {
    // Sequence starts tomorrow; now has no previous prayer in the span
    const sequence: PrayerSequence = { type: ScheduleType.Standard, prayers: makeDay('2026-06-16') };

    const entries = buildPrayerWidgetTimeline(NOW, sequence, SETTINGS, 'light');

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
  it('backdates the first entry when a prayer boundary is under five minutes away', () => {
    // Push at 17:44 with Asr at 17:45 — the boundary flip must stay at 17:45,
    // so the first entry backs up to 17:40 to keep the spacing.
    const pushAt = createPrayerDatetime('2026-06-15', '17:44');
    const entries = buildPrayerWidgetTimeline(pushAt, makeSequence(), SETTINGS, 'light');

    const asrBoundary = createPrayerDatetime('2026-06-15', '17:45').getTime();
    expect(entries[0].props.nextName).toBe('Asr');
    expect(entries[0].date.getTime()).toBe(asrBoundary - MIN_ENTRY_SPACING_MS);
    expect(asrBoundary - entries[0].date.getTime()).toBeGreaterThanOrEqual(MIN_ENTRY_SPACING_MS);
  });

  it('keeps every adjacent entry at least five minutes apart across a full-day sweep of push instants', () => {
    const dayStart = createPrayerDatetime('2026-06-15', '00:00').getTime();

    for (let minute = 0; minute < 24 * 60; minute++) {
      const pushAt = new Date(dayStart + minute * 60 * 1000);
      const entries = buildPrayerWidgetTimeline(pushAt, makeSequence(), SETTINGS, 'light');

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
      const entries = buildPrayerWidgetTimeline(pushAt, makeSequence(), SETTINGS, 'light');

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
  it('builds strictly increasing entries across the autumn clock change (2026-10-25)', () => {
    // Clocks fall back 02:00 BST → 01:00 GMT on Sunday 2026-10-25
    const sequence: PrayerSequence = {
      type: ScheduleType.Standard,
      prayers: [...makeDay('2026-10-24'), ...makeDay('2026-10-25'), ...makeDay('2026-10-26')],
    };
    const pushAt = createPrayerDatetime('2026-10-24', '12:00');

    const entries = buildPrayerWidgetTimeline(pushAt, sequence, SETTINGS, 'light');

    const times = entries.map((entry) => entry.date.getTime());
    const sorted = [...times].sort((a, b) => a - b);
    expect(times).toEqual(sorted);
    expect(new Set(times).size).toBe(times.length);
  });

  it('builds strictly increasing entries across the spring clock change (2027-03-28)', () => {
    // Clocks spring forward 01:00 GMT → 02:00 BST on Sunday 2027-03-28
    const sequence: PrayerSequence = {
      type: ScheduleType.Standard,
      prayers: [...makeDay('2027-03-27'), ...makeDay('2027-03-28'), ...makeDay('2027-03-29')],
    };
    const pushAt = createPrayerDatetime('2027-03-27', '12:00');

    const entries = buildPrayerWidgetTimeline(pushAt, sequence, SETTINGS, 'light');

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
    const entries = buildPrayerWidgetTimeline(pushAt, makeSequence(), SETTINGS, 'light');

    expect(entries[0].props.nextName).toBe('Magrib');
    expect(entries[0].props.prevEpochMs).toBe(pushAt.getTime());
  });

  it('survives duplicate prayer datetimes without duplicate entries', () => {
    const duplicated = makePrayer('2026-06-15', '17:45', 'Asr', 'العصر');
    const sequence: PrayerSequence = {
      type: ScheduleType.Standard,
      prayers: [...makeSequence().prayers, duplicated],
    };

    const entries = buildPrayerWidgetTimeline(NOW, sequence, SETTINGS, 'light');

    const times = entries.map((entry) => entry.date.getTime());
    expect(new Set(times).size).toBe(times.length);
    const sorted = [...times].sort((a, b) => a - b);
    expect(times).toEqual(sorted);
  });

  it('degrades gracefully across a missing cache day', () => {
    // Day 2026-06-16 absent from the sequence: the widget keeps the last
    // segment across the gap; only the stale guard ends the timeline
    const sequence: PrayerSequence = {
      type: ScheduleType.Standard,
      prayers: [...makeDay('2026-06-15'), ...makeDay('2026-06-17')],
    };

    const entries = buildPrayerWidgetTimeline(NOW, sequence, SETTINGS, 'light');

    const times = entries.map((entry) => entry.date.getTime());
    const sorted = [...times].sort((a, b) => a - b);
    expect(times).toEqual(sorted);
    expect(entries[entries.length - 1].props.stale).toBe(true);
  });
});

// =============================================================================
// EXTRAS SCHEDULE (canonical ordering, Friday Istijaba, schedule stamping)
// =============================================================================

describe('extras schedule timeline', () => {
  it('stamps every entry — including the stale guard — with the extras schedule', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeExtrasSequence(), SETTINGS, 'light');

    expect(entries.every((entry) => entry.props.schedule === 'extra')).toBe(true);
    expect(entries[entries.length - 1].props.stale).toBe(true);
    expect(entries[entries.length - 1].props.schedule).toBe('extra');
  });

  it('shows a canonical 4-row day list on non-Fridays with the next time active', () => {
    // Monday 14:00: Monday's extras have all passed — next is Tuesday's
    // Midnight (datetime Mon 23:52, belongsToDate Tue), so the list rolls to
    // Tuesday: 4 rows in canonical order, Midnight active at index 0
    const entries = buildPrayerWidgetTimeline(NOW, makeExtrasSequence(), SETTINGS, 'light');
    const first = entries[0].props;

    expect(first.nextName).toBe('Midnight');
    expect(first.schedule).toBe('extra');
    expect(first.prayers?.map((row) => row.name)).toEqual(['Midnight', 'Last Third', 'Suhoor', 'Duha']);
    expect(first.activeIndex).toBe(0);
  });

  it('grows the day list to 5 rows with Istijaba last on Fridays', () => {
    // Friday 12:00: next is Friday's Istijaba (16:00) — canonical order puts
    // it LAST even though it is chronologically the final upcoming row
    const fridayNoon = createPrayerDatetime(FRIDAY, '12:00');
    const entries = buildPrayerWidgetTimeline(fridayNoon, makeExtrasSequence(), SETTINGS, 'light');
    const first = entries[0].props;

    expect(first.nextName).toBe('Istijaba');
    expect(first.prayers?.map((row) => row.name)).toEqual(['Midnight', 'Last Third', 'Suhoor', 'Duha', 'Istijaba']);
    expect(first.activeIndex).toBe(4);
  });

  it('reveals the Friday list on Thursday evening, mirroring displayDate semantics', () => {
    // Thursday 22:00: next is the Midnight belonging to Friday (its datetime
    // sits Thursday 23:52 — the sequence's night prayers for day X precede
    // day X chronologically) — the list is already Friday's 5 rows with
    // Istijaba last
    const thursdayNight = createPrayerDatetime('2026-06-18', '22:00');
    const entries = buildPrayerWidgetTimeline(thursdayNight, makeExtrasSequence(), SETTINGS, 'light');
    const first = entries[0].props;

    expect(first.nextName).toBe('Midnight');
    expect(first.prayers?.map((row) => row.name)).toEqual(['Midnight', 'Last Third', 'Suhoor', 'Duha', 'Istijaba']);
    expect(first.activeIndex).toBe(0);
  });

  it('rolls to the next day at the final extra boundary of the day', () => {
    // At the Istijaba boundary the countdown target becomes the night's
    // Midnight, whose belongsToDate is Saturday — the list rolls with it
    const istijabaBoundary = createPrayerDatetime(FRIDAY, EXTRA_TIMES.istijaba);
    const entries = buildPrayerWidgetTimeline(NOW, makeExtrasSequence(), SETTINGS, 'light');
    const rollEntry = entries.find((entry) => entry.date.getTime() === istijabaBoundary.getTime());

    expect(rollEntry).toBeDefined();
    if (!rollEntry) return;
    expect(rollEntry.props.nextName).toBe('Midnight');
    expect(rollEntry.props.prayers?.map((row) => row.name)).toEqual(['Midnight', 'Last Third', 'Suhoor', 'Duha']);
    expect(rollEntry.props.activeIndex).toBe(0);
  });

  it('holds one entry across a long segment and flips exactly at its boundary', () => {
    // The Duha→Midnight segment (08:10→23:52) runs most of a day. Nothing
    // needs to happen inside it: the countdown ticks itself, so a single
    // entry carries the whole stretch and the next one lands on the flip.
    const entries = buildPrayerWidgetTimeline(NOW, makeExtrasSequence(), SETTINGS, 'light');
    const boundaryMs = createPrayerDatetime('2026-06-15', '23:52').getTime();

    const duhaEntry = entries.filter((entry) => entry.date.getTime() < boundaryMs).at(-1);
    expect(duhaEntry).toBeDefined();
    if (!duhaEntry) return;
    expect(duhaEntry.props.nextName).toBe('Midnight');

    const flip = entries.find((entry) => entry.date.getTime() === boundaryMs);
    expect(flip).toBeDefined();
    if (!flip) return;
    expect(flip.props.nextName).toBe('Last Third');
  });

  it('sorts canonically even when the sequence order contradicts the canonical order', () => {
    // Hand-built day mirroring the canonicalDisplayOrder contract example:
    // chronologically [Duha 09:00, Istijaba 15:14, Midnight 23:17] all
    // belonging to one day — the medium list must read canonically
    const date = '2026-06-15';
    const sequence: PrayerSequence = {
      type: ScheduleType.Extra,
      prayers: [
        makePrayer(date, '09:00', 'Duha', 'الضحى', date, ScheduleType.Extra),
        makePrayer(date, '15:14', 'Istijaba', 'الاستجابة', date, ScheduleType.Extra),
        makePrayer(date, '23:17', 'Midnight', 'منتصف الليل', date, ScheduleType.Extra),
      ],
    };

    const entries = buildPrayerWidgetTimeline(createPrayerDatetime(date, '08:00'), sequence, SETTINGS, 'light');

    expect(entries[0].props.nextName).toBe('Duha');
    expect(entries[0].props.prayers?.map((row) => row.name)).toEqual(['Midnight', 'Duha', 'Istijaba']);
    expect(entries[0].props.activeIndex).toBe(1);
  });
});

// =============================================================================
// COUNTDOWN HONESTY
//
// The countdown is no longer a value the builder writes: the layouts hand
// SwiftUI the segment and iOS renders the remaining time itself. So the only
// way it can lie is for the segment to name the wrong prayer, and the only
// way it can stall at zero is for an entry to outlive its own boundary.
// These sweep every minute of a production-sized span looking for both.
// =============================================================================

describe('countdown honesty', () => {
  /** Realistic October London times. The Isha→Fajr night runs 9h 50m — the
   *  segment the audit caught reading "9h 50m" five minutes before Fajr. */
  const OCTOBER_TIMES: [string, string, string][] = [
    ['Fajr', 'الفجر', '05:30'],
    ['Sunrise', 'الشروق', '07:10'],
    ['Dhuhr', 'الظهر', '12:40'],
    ['Asr', 'العصر', '15:20'],
    ['Magrib', 'المغرب', '17:50'],
    ['Isha', 'العشاء', '19:40'],
  ];

  // Every OCTOBER_TIMES gap is a whole number of 5-minute steps, so the aligned grid
  // divides each segment exactly and leaves no remainder — which makes where the
  // remainder LANDS structurally unobservable. Real prayer intervals are not multiples
  // of five minutes; these are not either. Finding 38 hid behind that for a whole
  // session, so both fixtures now run through the same sweep.
  const RAGGED_TIMES: [string, string, string][] = [
    ['Fajr', 'الفجر', '05:31'],
    ['Sunrise', 'الشروق', '07:13'],
    ['Dhuhr', 'الظهر', '12:41'],
    ['Asr', 'العصر', '15:23'],
    ['Magrib', 'المغرب', '17:52'],
    ['Isha', 'العشاء', '19:44'],
  ];

  const SPAN_START = '2026-10-18';
  /** The span stores/widget.ts pushes: TIMELINE_DAYS ahead, plus yesterday */
  const SPAN_DAYS = TIMELINE_DAYS + 1;
  const PUSH_AT = createPrayerDatetime(SPAN_START, '12:00');

  const makeSequence = (times: [string, string, string][]): PrayerSequence => {
    const base = createPrayerDatetime(SPAN_START, '12:00');
    const prayers: Prayer[] = [];

    for (let dayIndex = 0; dayIndex < SPAN_DAYS; dayIndex++) {
      const date = formatDateShort(addDays(base, dayIndex));
      for (const [english, arabic, time] of times) {
        prayers.push(makePrayer(date, time, english, arabic));
      }
    }

    return { type: ScheduleType.Standard, prayers };
  };

  const makeOctoberSequence = (): PrayerSequence => makeSequence(OCTOBER_TIMES);

  /** The entry WidgetKit renders at `instant`: the last one dated at or before it */
  const activeAt = <T extends { date: Date }>(entries: T[], instant: number): T | undefined =>
    entries.filter((entry) => entry.date.getTime() <= instant).at(-1);

  it.each([
    ['step-aligned times', OCTOBER_TIMES],
    ['times that do not divide by the step', RAGGED_TIMES],
  ])('counts down to the true next prayer at every minute of the span (%s)', (_label, times) => {
    const sequence = makeSequence(times);
    const entries = buildPrayerWidgetTimeline(PUSH_AT, sequence, SETTINGS, 'light');
    const endMs = entries[entries.length - 1].date.getTime();
    const moments = sequence.prayers.filter(isReadable).map((prayer) => prayer.datetime.getTime());

    for (let instant = PUSH_AT.getTime(); instant < endMs; instant += 60 * 1000) {
      const active = activeAt(entries, instant);
      if (!active || active.props.stale === true) continue;

      const trueNext = moments.find((ms) => ms > instant);
      if (active.props.nextEpochMs !== trueNext) {
        throw new Error(
          `At ${new Date(instant).toISOString()} the widget counts down to ` +
            `${new Date(active.props.nextEpochMs).toISOString()}, but the next prayer is ` +
            `${trueNext === undefined ? 'none' : new Date(trueNext).toISOString()}`
        );
      }
    }
  });

  it('never leaves an entry counting down to a prayer that has already passed', () => {
    // A segment whose upper bound is behind the clock renders as a frozen
    // 0:00 on device, with nothing to signal it. Every entry must therefore
    // be replaced no later than the prayer it points at.
    const entries = buildPrayerWidgetTimeline(PUSH_AT, makeOctoberSequence(), SETTINGS, 'light');

    for (const [index, entry] of entries.entries()) {
      if (entry.props.stale === true) continue;

      const successor = entries[index + 1];
      expect(successor).toBeDefined();
      if (!successor) return;
      expect(successor.date.getTime()).toBeLessThanOrEqual(entry.props.nextEpochMs);
    }
  });
});

// =============================================================================
// VOLUME & PAYLOAD INVARIANTS (31-day span, as pushed in production)
// =============================================================================

describe('volume and payload invariants', () => {
  const SPAN_DAYS = TIMELINE_DAYS + 1;
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

  it('emits no more entries than there are prayers left, plus the opener and the guard', () => {
    // THE budget guard. WidgetKit archives a rendered view per entry against
    // the extension's ~30 MB ceiling, and blowing it does not surface as an
    // error: iOS masks the missing render as "Please adopt containerBackground
    // API" and the widget goes black. A 16-day span once emitted ~380 entries
    // here (a 24-hour grid of 5-minute countdown steps) and blacked out every
    // kind that was not trivially small. One entry per boundary is the shape
    // that fixed it, so this pins the shape rather than a magic number.
    const sequence = makeSpanSequence();
    const entries = buildPrayerWidgetTimeline(NOW, sequence, SETTINGS, 'light');
    const stillAhead = sequence.prayers.filter(
      (prayer) => isReadable(prayer) && prayer.datetime.getTime() > NOW.getTime()
    );

    expect(entries[entries.length - 1].props.stale).toBe(true);
    expect(entries.length).toBeLessThanOrEqual(stillAhead.length + 2);
    // The bound above is relative to the prayers ahead, so it holds at ANY
    // horizon and would not notice a jump to a year. This one would: 250 sits
    // above the 185 a 30-day horizon emits and far below the ~380 that failed.
    expect(entries.length).toBeLessThan(250);
  });

  it('carries a 30-day horizon', () => {
    // The owner's goal is that the widget never needs the app opened; 30 days
    // is how far that reaches inside the entry budget. The bounds below are all
    // upper bounds, and the fixture scales with the constant, so shrinking the
    // horizon would satisfy every one of them. This is what notices.
    expect(TIMELINE_DAYS).toBe(30);
  });

  it('keeps the serialized payload well under UserDefaults comfort size', () => {
    const sequence = makeSpanSequence();
    const entries = buildPrayerWidgetTimeline(NOW, sequence, SETTINGS, 'light');

    // The medium widget's day list (six rows + activeIndex per entry) is the
    // payload driver. A 30-day horizon measures ~78KB across ~185 entries,
    // trivial for the app-group UserDefaults plist (parsed once per widget
    // reload), so the comfort budget is 200KB. That budget is also the only
    // automatic warning that the horizon has grown too far: raise the horizon,
    // never this number.
    const payloadSize = JSON.stringify(entries).length;
    expect(payloadSize).toBeLessThan(200_000);
  });

  it('bounds the extras entry count and payload under the same budgets', () => {
    // 31-day extras span (2026-06-14 → 2026-07-14) containing the Fridays
    // 2026-06-19, 2026-06-26, 2026-07-03 and 2026-07-10 — 4 rows per day,
    // 5 on Fridays
    const baseDay = createPrayerDatetime('2026-06-14', '12:00');
    const prayers: ReadablePrayer[] = [];
    for (let i = 0; i < SPAN_DAYS; i++) {
      const day = addDays(baseDay, i);
      const dateString = formatDateShort(day);
      const weekday = day.getUTCDay();
      prayers.push(...makeExtrasDay(dateString, weekday === 5));
    }
    prayers.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
    const sequence: PrayerSequence = { type: ScheduleType.Extra, prayers };

    const entries = buildPrayerWidgetTimeline(NOW, sequence, SETTINGS, 'light');

    expect(entries[entries.length - 1].props.stale).toBe(true);
    expect(entries.length).toBeLessThan(500);

    const payloadSize = JSON.stringify(entries).length;
    expect(payloadSize).toBeLessThan(200_000);
  });
});

// =============================================================================
// UNREADABLE ROWS
//
// A row the provider gave no readable time for has no moment, so the widget
// follows the app's own rules for it (shared/sequence.ts): it is never a
// boundary and never counted down to, it is drawn as --:--, and a list day
// with no readable row stays on screen until 00:00 London
// (ai/features/uat-2/DASHES-DESIGN.md §8).
// =============================================================================

describe('unreadable rows', () => {
  const DASH = '--:--';
  const at = (date: string, time: string): number => createPrayerDatetime(date, time).getTime();

  /** The row as a provider fault leaves it: still on its list, with no time */
  const unreadable = (prayer: Prayer): UnreadablePrayer => ({ ...prayer, datetime: null, time: null });

  /** makeDay with the named rows unreadable */
  const makeDayWithout = (date: string, names: readonly string[]): Prayer[] =>
    makeDay(date).map((prayer) => (names.includes(prayer.english) ? unreadable(prayer) : prayer));

  const standard = (...days: Prayer[][]): PrayerSequence => ({ type: ScheduleType.Standard, prayers: days.flat() });

  /** The entry WidgetKit renders at `instant`: the last one dated at or before it */
  const activeAt = <T extends { date: Date }>(entries: T[], instant: number): T | undefined =>
    entries.filter((entry) => entry.date.getTime() <= instant).at(-1);

  it('lists an unreadable Asr as --:--, the pill and countdown going from Dhuhr to Magrib with no bar to measure', () => {
    const entries = buildPrayerWidgetTimeline(
      createPrayerDatetime('2026-06-15', '12:00'),
      standard(makeDayWithout('2026-06-15', ['Asr']), makeDayWithout('2026-06-16', ['Asr'])),
      SETTINGS,
      'light'
    );
    const dhuhrMs = at('2026-06-15', '13:10');
    const magribMs = at('2026-06-15', '21:15');

    expect(entries[0].props).toMatchObject({ nextName: 'Dhuhr', activeIndex: 2 });
    expect(entries[0].props.prayers).toEqual([
      { name: 'Fajr', time: '03:30' },
      { name: 'Sunrise', time: '05:20' },
      { name: 'Dhuhr', time: '13:10' },
      { name: 'Asr', time: DASH },
      { name: 'Magrib', time: '21:15' },
      { name: 'Isha', time: '22:45' },
    ]);

    const afternoon = entries.filter((entry) => entry.date.getTime() >= dhuhrMs && entry.date.getTime() < magribMs);
    expect(afternoon[0].date.getTime()).toBe(dhuhrMs);
    // Dhuhr to Magrib is one segment, so one entry covers the whole afternoon:
    // the unreadable Asr between them is never a boundary
    expect(afternoon).toHaveLength(1);
    for (const entry of afternoon) {
      expect(entry.props).toMatchObject({
        nextName: 'Magrib',
        nextEpochMs: magribMs,
        activeIndex: 4,
      });
      // The row above Magrib is the unreadable Asr, so there is no previous prayer and the bar starts at the entry
      expect(entry.props.prevEpochMs).toBe(entry.date.getTime());
    }

    expect(entries.some((entry) => entry.props.nextName === 'Asr')).toBe(false);
  });

  it('gives an unreadable Asr no boundary: beyond the stepped horizon nothing flips at its clock reading', () => {
    const pushAt = createPrayerDatetime('2026-06-15', '12:00');
    const asrReadingMs = at('2026-06-16', '17:45');
    const flipsAtAsrReading = (sequence: PrayerSequence): boolean =>
      buildPrayerWidgetTimeline(pushAt, sequence, SETTINGS, 'light').some(
        (entry) => entry.date.getTime() === asrReadingMs
      );

    // The same day with Asr readable does flip there, so the absence below is the rule and not the fixture
    expect(flipsAtAsrReading(standard(makeDay('2026-06-15'), makeDay('2026-06-16')))).toBe(true);
    expect(flipsAtAsrReading(standard(makeDay('2026-06-15'), makeDayWithout('2026-06-16', ['Asr'])))).toBe(false);
  });

  it('keeps the list before after its Isha until 00:00, then holds a day with no readable row until its own 00:00', () => {
    const entries = buildPrayerWidgetTimeline(
      createPrayerDatetime('2026-06-15', '20:00'),
      standard(makeDay('2026-06-15'), makeDayWithout('2026-06-16', PRAYERS_ENGLISH), makeDay('2026-06-17')),
      SETTINGS,
      'light'
    );
    const ishaMs = at('2026-06-15', '22:45');
    const dayStartMs = at('2026-06-16', '00:00');
    const holdEndMs = at('2026-06-17', '00:00');
    const fajrMs = at('2026-06-17', '03:30');

    // The 15th's own rows stay listed with no active row between its Isha and its 00:00 (R8)
    const waiting = entries.filter((entry) => entry.date.getTime() >= ishaMs && entry.date.getTime() < dayStartMs);
    expect(waiting[0].date.getTime()).toBe(ishaMs);
    for (const entry of waiting) {
      expect(entry.props).toMatchObject({
        nextName: 'Fajr',
        nextEpochMs: fajrMs,
        dateLabel: formatDateLong('2026-06-17'),
        activeIndex: -1,
      });
      expect(entry.props.prayers?.map((row) => row.time)).toEqual([
        '03:30',
        '05:20',
        '13:10',
        '17:45',
        '21:15',
        '22:45',
      ]);
    }

    const held = entries.filter((entry) => entry.date.getTime() >= dayStartMs && entry.date.getTime() < holdEndMs);
    expect(held[0].date.getTime()).toBe(dayStartMs);
    for (const entry of held) {
      expect(entry.props).toMatchObject({
        nextName: 'Fajr',
        nextTime: '03:30',
        nextEpochMs: fajrMs,
        // Fajr's own day: a list with no active row cannot be drawn, so the layouts show Fajr's name and
        // time instead, and a real time must not sit under a day that has none
        dateLabel: formatDateLong('2026-06-17'),
        prayers: PRAYERS_ENGLISH.map((name) => ({ name, time: DASH })),
        activeIndex: -1,
      });
      // Neither Fajr's list nor the list before it has a readable row ahead of Fajr, so there is no
      // previous prayer and the bar starts at the entry itself
      expect(entry.props.prevEpochMs).toBe(entry.date.getTime());
    }

    expect(activeAt(entries, holdEndMs - 1000)?.props.prayers?.every((row) => row.time === DASH)).toBe(true);
    const rollover = entries.find((entry) => entry.date.getTime() === holdEndMs);
    expect(rollover?.props).toMatchObject({
      nextName: 'Fajr',
      nextEpochMs: fajrMs,
      dateLabel: formatDateLong('2026-06-17'),
      activeIndex: 0,
    });
    expect(rollover?.props.prayers?.map((row) => row.time)).toEqual([
      '03:30',
      '05:20',
      '13:10',
      '17:45',
      '21:15',
      '22:45',
    ]);
  });

  it('starts inside a held day with no active row, and backdates the first entry before an imminent 00:00', () => {
    const sequence = standard(
      makeDay('2026-06-15'),
      makeDayWithout('2026-06-16', PRAYERS_ENGLISH),
      makeDay('2026-06-17')
    );
    const holdEndMs = at('2026-06-17', '00:00');
    const fajrMs = at('2026-06-17', '03:30');

    const afternoon = buildPrayerWidgetTimeline(
      createPrayerDatetime('2026-06-16', '14:00'),
      sequence,
      SETTINGS,
      'light'
    );
    expect(afternoon[0].date.getTime()).toBe(at('2026-06-16', '14:00'));
    expect(afternoon[0].props).toMatchObject({
      nextName: 'Fajr',
      nextEpochMs: fajrMs,
      prevEpochMs: at('2026-06-16', '14:00'),
      dateLabel: formatDateLong('2026-06-17'),
      activeIndex: -1,
    });

    const pushMs = holdEndMs - 2 * 60 * 1000;
    const lastMinutes = buildPrayerWidgetTimeline(new Date(pushMs), sequence, SETTINGS, 'light');
    expect(lastMinutes[0].date.getTime()).toBe(holdEndMs - MIN_ENTRY_SPACING_MS);
    expect(lastMinutes[0].props).toMatchObject({
      dateLabel: formatDateLong('2026-06-17'),
      activeIndex: -1,
    });
    expect(lastMinutes[1].date.getTime()).toBe(holdEndMs);
    expect(lastMinutes[1].props).toMatchObject({ dateLabel: formatDateLong('2026-06-17'), activeIndex: 0 });
  });

  it('rolls the list to the next day at Magrib when Isha is unreadable', () => {
    const entries = buildPrayerWidgetTimeline(
      createPrayerDatetime('2026-06-15', '20:00'),
      standard(makeDayWithout('2026-06-15', ['Isha']), makeDay('2026-06-16')),
      SETTINGS,
      'light'
    );
    const magribMs = at('2026-06-15', '21:15');

    const before = activeAt(entries, magribMs - 1000);
    expect(before?.props).toMatchObject({
      nextName: 'Magrib',
      activeIndex: 4,
      dateLabel: formatDateLong('2026-06-15'),
    });
    expect(before?.props.prayers?.[5]).toEqual({ name: 'Isha', time: DASH });

    const flip = activeAt(entries, magribMs);
    expect(flip?.date.getTime()).toBe(magribMs);
    expect(flip?.props).toMatchObject({
      nextName: 'Fajr',
      nextEpochMs: at('2026-06-16', '03:30'),
      prevEpochMs: magribMs,
      dateLabel: formatDateLong('2026-06-16'),
      activeIndex: 0,
    });

    // The 16th's Isha is readable and counted down to in its turn; the 15th's list never targets its own
    const fifteenth = entries.filter((entry) => entry.props.dateLabel === formatDateLong('2026-06-15'));
    expect(fifteenth.length).toBeGreaterThan(0);
    expect(fifteenth.map((entry) => entry.props.nextName)).not.toContain('Isha');
  });

  // Dhuhr at 03:33 kills the crowded-flip skip's `>=` becoming `===`, and at 03:35 it becoming `>`
  it.each(['03:33', '03:35'])(
    'keeps five minutes between entries when boundaries crowd together, showing what is current by then (Dhuhr %s)',
    (dhuhr) => {
      // Well-formed times a few minutes apart, which validation accepts (finding 70)
      const date = '2026-06-15';
      const crowded: Prayer[] = [
        makePrayer(date, '03:30', 'Fajr', 'الفجر'),
        makePrayer(date, '03:31', 'Sunrise', 'الشروق'),
        makePrayer(date, dhuhr, 'Dhuhr', 'الظهر'),
        makePrayer(date, '17:45', 'Asr', 'العصر'),
        makePrayer(date, '21:15', 'Magrib', 'المغرب'),
        makePrayer(date, '22:45', 'Isha', 'العشاء'),
      ];
      const entries = buildPrayerWidgetTimeline(
        createPrayerDatetime(date, '03:00'),
        standard(crowded),
        SETTINGS,
        'light'
      );

      for (let i = 1; i < entries.length; i++) {
        expect(entries[i].date.getTime() - entries[i - 1].date.getTime()).toBeGreaterThanOrEqual(MIN_ENTRY_SPACING_MS);
      }

      // Fajr's flip has its five minutes after the last step, so it stays on its boundary
      expect(activeAt(entries, at(date, '03:30'))?.date.getTime()).toBe(at(date, '03:30'));
      expect(activeAt(entries, at(date, '03:30'))?.props.nextName).toBe('Sunrise');

      // Sunrise's flip has to wait until 03:35, when Dhuhr is due or has passed, so it would have nothing to show:
      // the entry at 03:35 shows what is current then, counted from 03:35, and no entry ever counts down to Dhuhr
      const settled = activeAt(entries, at(date, '03:35'));
      expect(settled?.date.getTime()).toBe(at(date, '03:35'));
      expect(settled?.props).toMatchObject({
        nextName: 'Asr',
        prevEpochMs: at(date, dhuhr),
        activeIndex: 3,
      });
      expect(entries.some((entry) => entry.props.nextName === 'Dhuhr')).toBe(false);
    }
  );

  it('passes over unreadable night rows on an Extras list', () => {
    // As when the 16th's Magrib is unreadable: the night leading into the 17th has no Midnight or Last Third
    const prayers = ['2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18'].flatMap((date) =>
      makeExtrasDay(date, false).map((prayer) =>
        date === '2026-06-17' && (prayer.english === 'Midnight' || prayer.english === 'Last Third')
          ? unreadable(prayer)
          : prayer
      )
    );
    const entries = buildPrayerWidgetTimeline(
      createPrayerDatetime('2026-06-16', '07:00'),
      { type: ScheduleType.Extra, prayers },
      SETTINGS,
      'light'
    );
    const duhaMs = at('2026-06-16', '08:10');
    const suhoorMs = at('2026-06-17', '05:55');

    expect(entries[0].props).toMatchObject({
      nextName: 'Duha',
      activeIndex: 3,
      dateLabel: formatDateLong('2026-06-16'),
    });

    const night = entries.filter((entry) => entry.date.getTime() >= duhaMs && entry.date.getTime() < suhoorMs);
    expect(night[0].date.getTime()).toBe(duhaMs);
    for (const entry of night) {
      expect(entry.props).toMatchObject({
        nextName: 'Suhoor',
        nextEpochMs: suhoorMs,
        dateLabel: formatDateLong('2026-06-17'),
        activeIndex: 2,
        prayers: [
          { name: 'Midnight', time: DASH },
          { name: 'Last Third', time: DASH },
          { name: 'Suhoor', time: '05:55' },
          { name: 'Duha', time: '08:10' },
        ],
      });
      // The row above Suhoor is the unreadable Last Third, so the bar starts at the entry, not at Duha
      expect(entry.props.prevEpochMs).toBe(entry.date.getTime());
    }

    expect(activeAt(entries, suhoorMs)?.props).toMatchObject({ nextName: 'Duha', activeIndex: 3 });
  });

  it.each([
    ['before those days', '2026-06-14'],
    ['during those days', '2026-06-15'],
    ['after those days', '2026-06-17'],
  ])('builds no entries from a sequence with no readable row (%s)', (_label, date) => {
    const sequence = standard(
      makeDayWithout('2026-06-15', PRAYERS_ENGLISH),
      makeDayWithout('2026-06-16', PRAYERS_ENGLISH)
    );

    expect(buildPrayerWidgetTimeline(createPrayerDatetime(date, '14:00'), sequence, SETTINGS, 'light')).toEqual([]);
  });

  it('flips to the stale card at the last readable row when only unreadable rows follow it', () => {
    const sequence = standard(
      makeDay('2026-06-15'),
      makeDayWithout('2026-06-16', ['Isha']),
      makeDayWithout('2026-06-17', PRAYERS_ENGLISH)
    );
    const entries = buildPrayerWidgetTimeline(NOW, sequence, SETTINGS, 'light');
    const magribMs = at('2026-06-16', '21:15');

    expect(entries.at(-1)).toEqual({
      date: new Date(magribMs),
      props: {
        v: WIDGET_PROPS_VERSION,
        schedule: 'standard',
        theme: 'light',
        nextName: 'Magrib',
        nextTime: '21:15',
        nextEpochMs: magribMs,
        prevEpochMs: magribMs,
        dateLabel: formatDateLong('2026-06-16'),
        stale: true,
      },
    });
    expect(activeAt(entries, magribMs - 1000)?.props.nextName).toBe('Magrib');
    expect(activeAt(entries, magribMs - 1000)?.props.stale).toBeUndefined();

    // Nothing after that row can be counted down to, whether the push lands on its day or on the day after
    expect(buildPrayerWidgetTimeline(new Date(magribMs + 1000), sequence, SETTINGS, 'light')).toEqual([]);
    expect(buildPrayerWidgetTimeline(createPrayerDatetime('2026-06-17', '12:00'), sequence, SETTINGS, 'light')).toEqual(
      []
    );
  });
});
