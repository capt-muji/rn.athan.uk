/**
 * The dev window a local build serves: each sync run seeds today from its own
 * moment, so opening the app finds Asr next about an hour out and Dhuhr the
 * prayer an hour spent - the day rolls to tomorrow's real schedule while you
 * watch.
 */

import { setActiveLocale } from '@/shared/i18n/locale';
import { createPrayerDatetime, formatDateShort } from '@/shared/time';
import { type DayMinutes, minutesToRecord } from '@/shared/timetableDecode';

import { mockMinutesSnapshot, TODAY_OVERRIDE } from '../minutes';

const MINUTE = 60_000;

/** HH:mm, the data clock's own format: data paths never localise digits */
const hhmm = (minute: number): string =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;

/** A time the window wrote for the London day of `readAt`, as the instant the app reads it as */
const instantOf = (readAt: Date, minute: number): number =>
  createPrayerDatetime(formatDateShort(readAt), hhmm(minute)).getTime();

const todayOf = (at: Date): Record<keyof DayMinutes, number> => {
  const minutes = mockMinutesSnapshot(at).get(formatDateShort(at));
  if (!minutes) throw new Error(`today missing from the window seeded at ${at.toISOString()}`);
  // The seeded day is whole-minute anchored: null columns are a seeding bug, not a case
  return minutes as Record<keyof DayMinutes, number>;
};

afterEach(() => {
  jest.useRealTimers();
  TODAY_OVERRIDE.minutes = null;
});

describe('the dev window, seeded on Tuesday 15 September 2026 around 15:30 in London', () => {
  // On a whole minute, a millisecond past it, and a millisecond before the next: times carry no seconds
  it.each([
    '2026-09-15T14:30:00.000Z',
    '2026-09-15T14:30:00.001Z',
    '2026-09-15T14:30:59.999Z',
    // The window's edges from the steady hour's side: mid-window at 06:00 and the latest
    // seed before the spent branch takes over (today's Isha 23:59), plus the small hours
    // the same steady hour now covers (the seed's floor is 01:02: below it the -62 minute
    // Fajr anchors against the previous midnight)
    '2026-09-15T05:00:00.000Z',
    '2026-09-15T21:57:59.999Z',
    '2026-09-16T02:30:00.000Z',
    '2026-09-16T02:30:59.999Z',
  ])('puts Asr next about one hour out and Dhuhr one hour spent, after a seed at %s', (iso) => {
    const readAt = new Date(iso);
    jest.useFakeTimers({ now: readAt });

    const today = todayOf(readAt);

    // Whole-hour anchors: Asr inside the hour the round-up countdown reads as 1h away,
    // Dhuhr inside the hour it reads as 1h ago
    expect(instantOf(readAt, today.asr) - readAt.getTime()).toBeGreaterThan(59 * MINUTE);
    expect(instantOf(readAt, today.asr) - readAt.getTime()).toBeLessThanOrEqual(60 * MINUTE);
    expect(readAt.getTime() - instantOf(readAt, today.dhuhr)).toBeGreaterThanOrEqual(60 * MINUTE);
    expect(readAt.getTime() - instantOf(readAt, today.dhuhr)).toBeLessThan(61 * MINUTE);
    expect(instantOf(readAt, today.magrib) - instantOf(readAt, today.asr)).toBe(MINUTE);
    expect(instantOf(readAt, today.isha) - instantOf(readAt, today.magrib)).toBe(MINUTE);
    for (const before of [today.fajr, today.sunrise, today.dhuhr]) {
      expect(instantOf(readAt, before)).toBeLessThan(readAt.getTime());
    }
  });

  it.each(['2026-09-15T21:58:00.000Z', '2026-09-15T22:55:00.000Z'])(
    'serves the spent day unchanged from a late-evening seed at %s London, with tomorrow\u2019s Fajr next',
    (iso) => {
      const readAt = new Date(iso);
      jest.useFakeTimers({ now: readAt });

      const today = todayOf(readAt);

      expect(today.isha).toBe(21 * 60 + 29);
      for (const time of [today.fajr, today.sunrise, today.dhuhr, today.asr, today.magrib, today.isha]) {
        expect(instantOf(readAt, time)).toBeLessThan(readAt.getTime());
      }
    }
  );

  it('seeds today again on each sync run, so returning to the app finds the same shape', () => {
    const firstAt = new Date('2026-09-15T14:30:10Z');
    const secondAt = new Date('2026-09-15T14:35:10Z');

    const first = mockMinutesSnapshot(firstAt);
    const second = mockMinutesSnapshot(secondAt);

    const today = formatDateShort(firstAt);
    expect(second.get(today)?.fajr).not.toBe(first.get(today)?.fajr);
    for (const date of [...first.keys()].filter((key) => key !== today)) {
      expect(second.get(date)).toEqual(first.get(date));
    }
  });

  it('spans yesterday through ten days ahead, and nothing outside it', () => {
    const at = new Date('2026-09-15T14:30:00.000Z');
    const window = mockMinutesSnapshot(at);

    expect(window.size).toBe(12);
    expect(window.has('2026-09-14')).toBe(true);
    expect(window.has('2026-09-13')).toBe(false);
    expect(window.has('2026-09-25')).toBe(true);
    expect(window.has('2026-09-26')).toBe(false);
  });

  it('decodes through the same producer the baked artifact decodes through', () => {
    const at = new Date('2026-09-15T14:30:00.000Z');
    const today = todayOf(at);

    const record = minutesToRecord(formatDateShort(at), today);
    expect(record.date).toBe(formatDateShort(at));
    expect(record.fajr).toBe(hhmm(today.fajr!));
    expect(record.suhoor).toBe(hhmm((((today.fajr! - 20) % 1440) + 1440) % 1440));
  });

  it('serves Latin HH:mm under an ar locale, the format the reader reads', () => {
    // The window's data is minutes, not display: a composed Arabic-Indic time
    // would null the day's schedule
    setActiveLocale('ar');
    try {
      const at = new Date('2026-09-15T14:30:00.000Z');
      const record = minutesToRecord(formatDateShort(at), todayOf(at));
      expect(record.fajr).toMatch(/^\d{2}:\d{2}$/);
      expect(record.istijaba).toMatch(/^\d{2}:\d{2}$/);
    } finally {
      setActiveLocale('en');
    }
  });

  it('serves the pinned override in place of the launch-relative seed', () => {
    TODAY_OVERRIDE.minutes = {
      fajr: 5 * 60 + 30,
      sunrise: 7 * 60,
      dhuhr: 12 * 60 + 4,
      asr: 15 * 60 + 30,
      magrib: 18 * 60,
      isha: 19 * 60 + 30,
    };

    const at = new Date('2026-09-15T14:30:00.000Z');

    expect(todayOf(at)).toEqual(TODAY_OVERRIDE.minutes);
    // The days around today keep their real rows
    expect(mockMinutesSnapshot(at).get('2026-09-16')).toBeDefined();
  });
});
