/**
 * The mock feed a local build serves: each download seeds today from its own moment, so opening the
 * app finds Asr next on a tight runway that rolls a boundary roughly every minute.
 */

import { createPrayerDatetime, formatDateShort } from '@/shared/time';

import { MOCK_DATA_SIMPLE } from '../simple';

const MINUTE = 60_000;

/** A time the mock wrote for the London day of `readAt`, as the instant the app reads it as */
const instantOf = (readAt: Date, time: string) => createPrayerDatetime(formatDateShort(readAt), time).getTime();

/** The first whole minute at least 1 minute after the download — the mock's anchor */
const anchorAt = (readAt: Date) => new Date(Math.ceil((readAt.getTime() + MINUTE) / MINUTE) * MINUTE);

afterEach(() => {
  jest.useRealTimers();
});

describe('the mock feed, downloaded on Tuesday 15 September 2026 around 15:30 in London', () => {
  // On a whole minute, a millisecond past it, and a millisecond before the next: times carry no seconds
  it.each(['2026-09-15T14:30:00.000Z', '2026-09-15T14:30:00.001Z', '2026-09-15T14:30:59.999Z'])(
    'puts Asr next, 1 to 3 minutes out, after a download at %s, with Fajr, Sunrise and Dhuhr passed',
    (iso) => {
      const readAt = new Date(iso);
      jest.useFakeTimers({ now: readAt });

      const today = MOCK_DATA_SIMPLE.times[formatDateShort(readAt)];
      const anchor = anchorAt(readAt);

      const asr = instantOf(readAt, today.asr);
      expect(asr - anchor.getTime()).toBe(MINUTE);
      expect(asr - readAt.getTime()).toBeGreaterThan(MINUTE);
      expect(asr - readAt.getTime()).toBeLessThanOrEqual(3 * MINUTE);
      for (const before of [today.fajr, today.sunrise, today.dhuhr]) {
        expect(instantOf(readAt, before)).toBeLessThan(readAt.getTime());
      }
      expect(instantOf(readAt, today.magrib) - asr).toBe(MINUTE);
      expect(instantOf(readAt, today.isha) - instantOf(readAt, today.magrib)).toBe(MINUTE);
    }
  );

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
