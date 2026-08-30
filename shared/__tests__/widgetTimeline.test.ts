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

  it('first entry points at the next prayer after now (Asr) with app-format labels', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS);
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
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS);

    const stepMs = NOW.getTime() + COUNTDOWN_STEP_MS;
    const step = entries.find((entry) => entry.date.getTime() === stepMs);
    expect(step).toBeDefined();
    if (!step) return;

    expect(step.props.nextName).toBe('Asr');
    expect(step.props.countdownLabel).toBe('3h 40m');
  });

  it('emits only boundary entries beyond the stepped countdown horizon', () => {
    const sequence = makeSequence();
    const entries = buildPrayerWidgetTimeline(NOW, sequence, SETTINGS);
    const horizonMs = NOW.getTime() + STEPPED_COUNTDOWN_HOURS * 60 * 60 * 1000;
    const boundaryMs = new Set(sequence.prayers.map((prayer) => prayer.datetime.getTime()));

    for (const entry of entries) {
      if (entry.date.getTime() <= horizonMs) continue;
      expect(boundaryMs.has(entry.date.getTime()) || entry.props.stale === true).toBe(true);
    }
  });

  it('keeps every instant inside the horizon within one step of a fresher label', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS);
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
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS);

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

    const entries = buildPrayerWidgetTimeline(createPrayerDatetime('2026-06-16', '12:00'), sequence, SETTINGS);

    expect(entries[0].props.nextName).toBe('Dhuhr');
    const ishaLabel = entries.find((entry) => entry.props.nextTime === '01:10');
    expect(ishaLabel).toBeDefined();
    if (!ishaLabel) return;
    expect(ishaLabel.props.nextName).toBe('Isha');
    expect(ishaLabel.props.dateLabel).toBe(formatDateLong('2026-06-16'));
  });

  it('ends with a stale guard entry at the final prayer boundary', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS);

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
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS);

    expect(entries.slice(0, -1).every((entry) => entry.props.stale !== true)).toBe(true);
  });

  it('sorts entries chronologically', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS);

    const times = entries.map((entry) => entry.date.getTime());
    const sorted = [...times].sort((a, b) => a - b);
    expect(times).toEqual(sorted);
  });

  it('carries the schema version into every entry', () => {
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS);

    expect(entries.every((entry) => entry.props.v === WIDGET_PROPS_VERSION)).toBe(true);
  });

  it('always rounds the label up to the next minute', () => {
    const asrMs = createPrayerDatetime('2026-06-15', '17:45').getTime();
    // 11m 37s left reads "12m" — never the lower minute, never seconds
    const pushAt = new Date(asrMs - (11 * 60 + 37) * 1000);

    const entries = buildPrayerWidgetTimeline(pushAt, makeSequence(), SETTINGS);

    expect(entries[0].props.countdownLabel).toBe('12m');
  });

  it('holds "1m" through the final minute', () => {
    const asrMs = createPrayerDatetime('2026-06-15', '17:45').getTime();
    // 9m 59s left → "10m"; anything under a minute reads "1m" until the flip
    const pushAt = new Date(asrMs - (9 * 60 + 59) * 1000);

    const entries = buildPrayerWidgetTimeline(pushAt, makeSequence(), SETTINGS);

    expect(entries[0].props.countdownLabel).toBe('10m');
  });

  it('formats every label with the minute-ceil formatter at the entry date', () => {
    const asrMs = createPrayerDatetime('2026-06-15', '17:45').getTime();
    // Sub-minute remainder proves the ceil rounding matches getSecondsRemaining
    const pushAt = new Date(asrMs - (2 * 60 + 59.4) * 1000);

    const entries = buildPrayerWidgetTimeline(pushAt, makeSequence(), SETTINGS);

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
    const entries = buildPrayerWidgetTimeline(NOW, makeSequence(), SETTINGS_HIJRI);

    expect(entries[0].props.dateLabel).toBe(formatHijriDateLong('2026-06-15'));
    expect(entries.every((entry) => entry.props.dateLabel.length > 0)).toBe(true);
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
  it('backdates the first entry when a prayer boundary is under five minutes away', () => {
    // Push at 17:44 with Asr at 17:45 — the boundary flip must stay at 17:45,
    // so the first entry backs up to 17:40 to keep the spacing.
    const pushAt = createPrayerDatetime('2026-06-15', '17:44');
    const entries = buildPrayerWidgetTimeline(pushAt, makeSequence(), SETTINGS);

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
  it('builds strictly increasing entries across the autumn clock change (2026-10-25)', () => {
    // Clocks fall back 02:00 BST → 01:00 GMT on Sunday 2026-10-25
    const sequence: PrayerSequence = {
      type: ScheduleType.Standard,
      prayers: [...makeDay('2026-10-24'), ...makeDay('2026-10-25'), ...makeDay('2026-10-26')],
    };
    const pushAt = createPrayerDatetime('2026-10-24', '12:00');

    const entries = buildPrayerWidgetTimeline(pushAt, sequence, SETTINGS);

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

    const entries = buildPrayerWidgetTimeline(pushAt, sequence, SETTINGS);

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
    // segment across the gap; only the stale guard ends the timeline
    const sequence: PrayerSequence = {
      type: ScheduleType.Standard,
      prayers: [...makeDay('2026-06-15'), ...makeDay('2026-06-17')],
    };

    const entries = buildPrayerWidgetTimeline(NOW, sequence, SETTINGS);

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

  it('bounds the entry count to boundaries plus one stepped day plus the guard', () => {
    const sequence = makeSpanSequence();
    const entries = buildPrayerWidgetTimeline(NOW, sequence, SETTINGS);

    expect(entries[entries.length - 1].props.stale).toBe(true);
    expect(entries.length).toBeLessThan(500);
  });

  it('keeps the serialized payload well under UserDefaults comfort size', () => {
    const sequence = makeSpanSequence();
    const entries = buildPrayerWidgetTimeline(NOW, sequence, SETTINGS);

    // The medium widget's day list (six rows + activeIndex per entry) grew
    // the payload ~30% over the pre-v3 size; 155KB across ~380 entries is
    // still trivial for the app-group UserDefaults plist (parsed once per
    // widget reload), so the comfort budget is 200KB.
    const payloadSize = JSON.stringify(entries).length;
    expect(payloadSize).toBeLessThan(200_000);
  });
});
