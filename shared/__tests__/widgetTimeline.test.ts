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

import {
  createPrayerDatetime,
  formatCountdownMinutes,
  formatDateLong,
  formatDateShort,
  formatHijriDateLong,
} from '@/shared/time';
import { type Prayer, type PrayerSequence, ScheduleType } from '@/shared/types';
import {
  buildPrayerWidgetTimeline,
  COUNTDOWN_STEP_MS,
  MIN_ENTRY_SPACING_MS,
  STEPPED_COUNTDOWN_HOURS,
} from '@/shared/widgetTimeline';
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
): Prayer => {
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
const makeExtrasDay = (rawDate: string, isFriday: boolean): Prayer[] => {
  const prayers: Prayer[] = [];
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
  const prayers: Prayer[] = [];

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
    // Segment starts at the previous prayer (Dhuhr at 13:10), not at now
    expect(first.prevEpochMs).toBe(createPrayerDatetime('2026-06-15', '13:10').getTime());
    // 3h 45m left: minute-ceil label, hours and minutes only
    expect(first.countdownLabel).toBe('3h 45m');
    expect(first.dateLabel).toBe(formatDateLong('2026-06-15'));
  });

  it('emits stepped countdown entries every five minutes inside the horizon', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS, 'light');

    const stepMs = NOW.getTime() + COUNTDOWN_STEP_MS;
    const step = entries.find((entry) => entry.date.getTime() === stepMs);
    expect(step).toBeDefined();
    if (!step) return;

    expect(step.props.nextName).toBe('Asr');
    expect(step.props.countdownLabel).toBe('3h 40m');
  });

  it('emits only boundary entries beyond the stepped countdown horizon', () => {
    const sequence = makeSequence();
    const entries = buildPrayerWidgetTimeline(NOW, sequence, SETTINGS, 'light');
    const horizonMs = NOW.getTime() + STEPPED_COUNTDOWN_HOURS * 60 * 60 * 1000;
    const boundaryMs = new Set(sequence.prayers.map((prayer) => prayer.datetime.getTime()));

    for (const entry of entries) {
      if (entry.date.getTime() <= horizonMs) continue;
      expect(boundaryMs.has(entry.date.getTime()) || entry.props.stale === true).toBe(true);
    }
  });

  it('keeps every instant inside the horizon within one step of a fresher label', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS, 'light');
    const horizonMs = NOW.getTime() + STEPPED_COUNTDOWN_HOURS * 60 * 60 * 1000;

    for (let instantMs = NOW.getTime(); instantMs <= horizonMs; instantMs += 60 * 1000) {
      const freshest = entries.filter((entry) => entry.date.getTime() <= instantMs).at(-1);
      if (!freshest) throw new Error(`No active entry at ${new Date(instantMs).toISOString()}`);

      const stalenessMs = instantMs - freshest.date.getTime();
      if (stalenessMs > COUNTDOWN_STEP_MS) {
        throw new Error(
          `Label at ${new Date(instantMs).toISOString()} is ${stalenessMs / 60000} minutes stale (max ${COUNTDOWN_STEP_MS / 60000})`
        );
      }
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

  it('always rounds the label up to the next minute', () => {
    const asrMs = createPrayerDatetime('2026-06-15', '17:45').getTime();
    // 11m 37s left reads "12m" — never the lower minute, never seconds
    const pushAt = new Date(asrMs - (11 * 60 + 37) * 1000);

    const entries = buildPrayerWidgetTimeline(pushAt, makeSequence(), SETTINGS, 'light');

    expect(entries[0].props.countdownLabel).toBe('12m');
  });

  it('holds "1m" through the final minute', () => {
    const asrMs = createPrayerDatetime('2026-06-15', '17:45').getTime();
    // 9m 59s left → "10m"; anything under a minute reads "1m" until the flip
    const pushAt = new Date(asrMs - (9 * 60 + 59) * 1000);

    const entries = buildPrayerWidgetTimeline(pushAt, makeSequence(), SETTINGS, 'light');

    expect(entries[0].props.countdownLabel).toBe('10m');
  });

  it('formats every label with the minute-ceil formatter at the entry date', () => {
    const asrMs = createPrayerDatetime('2026-06-15', '17:45').getTime();
    // Sub-minute remainder proves the ceil rounding matches getSecondsRemaining
    const pushAt = new Date(asrMs - (2 * 60 + 59.4) * 1000);

    const entries = buildPrayerWidgetTimeline(pushAt, makeSequence(), SETTINGS, 'light');

    for (const entry of entries) {
      if (entry.props.stale === true) continue;
      // A backdated first entry labels the push instant, not its own date
      const labelAnchor = entry.date.getTime() > pushAt.getTime() ? entry.date : pushAt;
      const msLeft = entry.props.nextEpochMs - labelAnchor.getTime();
      const secondsRemaining = Math.max(1, Math.ceil(msLeft / 1000));
      const expected = formatCountdownMinutes(secondsRemaining);
      expect(entry.props.countdownLabel).toBe(expected);
    }
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
    // The label describes the push instant (1m left), not the backdated date
    expect(entries[0].props.countdownLabel).toBe('1m');
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

  it('anchors the final stepped entry one spacing before a non-grid boundary', () => {
    // The Duha→Midnight segment (08:10→23:52) is not a multiple of the
    // step, so the aligned grid alone would leave a stale tail before the
    // flip: the builder places an anchor entry exactly one spacing before
    // the boundary, and nothing may sit between it and the flip
    const entries = buildPrayerWidgetTimeline(NOW, makeExtrasSequence(), SETTINGS, 'light');
    const anchorMs = createPrayerDatetime('2026-06-15', '23:47').getTime();
    const boundaryMs = createPrayerDatetime('2026-06-15', '23:52').getTime();

    const anchor = entries.find((entry) => entry.date.getTime() === anchorMs);
    expect(anchor).toBeDefined();
    if (!anchor) return;
    expect(anchor.props.nextName).toBe('Midnight');

    const between = entries.filter((entry) => entry.date.getTime() > anchorMs && entry.date.getTime() < boundaryMs);
    expect(between).toHaveLength(0);

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

  it('bounds the entry count to boundaries plus one stepped day plus the guard', () => {
    const sequence = makeSpanSequence();
    const entries = buildPrayerWidgetTimeline(NOW, sequence, SETTINGS, 'light');

    expect(entries[entries.length - 1].props.stale).toBe(true);
    expect(entries.length).toBeLessThan(500);
  });

  it('keeps the serialized payload well under UserDefaults comfort size', () => {
    const sequence = makeSpanSequence();
    const entries = buildPrayerWidgetTimeline(NOW, sequence, SETTINGS, 'light');

    // The medium widget's day list (six rows + activeIndex per entry) grew
    // the payload ~30% over the pre-v3 size; 155KB across ~380 entries is
    // still trivial for the app-group UserDefaults plist (parsed once per
    // widget reload), so the comfort budget is 200KB.
    const payloadSize = JSON.stringify(entries).length;
    expect(payloadSize).toBeLessThan(200_000);
  });

  it('bounds the extras entry count and payload under the same budgets', () => {
    // 16-day extras span (2026-06-14 → 2026-06-29) containing the Fridays
    // 2026-06-19 and 2026-06-26 — 4 rows per day, 5 on Fridays
    const baseDay = createPrayerDatetime('2026-06-14', '12:00');
    const prayers: Prayer[] = [];
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
