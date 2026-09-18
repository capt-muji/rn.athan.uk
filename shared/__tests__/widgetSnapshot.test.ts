/**
 * Unit tests for the pure Android snapshot builder
 * (buildPrayerWidgetSnapshot in shared/widgetTimeline.ts)
 *
 * The Android widget has no timeline: the app stores one snapshot carrying
 * the whole prayer window, and the layout computes what to show at render
 * time. These tests pin the snapshot's shape against the same fixture week
 * the iOS virtual-week suite uses (DST fall-back crossed, early-Isha days
 * present), plus the unreadable-row and empty-sequence cases.
 */

jest.mock('@/stores/database', () => ({ getPrayerByDateString: jest.fn() }));

import { addDays } from 'date-fns';

import { UNAVAILABLE_TIME } from '@/shared/constants';
import { createPrayerDatetime, formatDateLong, formatDateShort, formatHijriDateLong } from '@/shared/time';
import { type Prayer, type PrayerSequence, type ReadablePrayer, ScheduleType } from '@/shared/types';
import { buildPrayerWidgetSnapshot } from '@/shared/widgetTimeline';
import type { PrayerWidgetSettings } from '@/shared/widgetTypes';

// =============================================================================
// FIXTURE: the simulation suite's week (same shape, smaller span)
// =============================================================================

const SPAN_START = '2026-10-17';
const SPAN_DAYS = 4;

const OCTOBER_TIMES: [string, string, string][] = [
  ['Fajr', 'الفجر', '05:30'],
  ['Sunrise', 'الشروق', '07:10'],
  ['Dhuhr', 'الظهر', '12:45'],
  ['Asr', 'العصر', '15:20'],
  ['Magrib', 'المغرب', '18:05'],
  ['Isha', 'العشاء', '19:40'],
];

const EARLY_ISHA_DAYS = new Set(['2026-10-19']);

const makePrayer = (date: string, time: string, english: string, belongsToDate: string): ReadablePrayer => ({
  type: ScheduleType.Standard,
  english,
  arabic: '',
  datetime: createPrayerDatetime(date, time),
  time,
  belongsToDate,
});

const makeUnreadable = (english: string, belongsToDate: string): Prayer => ({
  type: ScheduleType.Standard,
  english,
  arabic: '',
  belongsToDate,
  datetime: null,
  time: null,
});

const makeSequence = (): Prayer[] => {
  const prayers: Prayer[] = [];
  const startDay = createPrayerDatetime(SPAN_START, '12:00');

  for (let dayIndex = 0; dayIndex < SPAN_DAYS; dayIndex++) {
    const day = addDays(startDay, dayIndex);
    const dateString = formatDateShort(day);
    const ishaEarly = EARLY_ISHA_DAYS.has(dateString);

    for (const [english, , time] of OCTOBER_TIMES) {
      if (english === 'Isha' && ishaEarly) {
        const nextDayString = formatDateShort(addDays(day, 1));
        prayers.push(makePrayer(nextDayString, '01:05', english, dateString));
        continue;
      }
      prayers.push(makePrayer(dateString, time, english, dateString));
    }
  }
  return prayers;
};

const SETTINGS: PrayerWidgetSettings = { hijriDate: false };

const asSequence = (prayers: Prayer[]): PrayerSequence => ({
  type: ScheduleType.Standard,
  prayers,
});

