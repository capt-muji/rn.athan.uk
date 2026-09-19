/**
 * The mock feed a local build serves: each download seeds today from its own moment, so opening the app finds Sunrise
 * a minute out and every later prayer at a different countdown scale.
 *
 * The offsets are spread rather than a minute apart because WidgetKit refuses timeline entries closer than five
 * minutes: prayers a minute apart cannot be represented at all, so iOS widget rollover is untestable on them.
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
    'puts Sunrise next, 60 to 119.999 seconds after a download at %s, with only Fajr passed',
    (iso) => {
      const readAt = new Date(iso);
      jest.useFakeTimers({ now: readAt });

      const today = MOCK_DATA_SIMPLE.times[formatDateShort(readAt)];

      const sunrise = instantOf(readAt, today.sunrise);
      expect(sunrise - readAt.getTime()).toBeGreaterThanOrEqual(MINUTE);
      expect(sunrise - readAt.getTime()).toBeLessThan(2 * MINUTE);
      expect(instantOf(readAt, today.fajr)).toBeLessThan(readAt.getTime());
      for (const after of [today.dhuhr, today.asr, today.magrib, today.isha]) {
        expect(instantOf(readAt, after)).toBeGreaterThan(sunrise);
      }
    }
  );

  it('spaces the prayers still ahead at least five minutes apart, the floor WidgetKit will honor', () => {
    // Only prayers still to come become timeline entries; a passed one is just
    // the segment's lower bound, so Fajr may sit closer than the floor
    const readAt = new Date('2026-09-15T14:30:00.000Z');
    jest.useFakeTimers({ now: readAt });

    const today = MOCK_DATA_SIMPLE.times[formatDateShort(readAt)];
    const ahead = [today.fajr, today.sunrise, today.dhuhr, today.asr, today.magrib, today.isha]
      .map((time) => instantOf(readAt, time))
      .filter((moment) => moment > readAt.getTime());

    expect(ahead).toHaveLength(5);
    for (let index = 1; index < ahead.length; index++) {
      expect(ahead[index] - ahead[index - 1]).toBeGreaterThanOrEqual(5 * MINUTE);
    }
  });

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
