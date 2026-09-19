/**
 * The mock feed a local build serves: each download seeds today from its own moment, so opening the app finds Asr next
 */

import { createPrayerDatetime, formatDateShort } from '@/shared/time';

import { MOCK_DATA_SIMPLE } from '../simple';

const MINUTE = 60_000;

/** A time the mock wrote for the London day of `readAt`, as the instant the app reads it as */
const instantOf = (readAt: Date, time: string) => createPrayerDatetime(formatDateShort(readAt), time).getTime();

afterEach(() => {
  jest.useRealTimers();
});

describe('the mock feed, downloaded on Tuesday 15 September 2026 around 15:30 in London', () => {
  // On a whole minute, a millisecond past it, and a millisecond before the next: times carry no seconds
  it.each(['2026-09-15T14:30:00.000Z', '2026-09-15T14:30:00.001Z', '2026-09-15T14:30:59.999Z'])(
    'puts Asr next, 60 to 119.999 seconds after a download at %s, with the three prayers before it passed',
    (iso) => {
      const readAt = new Date(iso);
      jest.useFakeTimers({ now: readAt });

      const today = MOCK_DATA_SIMPLE.times[formatDateShort(readAt)];

      const asr = instantOf(readAt, today.asr);
      expect(asr - readAt.getTime()).toBeGreaterThanOrEqual(MINUTE);
      expect(asr - readAt.getTime()).toBeLessThan(2 * MINUTE);
      for (const before of [today.fajr, today.sunrise, today.dhuhr]) {
        expect(instantOf(readAt, before)).toBeLessThan(readAt.getTime());
      }
      for (const after of [today.magrib, today.isha]) {
        expect(instantOf(readAt, after)).toBeGreaterThan(asr);
      }
    }
  );

  it('seeds today again on each download, so returning to the app finds Asr next again', () => {
    const firstAt = new Date('2026-09-15T14:30:10Z');
    const secondAt = new Date('2026-09-15T14:35:10Z');
    jest.useFakeTimers({ now: firstAt });
    const first = MOCK_DATA_SIMPLE.times;

    jest.setSystemTime(secondAt);
    const second = MOCK_DATA_SIMPLE.times;

    const today = formatDateShort(firstAt);
    expect(instantOf(secondAt, second[today].asr) - instantOf(firstAt, first[today].asr)).toBe(5 * MINUTE);
    for (const date of Object.keys(first).filter((key) => key !== today)) {
      expect(second[date]).toEqual(first[date]);
    }
  });
});
