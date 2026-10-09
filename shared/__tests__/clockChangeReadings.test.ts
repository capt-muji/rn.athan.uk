/**
 * Clock readings that London's 2026 clock changes skip or repeat
 *
 * Every reading must resolve to one moment on any phone. On 29 March the clocks jump from 01:00 to 02:00, so
 * a reading in that hour never shows: it takes the offset the clocks jump to, which makes 01:59 the same
 * moment as 00:59. On 25 October the clocks show 01:00 to 01:59 twice, and a reading takes the second pass,
 * after they go back.
 *
 * Expected moments are literals worked out independently (Python's zoneinfo, fold=1) or plain UTC
 * arithmetic, never the app's own time helpers.
 */

import { createPrayerDatetime } from '@/shared/time';

const MINUTE = 60_000;

const pad2 = (value: number) => String(value).padStart(2, '0');

/** Every reading from 00:00 to 02:59, by its minute of the day */
const EARLY_READINGS = Array.from(
  { length: 180 },
  (_, minute) => `${pad2(Math.floor(minute / 60))}:${pad2(minute % 60)}`
);

const resolved = (date: string, readings: string[]) =>
  readings.map((reading) => [reading, createPrayerDatetime(date, reading).toISOString()]);

describe('clock readings on the days London changes its clocks', () => {
  it('resolves every skipped reading on 29 March with the post-change offset', () => {
    expect(resolved('2026-03-29', ['00:00', '00:59', '01:00', '01:30', '01:59', '02:00', '02:01'])).toEqual([
      ['00:00', '2026-03-29T00:00:00.000Z'],
      ['00:59', '2026-03-29T00:59:00.000Z'],
      ['01:00', '2026-03-29T00:00:00.000Z'],
      ['01:30', '2026-03-29T00:30:00.000Z'],
      ['01:59', '2026-03-29T00:59:00.000Z'],
      ['02:00', '2026-03-29T01:00:00.000Z'],
      ['02:01', '2026-03-29T01:01:00.000Z'],
    ]);

    // GMT before 01:00, and BST for every reading from 01:00 on, the skipped ones included
    const startOfDay = Date.parse('2026-03-29T00:00:00.000Z');
    const wrong = EARLY_READINGS.filter((reading, minute) => {
      const expected = startOfDay + (minute < 60 ? minute : minute - 60) * MINUTE;
      return createPrayerDatetime('2026-03-29', reading).getTime() !== expected;
    });
    expect(wrong).toEqual([]);
  });

  it('resolves every repeated reading on 25 October to the later occurrence', () => {
    expect(resolved('2026-10-25', ['00:00', '00:59', '01:00', '01:30', '01:59', '02:00', '02:01'])).toEqual([
      ['00:00', '2026-10-24T23:00:00.000Z'],
      ['00:59', '2026-10-24T23:59:00.000Z'],
      ['01:00', '2026-10-25T01:00:00.000Z'],
      ['01:30', '2026-10-25T01:30:00.000Z'],
      ['01:59', '2026-10-25T01:59:00.000Z'],
      ['02:00', '2026-10-25T02:00:00.000Z'],
      ['02:01', '2026-10-25T02:01:00.000Z'],
    ]);

    // BST before 01:00, and GMT for every reading from 01:00 on, the repeated ones included
    const startOfDay = Date.parse('2026-10-25T00:00:00.000Z');
    const wrong = EARLY_READINGS.filter((reading, minute) => {
      const expected = startOfDay + (minute < 60 ? minute - 60 : minute) * MINUTE;
      return createPrayerDatetime('2026-10-25', reading).getTime() !== expected;
    });
    expect(wrong).toEqual([]);
  });
});