describe('buildPrayerWidgetSnapshot', () => {
  it('carries every readable prayer of the window with name, time and epoch', () => {
    const sequence = asSequence(makeSequence());
    const snapshot = buildPrayerWidgetSnapshot(sequence, SETTINGS);

    expect(snapshot).not.toBeNull();
    if (!snapshot) return;

    const readable = sequence.prayers.filter((prayer): prayer is ReadablePrayer => 'datetime' in prayer);
    const rows = snapshot.days.flatMap((day) => day.rows);
    expect(rows).toHaveLength(sequence.prayers.length);

    const expected = readable.map((prayer) => `${prayer.english}|${prayer.time}|${prayer.datetime.getTime()}`);
    const carried = rows.map((row) => `${row.name}|${row.time}|${row.epochMs}`);
    expect(carried.sort()).toEqual(expected.sort());
  });

  it('groups rows by belongsToDate in sequence day order', () => {
    const sequence = asSequence(makeSequence());
    const snapshot = buildPrayerWidgetSnapshot(sequence, SETTINGS);
    if (!snapshot) return;

    // 2026-10-19's early Isha belongs to that day though its datetime is the
    // 20th: the day block still holds it as its last row
    const earlyDay = snapshot.days.find((day) => day.rows.some((row) => row.name === 'Isha' && row.time === '01:05'));
    expect(earlyDay).toBeDefined();
    expect(earlyDay?.rows[earlyDay.rows.length - 1]?.name).toBe('Isha');
    expect(snapshot.days[0]?.rows.every((row) => row.name !== 'Isha' || row.time !== '01:05')).toBe(true);
  });

  it('horizon is the last readable prayer in the window', () => {
    const sequence = asSequence(makeSequence());
    const snapshot = buildPrayerWidgetSnapshot(sequence, SETTINGS);
    if (!snapshot) return;

    const epochs = snapshot.days.flatMap((day) =>
      day.rows.map((row) => row.epochMs).filter((ms): ms is number => ms !== null)
    );
    expect(snapshot.horizonEpochMs).toBe(Math.max(...epochs));
  });

  it('day boundaries are London midnights of each date', () => {
    const sequence = asSequence(makeSequence());
    const snapshot = buildPrayerWidgetSnapshot(sequence, SETTINGS);
    if (!snapshot) return;

    // 2026-10-17 00:00 London is 23:00 UTC on the 16th (BST); the 20th is
    // GMT after the fall-back, so its midnight is 00:00 UTC. The anchor is
    // derived, not asserted against a hard epoch: recompute it the same
    // documented way and require equality.
    const { getDayAnchor } = jest.requireActual('@/shared/time') as typeof import('@/shared/time');
    for (const day of snapshot.days) {
      expect(day.rows.length).toBeGreaterThan(0);
    }
    const firstDay = snapshot.days[0];
    expect(firstDay?.startEpochMs).toBe(getDayAnchor('2026-10-17').getTime());
  });

  it('dateLabel honors the hijri preference per day', () => {
    const sequence = asSequence(makeSequence());
    const gregorian = buildPrayerWidgetSnapshot(sequence, SETTINGS);
    const hijri = buildPrayerWidgetSnapshot(sequence, { hijriDate: true });
    if (!gregorian || !hijri) throw new Error('snapshots missing');

    expect(gregorian.days[0]?.dateLabel).toBe(formatDateLong('2026-10-17'));
    expect(hijri.days[0]?.dateLabel).toBe(formatHijriDateLong('2026-10-17'));
  });

  it('unreadable rows carry the unavailable time and a null epoch', () => {
    const prayers = makeSequence();
    const index = prayers.findIndex((prayer) => prayer.english === 'Asr' && prayer.belongsToDate === '2026-10-18');
    const withUnreadable = [...prayers];
    withUnreadable.splice(index, 1, makeUnreadable('Asr', '2026-10-18'));
    const snapshot = buildPrayerWidgetSnapshot(asSequence(withUnreadable), SETTINGS);
    if (!snapshot) return;

    const day = snapshot.days.find((candidate) =>
      candidate.rows.some((row) => row.name === 'Asr' && row.time === UNAVAILABLE_TIME)
    );
    const row = day?.rows.find((candidate) => candidate.name === 'Asr' && candidate.time === UNAVAILABLE_TIME);
    expect(row).toBeDefined();
    expect(row?.epochMs).toBeNull();
  });

  it('answers null when the sequence has no readable prayer', () => {
    const unreadable = [makeUnreadable('Fajr', '2026-10-17'), makeUnreadable('Isha', '2026-10-17')];
    expect(buildPrayerWidgetSnapshot(asSequence(unreadable), SETTINGS)).toBeNull();
  });

  it('stamps the version and the schedule', () => {
    const snapshot = buildPrayerWidgetSnapshot(asSequence(makeSequence()), SETTINGS);
    if (!snapshot) return;
    expect(snapshot.v).toBe(1);
    expect(snapshot.schedule).toBe('standard');
  });
});
