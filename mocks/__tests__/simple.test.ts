/**
 * The mock feed a local build serves: each download from 01:02 London onward seeds today
 * from its own moment, so opening the app finds Asr next about an hour out and Dhuhr the
 * prayer an hour spent - the day rolls to tomorrow's real schedule while you watch.
 */

import { setActiveLocale } from '@/shared/i18n/locale';
import { createPrayerDatetime, formatDateShort } from '@/shared/time';

import { addMinutes, MOCK_DATA_SIMPLE } from '../simple';

const MINUTE = 60_000;

/** A time the mock wrote for the London day of `readAt`, as the instant the app reads it as */
const instantOf = (readAt: Date, time: string) => createPrayerDatetime(formatDateShort(readAt), time).getTime();

afterEach(() => {
  jest.useRealTimers();
});

describe('the mock feed, downloaded on Tuesday 15 September 2026 around 15:30 in London', () => {
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
  ])('puts Asr next about one hour out and Dhuhr one hour spent, after a download at %s', (iso) => {
    const readAt = new Date(iso);
    jest.useFakeTimers({ now: readAt });

    const today = MOCK_DATA_SIMPLE.times[formatDateShort(readAt)];

    const isha = instantOf(readAt, today.isha);
    const magrib = instantOf(readAt, today.magrib);
    const asr = instantOf(readAt, today.asr);
    const dhuhr = instantOf(readAt, today.dhuhr);
    // Whole-hour anchors: Asr inside the hour the round-up countdown reads as 1h away,
    // Dhuhr inside the hour it reads as 1h ago
    expect(asr - readAt.getTime()).toBeGreaterThan(59 * MINUTE);
    expect(asr - readAt.getTime()).toBeLessThanOrEqual(60 * MINUTE);
    expect(readAt.getTime() - dhuhr).toBeGreaterThanOrEqual(60 * MINUTE);
    expect(readAt.getTime() - dhuhr).toBeLessThan(61 * MINUTE);
    expect(magrib - asr).toBe(MINUTE);
    expect(isha - magrib).toBe(MINUTE);
    for (const before of [today.fajr, today.sunrise, today.dhuhr]) {
      expect(instantOf(readAt, before)).toBeLessThan(readAt.getTime());
    }
  });

  it.each(['2026-09-15T21:58:00.000Z', '2026-09-15T22:55:00.000Z'])(
    'serves the spent day unchanged from a late-evening download at %s London, with tomorrow\u2019s Fajr next',
    (iso) => {
      const readAt = new Date(iso);
      jest.useFakeTimers({ now: readAt });

      const today = MOCK_DATA_SIMPLE.times[formatDateShort(readAt)];

      expect(today.isha).toBe('21:29');
      for (const time of [today.fajr, today.sunrise, today.dhuhr, today.asr, today.magrib, today.isha]) {
        expect(instantOf(readAt, time)).toBeLessThan(readAt.getTime());
      }
    }
  );

  it('speaks Latin HH:mm under an ar locale, the format the validator reads', () => {
    // The API payload is data, not display: the validator's TIME_PATTERN
    // rejects localised digits, so a composed Arabic-Indic time would null
    // the day's schedule
    setActiveLocale('ar');
    try {
      const from = createPrayerDatetime('2026-09-15', '15:30');
      expect(addMinutes(from, 65)).toBe('16:35');
      expect(addMinutes(from, 0)).toBe('15:30');
    } finally {
      setActiveLocale('en');
    }
  });

  it('seeds today again on each download, so returning to the app finds the same shape', () => {
    const firstAt = new Date('2026-09-15T14:30:10Z');
    const secondAt = new Date('2026-09-15T14:35:10Z');
    jest.useFakeTimers({ now: firstAt });
    const first = MOCK_DATA_SIMPLE.times;

    jest.setSystemTime(secondAt);
    const second = MOCK_DATA_SIMPLE.times;

    const today = formatDateShort(firstAt);
    expect(second[today].fajr).not.toBe(first[today].fajr);
    for (const date of Object.keys(first).filter((key) => key !== today)) {
      expect(second[date]).toEqual(first[date]);
    }
  });
});
