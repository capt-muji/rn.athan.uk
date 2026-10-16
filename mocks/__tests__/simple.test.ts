/**
 * The mock feed a local build serves: each download seeds today from its own moment, so opening the
 * app finds Asr just passed, Maghrib next about a minute out and Isha a minute behind it - the day
 * rolls to tomorrow's real schedule while you watch.
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
    // The window's two edges: its first minute and its tightest seed
    '2026-09-15T05:00:00.000Z',
    '2026-09-15T22:52:59.999Z',
  ])(
    'puts Maghrib next about one minute out and Isha two, after a download at %s, with Asr the prayer just passed',
    (iso) => {
      const readAt = new Date(iso);
      jest.useFakeTimers({ now: readAt });

      const today = MOCK_DATA_SIMPLE.times[formatDateShort(readAt)];

      const isha = instantOf(readAt, today.isha);
      const magrib = instantOf(readAt, today.magrib);
      const asr = instantOf(readAt, today.asr);
      // Boundary gaps: Maghrib inside the minute the countdown rounds up to 1m, Isha inside 2m
      expect(magrib - readAt.getTime()).toBeGreaterThan(0);
      expect(magrib - readAt.getTime()).toBeLessThanOrEqual(MINUTE);
      expect(isha - readAt.getTime()).toBeGreaterThan(MINUTE);
      expect(isha - readAt.getTime()).toBeLessThanOrEqual(2 * MINUTE);
      expect(isha - magrib).toBe(MINUTE);
      for (const before of [today.fajr, today.sunrise, today.dhuhr, today.asr]) {
        expect(instantOf(readAt, before)).toBeLessThan(readAt.getTime());
      }
      expect(readAt.getTime() - asr).toBeLessThanOrEqual(2 * MINUTE);
    }
  );

  it.each(['2026-09-16T03:30:00.000Z', '2026-09-16T03:30:59.999Z', '2026-09-15T04:59:59.999Z'])(
    'seeds a realistic pre-dawn day at %s London 04:30, Fajr next about one minute out, no small-hours Standard rows',
    (iso) => {
      const readAt = new Date(iso);
      jest.useFakeTimers({ now: readAt });

      const today = MOCK_DATA_SIMPLE.times[formatDateShort(readAt)];

      const fajr = instantOf(readAt, today.fajr);
      expect(fajr - readAt.getTime()).toBeGreaterThan(0);
      expect(fajr - readAt.getTime()).toBeLessThanOrEqual(MINUTE);
      // The rest of the day is the real static shape, so nothing trips the midnight-crossing rules
      expect(today.dhuhr).toBe('13:04');
      expect(today.isha).toBe('21:27');
      expect(instantOf(readAt, today.sunrise)).toBeGreaterThan(fajr);
    }
  );

  it.each(['2026-09-15T22:53:00.000Z', '2026-09-15T22:55:00.000Z'])(
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
