/**
 * The mock feed a local build serves: each download seeds today from its own moment, so opening the
 * app finds Asr next on a tight runway that rolls a boundary roughly every minute.
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
  it.each(['2026-09-15T14:30:00.000Z', '2026-09-15T14:30:00.001Z', '2026-09-15T14:30:59.999Z'])(
    'puts Isha next, 75 to 134 seconds out, after a download at %s, with the five before it passed',
    (iso) => {
      const readAt = new Date(iso);
      jest.useFakeTimers({ now: readAt });

      const today = MOCK_DATA_SIMPLE.times[formatDateShort(readAt)];

      const isha = instantOf(readAt, today.isha);
      const magrib = instantOf(readAt, today.magrib);
      expect(isha - readAt.getTime()).toBeGreaterThanOrEqual(75 * 1000);
      expect(isha - readAt.getTime()).toBeLessThan(75 * 1000 + MINUTE);
      for (const before of [today.fajr, today.sunrise, today.dhuhr, today.asr, today.magrib]) {
        expect(instantOf(readAt, before)).toBeLessThan(readAt.getTime());
      }
      expect(magrib - instantOf(readAt, today.asr)).toBe(MINUTE);
      expect(readAt.getTime() - magrib).toBeGreaterThanOrEqual(MINUTE);
      expect(readAt.getTime() - magrib).toBeLessThanOrEqual(2 * MINUTE);
      expect(isha - magrib).toBeGreaterThan(2 * MINUTE);
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
