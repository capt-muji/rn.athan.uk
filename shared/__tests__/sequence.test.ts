/**
 * shared/sequence.ts against ai/features/uat-2/DASHES-DESIGN.md §4
 *
 * Written by someone who did not write the rules, from the design and the brief
 * (ai/prompts/unavailable-times-dashes.md R8 to R12, R14; keep-still-due-rows-after-midnight.md) rather
 * than from the module's branches, because a fix's own tests sit where its bug cannot be seen.
 *
 * Every hold end is a literal worked out by hand from London's 2026 clock changes (BST from 29 March
 * 01:00 UTC to 25 October 01:00 UTC) and checked once more against Intl, so no answer leans on the app's
 * date helpers. Fixture rows are built with createPrayerDatetime, and a handful are pinned to literal
 * instants below so a fault there cannot hide behind agreeing expectations.
 *
 * Every rule the design says works from moments or list days is run over the same rows in four orders:
 * nothing in §4 is allowed to read array position.
 */

import {
  compareListOrder,
  findNextOccurrence,
  findNextReadable,
  findPreviousReadable,
  getDisplayHoldEnd,
  getNextBoundary,
  isReadable,
  isRowPassed,
  resolveDisplayDate,
} from '@/shared/sequence';
import { createPrayerDatetime } from '@/shared/time';
import { type Prayer, type ReadablePrayer, ScheduleType } from '@/shared/types';

// =============================================================================
// FIXTURES
// =============================================================================

// Typed out rather than imported, so a reordered constant cannot quietly agree with itself
const STANDARD_NAMES = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Magrib', 'Isha'];
const EXTRAS_NAMES = ['Midnight', 'Last Third', 'Suhoor', 'Duha', 'Istijaba'];

/** A London clock reading on the list day, or on another calendar date for a row either side of 00:00 */
type Reading = string | { clock: string; on: string } | null;

const STANDARD_TIMES: Record<string, Reading[]> = {
  '2026-03-27': ['04:47', '06:00', '12:14', '15:44', '18:31', '19:50'],
  '2026-03-28': ['04:45', '05:58', '12:14', '15:45', '18:33', '19:52'],
  '2026-03-29': ['05:42', '06:55', '13:13', '16:46', '19:35', '20:54'],
  '2026-03-30': ['05:40', '06:53', '13:13', '16:47', '19:37', '20:56'],
  '2026-09-13': ['05:00', '06:36', '12:59', '16:25', '19:17', '20:33'],
  '2026-09-14': ['05:02', '06:38', '12:59', '16:23', '19:15', '20:31'],
  '2026-09-15': ['05:04', '06:39', '12:58', '16:21', '19:12', '20:28'],
  '2026-09-16': ['05:06', '06:41', '12:58', '16:19', '19:10', '20:26'],
  '2026-09-17': ['05:08', '06:43', '12:58', '16:17', '19:08', '20:23'],
  '2026-09-18': ['05:10', '06:44', '12:57', '16:15', '19:05', '20:21'],
  // Session 7's high-latitude mock, where Friday's Magrib and Isha fall on Saturday morning
  '2026-09-24': ['03:00', '05:00', '13:00', '17:00', '22:30', '23:40'],
  '2026-09-25': [
    '02:30',
    '04:30',
    '13:00',
    '17:30',
    { clock: '00:40', on: '2026-09-26' },
    { clock: '01:30', on: '2026-09-26' },
  ],
  '2026-09-26': ['02:00', '04:00', '13:00', '17:30', '22:00', '23:30'],
  '2026-10-23': ['05:47', '07:33', '12:44', '15:20', '17:54', '19:18'],
  '2026-10-24': ['05:49', '07:35', '12:44', '15:18', '17:52', '19:16'],
  '2026-10-25': ['04:50', '06:36', '11:44', '14:16', '16:50', '18:15'],
  '2026-10-26': ['04:52', '06:38', '11:44', '14:15', '16:48', '18:13'],
  '2026-12-31': ['06:25', '08:06', '12:08', '13:47', '16:03', '17:45'],
  '2027-01-01': ['06:25', '08:06', '12:08', '13:48', '16:04', '17:46'],
};

const EXTRAS_TIMES: Record<string, Reading[]> = {
  '2026-09-17': ['00:09', '01:48', '04:48', '07:03'],
  // Friday
  '2026-09-18': ['00:09', '01:49', '04:50', '07:04', '18:05'],
  '2026-09-19': ['00:08', '01:49', '04:52', '07:06'],
  // December nights are long enough that a list's Midnight falls before 00:00 on the day before it
  '2026-12-10': [{ clock: '23:02', on: '2026-12-09' }, '01:26', '05:53', '08:15'],
  '2026-12-12': [{ clock: '23:03', on: '2026-12-11' }, '01:27', '05:55', '08:17'],
};

const row = (type: ScheduleType, english: string, listDay: string, reading: Reading): Prayer => {
  if (reading === null) {
    return { type, english, arabic: english, belongsToDate: listDay, datetime: null, time: null };
  }
  const { clock, on } = typeof reading === 'string' ? { clock: reading, on: listDay } : reading;
  return {
    type,
    english,
    arabic: english,
    belongsToDate: listDay,
    datetime: createPrayerDatetime(on, clock),
    time: clock,
  };
};

const listBuilder =
  (type: ScheduleType, names: string[], times: Record<string, Reading[]>) =>
  (day: string, unreadable: string[] = []): Prayer[] => {
    const readings = times[day];
    if (!readings) throw new Error(`No fixture readings for ${day}`);
    return readings.map((reading, i) => row(type, names[i], day, unreadable.includes(names[i]) ? null : reading));
  };

const standard = listBuilder(ScheduleType.Standard, STANDARD_NAMES, STANDARD_TIMES);
const extras = listBuilder(ScheduleType.Extra, EXTRAS_NAMES, EXTRAS_TIMES);

const blankStandard = (day: string): Prayer[] =>
  STANDARD_NAMES.map((name) => row(ScheduleType.Standard, name, day, null));
const blankExtras = (day: string, friday = false): Prayer[] =>
  EXTRAS_NAMES.slice(0, friday ? 5 : 4).map((name) => row(ScheduleType.Extra, name, day, null));

const find = (prayers: Prayer[], key: string): Prayer => {
  const cut = key.lastIndexOf(' ');
  const found = prayers.find((p) => p.english === key.slice(0, cut) && p.belongsToDate === key.slice(cut + 1));
  if (!found) throw new Error(`Fixture has no ${key}`);
  return found;
};

const findReadable = (prayers: Prayer[], key: string): ReadablePrayer => {
  const found = find(prayers, key);
  if (found.datetime === null) throw new Error(`Fixture ${key} is unreadable`);
  return found;
};

const keyOf = (prayer: Prayer | null): string | null => (prayer ? `${prayer.english} ${prayer.belongsToDate}` : null);

const at = (iso: string, offsetMs = 0): Date => new Date(Date.parse(iso) + offsetMs);

const instantOf = (prayers: Prayer[], key: string, offsetMs = 0): Date =>
  new Date(findReadable(prayers, key).datetime.getTime() + offsetMs);

/** Where a readable fixture row sits in time, looked up from the full readings even when a list dashes it */
const standardAt = (key: string, offsetMs = 0): Date => {
  const day = key.slice(key.lastIndexOf(' ') + 1);
  return instantOf(standard(day), key, offsetMs);
};
const extrasAt = (key: string, offsetMs = 0): Date => {
  const day = key.slice(key.lastIndexOf(' ') + 1);
  return instantOf(extras(day), key, offsetMs);
};

const allPassed = (rows: Prayer[]): Record<string, boolean> =>
  Object.fromEntries(rows.map((p) => [keyOf(p) as string, true]));

// Deterministic, so a failure names the order that produced it
const shuffle = (items: Prayer[], seed: number): Prayer[] => {
  const out = [...items];
  let state = seed;
  for (let i = out.length - 1; i > 0; i--) {
    state = (state * 1103515245 + 12345) % 2147483648;
    const j = Math.floor((state / 2147483648) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const ORDERS: [string, (prayers: Prayer[]) => Prayer[]][] = [
  ['list order', (prayers) => prayers],
  ['reversed', (prayers) => [...prayers].reverse()],
  ['shuffled, seed 7', (prayers) => shuffle(prayers, 7)],
  ['shuffled, seed 2026', (prayers) => shuffle(prayers, 2026)],
];

const isoOrNull = (date: Date | null): string | null => date?.toISOString() ?? null;

// =============================================================================
// FIXTURE ANCHORS
// =============================================================================

describe('fixtures', () => {
  it.each([
    ['Isha 2026-09-14', standard('2026-09-14'), '2026-09-14T19:31:00.000Z'],
    ['Fajr 2026-09-15', standard('2026-09-15'), '2026-09-15T04:04:00.000Z'],
    ['Magrib 2026-09-25', standard('2026-09-25'), '2026-09-25T23:40:00.000Z'],
    ['Isha 2026-10-23', standard('2026-10-23'), '2026-10-23T18:18:00.000Z'],
    ['Isha 2026-10-24', standard('2026-10-24'), '2026-10-24T18:16:00.000Z'],
    ['Fajr 2026-10-25', standard('2026-10-25'), '2026-10-25T04:50:00.000Z'],
    ['Fajr 2026-10-26', standard('2026-10-26'), '2026-10-26T04:52:00.000Z'],
    ['Isha 2026-03-27', standard('2026-03-27'), '2026-03-27T19:50:00.000Z'],
    ['Isha 2026-03-28', standard('2026-03-28'), '2026-03-28T19:52:00.000Z'],
    ['Fajr 2026-03-29', standard('2026-03-29'), '2026-03-29T04:42:00.000Z'],
    ['Fajr 2026-03-30', standard('2026-03-30'), '2026-03-30T04:40:00.000Z'],
    ['Midnight 2026-12-12', extras('2026-12-12'), '2026-12-11T23:03:00.000Z'],
    ['Istijaba 2026-09-18', extras('2026-09-18'), '2026-09-18T17:05:00.000Z'],
  ])('%s is the instant the expectations were worked out from', (key, prayers, iso) => {
    expect(findReadable(prayers, key).datetime.toISOString()).toBe(iso);
  });

  it('the shuffled orders really move rows, or the order-independence runs would prove nothing', () => {
    const sequence = [...standard('2026-09-14'), ...standard('2026-09-15'), ...standard('2026-09-16')];
    for (const [, arrange] of ORDERS.slice(1)) {
      expect(arrange(sequence).map(keyOf)).not.toEqual(sequence.map(keyOf));
      expect([...arrange(sequence)].map(keyOf).sort()).toEqual(sequence.map(keyOf).sort());
    }
  });
});

// =============================================================================
// isReadable
// =============================================================================

describe('isReadable', () => {
  it.each([
    ['a row with a moment', row(ScheduleType.Standard, 'Asr', '2026-09-15', '16:21'), true],
    ['a row without one', row(ScheduleType.Standard, 'Asr', '2026-09-15', null), false],
    ['an Extras row with a moment', row(ScheduleType.Extra, 'Midnight', '2026-09-18', '00:09'), true],
    ['an Extras row without one', row(ScheduleType.Extra, 'Midnight', '2026-09-18', null), false],
  ])('%s', (_label, prayer, expected) => {
    expect(isReadable(prayer)).toBe(expected);
  });

  it('a row at the epoch still has a moment', () => {
    const epoch: Prayer = {
      ...row(ScheduleType.Standard, 'Fajr', '1970-01-01', null),
      datetime: new Date(0),
      time: '01:00',
    };
    expect(isReadable(epoch)).toBe(true);
  });

  it('narrows to a row whose moment can be read', () => {
    const prayer = row(ScheduleType.Standard, 'Dhuhr', '2026-09-15', '12:58');
    if (!isReadable(prayer)) throw new Error('expected a readable row');
    expect(prayer.datetime.toISOString()).toBe('2026-09-15T11:58:00.000Z');
  });
});

// =============================================================================
// compareListOrder
// =============================================================================

describe('compareListOrder', () => {
  const S = (english: string, day: string, reading: Reading = '12:00') =>
    row(ScheduleType.Standard, english, day, reading);
  const E = (english: string, day: string, reading: Reading = '12:00') =>
    row(ScheduleType.Extra, english, day, reading);

  it.each([
    ['an earlier list day first, whatever the position', S('Isha', '2026-09-15'), S('Fajr', '2026-09-16'), -1],
    ['a later list day last, whatever the position', S('Fajr', '2026-09-16'), S('Isha', '2026-09-15'), 1],
    ['Fajr before Sunrise on one list', S('Fajr', '2026-09-15'), S('Sunrise', '2026-09-15'), -1],
    ['Isha after Fajr on one list', S('Isha', '2026-09-15'), S('Fajr', '2026-09-15'), 1],
    ['Asr before Magrib on one list', S('Asr', '2026-09-15'), S('Magrib', '2026-09-15'), -1],
    ['a row against itself', S('Dhuhr', '2026-09-15'), S('Dhuhr', '2026-09-15'), 0],
    ['an unreadable Fajr keeps first place', S('Fajr', '2026-09-15', null), S('Sunrise', '2026-09-15'), -1],
    ['an unreadable Isha keeps last place', S('Isha', '2026-09-15', null), S('Magrib', '2026-09-15'), 1],
    ['an unreadable row on an earlier list day', S('Isha', '2026-09-15', null), S('Fajr', '2026-09-16'), -1],
    [
      'list day over moment, when a list runs past the next list starting',
      S('Isha', '2026-09-26', { clock: '00:30', on: '2026-09-27' }),
      S('Fajr', '2026-09-27', '00:10'),
      -1,
    ],
    ['across a month', S('Isha', '2026-09-30'), S('Fajr', '2026-10-01'), -1],
    ['across a year', S('Isha', '2026-12-31'), S('Fajr', '2027-01-01'), -1],
    ['Istijaba before the next list opens with Midnight', E('Istijaba', '2026-09-18'), E('Midnight', '2026-09-19'), -1],
    ['Midnight before Last Third', E('Midnight', '2026-09-18'), E('Last Third', '2026-09-18'), -1],
    ['Suhoor before Duha', E('Suhoor', '2026-09-18'), E('Duha', '2026-09-18'), -1],
    ['Istijaba after Duha', E('Istijaba', '2026-09-18'), E('Duha', '2026-09-18'), 1],
    ['an unknown name after Isha', S('Tahajjud', '2026-09-15'), S('Isha', '2026-09-15'), 1],
    ['Isha before an unknown name', S('Isha', '2026-09-15'), S('Tahajjud', '2026-09-15'), -1],
    ['an unknown name after Fajr', S('Tahajjud', '2026-09-15'), S('Fajr', '2026-09-15'), 1],
    ['an unknown Extras name after Istijaba', E('Tahajjud', '2026-09-18'), E('Istijaba', '2026-09-18'), 1],
    ['an unknown name on an earlier list day still first', S('Tahajjud', '2026-09-15'), S('Fajr', '2026-09-16'), -1],
    ['two unknown names on one list day tie', S('Tahajjud', '2026-09-15'), S('Witr', '2026-09-15'), 0],
  ])('%s', (_label, a, b, sign) => {
    expect(Math.sign(compareListOrder(a, b))).toBe(sign);
  });

  const standardSequence = [
    ...standard('2026-09-14', ['Asr']),
    ...blankStandard('2026-09-15'),
    ...standard('2026-09-16'),
  ];
  const extrasSequence = [...extras('2026-09-17'), ...extras('2026-09-18', ['Istijaba']), ...extras('2026-09-19')];

  describe.each(ORDERS)('sorting rows given %s', (_order, arrange) => {
    it.each([
      ['Standard', standardSequence],
      ['Extras, with a Friday', extrasSequence],
    ])('puts a %s sequence back in list order', (_list, sequence) => {
      expect([...arrange(sequence)].sort(compareListOrder).map(keyOf)).toEqual(sequence.map(keyOf));
    });
  });
});

// =============================================================================
// findNextReadable
// =============================================================================

describe('findNextReadable', () => {
  const sequence = [...standard('2026-09-14'), ...standard('2026-09-15'), ...standard('2026-09-16')];

  describe.each(ORDERS)('given %s', (_order, arrange) => {
    const prayers = arrange(sequence);

    it.each([
      ['1 ms before Dhuhr', standardAt('Dhuhr 2026-09-15', -1), 'Dhuhr 2026-09-15'],
      ['at Dhuhr', standardAt('Dhuhr 2026-09-15'), 'Asr 2026-09-15'],
      ['1 ms after Dhuhr', standardAt('Dhuhr 2026-09-15', 1), 'Asr 2026-09-15'],
      ['at Isha, the next list day', standardAt('Isha 2026-09-15'), 'Fajr 2026-09-16'],
      ['long before the first row', at('2026-09-01T00:00:00.000Z'), 'Fajr 2026-09-14'],
      ['1 ms before the last row', standardAt('Isha 2026-09-16', -1), 'Isha 2026-09-16'],
      ['at the last row', standardAt('Isha 2026-09-16'), null],
    ])('%s', (_label, now, expected) => {
      expect(keyOf(findNextReadable(prayers, now))).toBe(expected);
    });
  });

  it('by moment rather than list order, when a list runs past the start of the next', () => {
    const prayers = [
      row(ScheduleType.Standard, 'Isha', '2026-09-26', { clock: '00:30', on: '2026-09-27' }),
      row(ScheduleType.Standard, 'Fajr', '2026-09-27', '00:10'),
    ];
    for (const [, arrange] of ORDERS) {
      expect(keyOf(findNextReadable(arrange(prayers), at('2026-09-26T22:00:00.000Z')))).toBe('Fajr 2026-09-27');
    }
  });

  it.each([
    ['empty input', [] as Prayer[]],
    ['a list with no readable row', blankStandard('2026-09-15')],
    ['three list days with no readable row', [...blankExtras('2026-09-17'), ...blankExtras('2026-09-18', true)]],
  ])('nothing is next for %s', (_label, prayers) => {
    expect(findNextReadable(prayers, at('2026-09-15T00:00:00.000Z'))).toBeNull();
  });
});

// =============================================================================
// resolveDisplayDate, getDisplayHoldEnd, getNextBoundary, isRowPassed and findPreviousReadable together:
// walks through whole London days
// =============================================================================

interface Moment {
  label: string;
  now: Date;
  display: string | null;
  next: string | null;
  /** Hold end of the expected display date, ISO */
  hold: string | null;
  /** A row key or an ISO instant */
  boundary: string | null;
  previous: string | null;
  passed?: Record<string, boolean>;
}

const walk = (title: string, sequence: Prayer[], moments: Moment[]) => {
  describe(title, () => {
    describe.each(ORDERS)('given %s', (_order, arrange) => {
      const prayers = arrange(sequence);

      it.each(moments)('$label', (moment) => {
        const next = findNextReadable(prayers, moment.now);
        const passedKeys = Object.keys(moment.passed ?? {});
        const expectedBoundary =
          moment.boundary === null || /^\d{4}-\d{2}-\d{2}T/.test(moment.boundary)
            ? moment.boundary
            : instantOf(sequence, moment.boundary).toISOString();

        expect({
          display: resolveDisplayDate(prayers, moment.now),
          next: keyOf(next),
          hold: isoOrNull(getDisplayHoldEnd(prayers, moment.display)),
          boundary: isoOrNull(getNextBoundary(prayers, moment.now)),
          previous: next ? keyOf(findPreviousReadable(prayers, next)) : null,
          passed: Object.fromEntries(passedKeys.map((k) => [k, isRowPassed(prayers, find(prayers, k), moment.now)])),
        }).toEqual({
          display: moment.display,
          next: moment.next,
          hold: moment.hold,
          boundary: expectedBoundary,
          previous: moment.previous,
          passed: moment.passed ?? {},
        });
      });
    });
  });
};

describe('a whole London day', () => {
  walk(
    'one unreadable Asr: dim until Dhuhr passes, the highlight goes Dhuhr to Magrib',
    [...standard('2026-09-14'), ...standard('2026-09-15', ['Asr']), ...standard('2026-09-16')],
    [
      {
        label: '1 ms before the list before hands over',
        now: standardAt('Isha 2026-09-14', -1),
        display: '2026-09-14',
        next: 'Isha 2026-09-14',
        hold: null,
        boundary: 'Isha 2026-09-14',
        previous: 'Magrib 2026-09-14',
        passed: { 'Asr 2026-09-15': false },
      },
      {
        label: "at the list before's Isha",
        now: standardAt('Isha 2026-09-14'),
        display: '2026-09-15',
        next: 'Fajr 2026-09-15',
        hold: null,
        boundary: 'Fajr 2026-09-15',
        previous: 'Isha 2026-09-14',
        passed: { 'Asr 2026-09-15': false },
      },
      {
        label: '00:00 London',
        now: at('2026-09-14T23:00:00.000Z'),
        display: '2026-09-15',
        next: 'Fajr 2026-09-15',
        hold: null,
        boundary: 'Fajr 2026-09-15',
        previous: 'Isha 2026-09-14',
        passed: { 'Asr 2026-09-15': false },
      },
      {
        label: '1 ms after Fajr',
        now: standardAt('Fajr 2026-09-15', 1),
        display: '2026-09-15',
        next: 'Sunrise 2026-09-15',
        hold: null,
        boundary: 'Sunrise 2026-09-15',
        previous: 'Fajr 2026-09-15',
        passed: { 'Asr 2026-09-15': false },
      },
      {
        label: '1 ms before Dhuhr',
        now: standardAt('Dhuhr 2026-09-15', -1),
        display: '2026-09-15',
        next: 'Dhuhr 2026-09-15',
        hold: null,
        boundary: 'Dhuhr 2026-09-15',
        previous: 'Sunrise 2026-09-15',
        passed: { 'Dhuhr 2026-09-15': false, 'Asr 2026-09-15': false },
      },
      {
        label: 'at Dhuhr',
        now: standardAt('Dhuhr 2026-09-15'),
        display: '2026-09-15',
        next: 'Magrib 2026-09-15',
        hold: null,
        boundary: 'Magrib 2026-09-15',
        previous: 'Dhuhr 2026-09-15',
        passed: { 'Dhuhr 2026-09-15': false, 'Asr 2026-09-15': false },
      },
      {
        label: '1 ms after Dhuhr',
        now: standardAt('Dhuhr 2026-09-15', 1),
        display: '2026-09-15',
        next: 'Magrib 2026-09-15',
        hold: null,
        boundary: 'Magrib 2026-09-15',
        previous: 'Dhuhr 2026-09-15',
        passed: { 'Dhuhr 2026-09-15': true, 'Asr 2026-09-15': true, 'Magrib 2026-09-15': false },
      },
      {
        label: 'the moment Asr would have been',
        now: at('2026-09-15T15:21:00.000Z'),
        display: '2026-09-15',
        next: 'Magrib 2026-09-15',
        hold: null,
        boundary: 'Magrib 2026-09-15',
        previous: 'Dhuhr 2026-09-15',
        passed: { 'Asr 2026-09-15': true },
      },
      {
        label: '1 ms after Magrib',
        now: standardAt('Magrib 2026-09-15', 1),
        display: '2026-09-15',
        next: 'Isha 2026-09-15',
        hold: null,
        boundary: 'Isha 2026-09-15',
        previous: 'Magrib 2026-09-15',
        passed: { 'Asr 2026-09-15': true },
      },
      {
        label: '1 ms before Isha',
        now: standardAt('Isha 2026-09-15', -1),
        display: '2026-09-15',
        next: 'Isha 2026-09-15',
        hold: null,
        boundary: 'Isha 2026-09-15',
        previous: 'Magrib 2026-09-15',
        passed: { 'Asr 2026-09-15': true },
      },
      {
        label: 'at Isha the list moves on as it does today',
        now: standardAt('Isha 2026-09-15'),
        display: '2026-09-16',
        next: 'Fajr 2026-09-16',
        hold: null,
        boundary: 'Fajr 2026-09-16',
        previous: 'Isha 2026-09-15',
        passed: { 'Asr 2026-09-15': true },
      },
      {
        label: '1 ms after Isha',
        now: standardAt('Isha 2026-09-15', 1),
        display: '2026-09-16',
        next: 'Fajr 2026-09-16',
        hold: null,
        boundary: 'Fajr 2026-09-16',
        previous: 'Isha 2026-09-15',
        passed: { 'Asr 2026-09-15': true },
      },
    ]
  );

  walk(
    'an unreadable Fajr: passed from the start, Sunrise next',
    [...standard('2026-09-14'), ...standard('2026-09-15', ['Fajr']), ...standard('2026-09-16')],
    [
      {
        label: 'midday the day before, with the list before still on screen',
        now: at('2026-09-14T11:00:00.000Z'),
        display: '2026-09-14',
        next: 'Dhuhr 2026-09-14',
        hold: null,
        boundary: 'Dhuhr 2026-09-14',
        previous: 'Sunrise 2026-09-14',
        passed: { 'Fajr 2026-09-15': true },
      },
      {
        label: "1 ms after the list before's Isha",
        now: standardAt('Isha 2026-09-14', 1),
        display: '2026-09-15',
        next: 'Sunrise 2026-09-15',
        hold: null,
        boundary: 'Sunrise 2026-09-15',
        previous: 'Isha 2026-09-14',
        passed: { 'Fajr 2026-09-15': true, 'Sunrise 2026-09-15': false },
      },
      {
        label: 'the moment Fajr would have been',
        now: at('2026-09-15T04:04:00.000Z'),
        display: '2026-09-15',
        next: 'Sunrise 2026-09-15',
        hold: null,
        boundary: 'Sunrise 2026-09-15',
        previous: 'Isha 2026-09-14',
        passed: { 'Fajr 2026-09-15': true },
      },
      {
        label: 'at Sunrise',
        now: standardAt('Sunrise 2026-09-15'),
        display: '2026-09-15',
        next: 'Dhuhr 2026-09-15',
        hold: null,
        boundary: 'Dhuhr 2026-09-15',
        previous: 'Sunrise 2026-09-15',
        passed: { 'Fajr 2026-09-15': true, 'Sunrise 2026-09-15': false },
      },
      {
        label: '1 ms after Sunrise',
        now: standardAt('Sunrise 2026-09-15', 1),
        display: '2026-09-15',
        next: 'Dhuhr 2026-09-15',
        hold: null,
        boundary: 'Dhuhr 2026-09-15',
        previous: 'Sunrise 2026-09-15',
        passed: { 'Fajr 2026-09-15': true, 'Sunrise 2026-09-15': true },
      },
    ]
  );

  walk(
    'an unreadable Isha: the list moves on after Magrib, its last readable row',
    [...standard('2026-09-14'), ...standard('2026-09-15', ['Isha']), ...standard('2026-09-16')],
    [
      {
        label: '1 ms after Asr, with Magrib still to come',
        now: standardAt('Asr 2026-09-15', 1),
        display: '2026-09-15',
        next: 'Magrib 2026-09-15',
        hold: null,
        boundary: 'Magrib 2026-09-15',
        previous: 'Asr 2026-09-15',
        passed: { 'Isha 2026-09-15': false },
      },
      {
        label: '1 ms before Magrib',
        now: standardAt('Magrib 2026-09-15', -1),
        display: '2026-09-15',
        next: 'Magrib 2026-09-15',
        hold: null,
        boundary: 'Magrib 2026-09-15',
        previous: 'Asr 2026-09-15',
        passed: { 'Isha 2026-09-15': false },
      },
      {
        label: 'at Magrib',
        now: standardAt('Magrib 2026-09-15'),
        display: '2026-09-16',
        next: 'Fajr 2026-09-16',
        hold: null,
        boundary: 'Fajr 2026-09-16',
        previous: 'Magrib 2026-09-15',
        passed: { 'Isha 2026-09-15': false },
      },
      {
        label: '1 ms after Magrib',
        now: standardAt('Magrib 2026-09-15', 1),
        display: '2026-09-16',
        next: 'Fajr 2026-09-16',
        hold: null,
        boundary: 'Fajr 2026-09-16',
        previous: 'Magrib 2026-09-15',
        passed: { 'Isha 2026-09-15': true },
      },
      {
        label: 'the moment Isha would have been',
        now: at('2026-09-15T19:28:00.000Z'),
        display: '2026-09-16',
        next: 'Fajr 2026-09-16',
        hold: null,
        boundary: 'Fajr 2026-09-16',
        previous: 'Magrib 2026-09-15',
        passed: { 'Isha 2026-09-15': true },
      },
      {
        label: '00:00 London changes nothing',
        now: at('2026-09-15T23:00:00.000Z'),
        display: '2026-09-16',
        next: 'Fajr 2026-09-16',
        hold: null,
        boundary: 'Fajr 2026-09-16',
        previous: 'Magrib 2026-09-15',
        passed: { 'Isha 2026-09-15': true },
      },
    ]
  );

  walk(
    'R15 scene 3: Fajr and Magrib unreadable, Sunrise next',
    [...standard('2026-09-14'), ...standard('2026-09-15', ['Fajr', 'Magrib']), ...standard('2026-09-16')],
    [
      {
        label: "1 ms after the list before's Isha",
        now: standardAt('Isha 2026-09-14', 1),
        display: '2026-09-15',
        next: 'Sunrise 2026-09-15',
        hold: null,
        boundary: 'Sunrise 2026-09-15',
        previous: 'Isha 2026-09-14',
        passed: { 'Fajr 2026-09-15': true, 'Magrib 2026-09-15': false },
      },
      {
        label: '1 ms before Asr',
        now: standardAt('Asr 2026-09-15', -1),
        display: '2026-09-15',
        next: 'Asr 2026-09-15',
        hold: null,
        boundary: 'Asr 2026-09-15',
        previous: 'Dhuhr 2026-09-15',
        passed: { 'Fajr 2026-09-15': true, 'Magrib 2026-09-15': false },
      },
      {
        label: 'at Asr',
        now: standardAt('Asr 2026-09-15'),
        display: '2026-09-15',
        next: 'Isha 2026-09-15',
        hold: null,
        boundary: 'Isha 2026-09-15',
        previous: 'Asr 2026-09-15',
        passed: { 'Magrib 2026-09-15': false },
      },
      {
        label: '1 ms after Asr, Isha next and Magrib bright',
        now: standardAt('Asr 2026-09-15', 1),
        display: '2026-09-15',
        next: 'Isha 2026-09-15',
        hold: null,
        boundary: 'Isha 2026-09-15',
        previous: 'Asr 2026-09-15',
        passed: { 'Fajr 2026-09-15': true, 'Magrib 2026-09-15': true },
      },
    ]
  );

  const blank15 = blankStandard('2026-09-15');

  walk(
    'a fully unreadable list day: on screen from 00:00 London at its start to 00:00 at its end',
    [...standard('2026-09-14'), ...blank15, ...standard('2026-09-16')],
    [
      {
        label: "1 ms before the list before's Isha",
        now: standardAt('Isha 2026-09-14', -1),
        display: '2026-09-14',
        next: 'Isha 2026-09-14',
        hold: '2026-09-14T23:00:00.000Z',
        boundary: 'Isha 2026-09-14',
        previous: 'Magrib 2026-09-14',
        passed: allPassed(blank15),
      },
      {
        label: "at the list before's Isha that list stays on screen, waiting for 00:00",
        now: standardAt('Isha 2026-09-14'),
        display: '2026-09-14',
        next: 'Fajr 2026-09-16',
        hold: '2026-09-14T23:00:00.000Z',
        boundary: '2026-09-14T23:00:00.000Z',
        previous: null,
        passed: allPassed(blank15),
      },
      {
        label: "1 ms after the list before's Isha",
        now: standardAt('Isha 2026-09-14', 1),
        display: '2026-09-14',
        next: 'Fajr 2026-09-16',
        hold: '2026-09-14T23:00:00.000Z',
        boundary: '2026-09-14T23:00:00.000Z',
        previous: null,
        passed: allPassed(blank15),
      },
      {
        label: '1 ms before 00:00 London at its start',
        now: at('2026-09-14T22:59:59.999Z'),
        display: '2026-09-14',
        next: 'Fajr 2026-09-16',
        hold: '2026-09-14T23:00:00.000Z',
        boundary: '2026-09-14T23:00:00.000Z',
        previous: null,
        passed: allPassed(blank15),
      },
      {
        label: 'at 00:00 London at its start it comes on screen',
        now: at('2026-09-14T23:00:00.000Z'),
        display: '2026-09-15',
        next: 'Fajr 2026-09-16',
        hold: '2026-09-15T23:00:00.000Z',
        boundary: '2026-09-15T23:00:00.000Z',
        previous: null,
        passed: allPassed(blank15),
      },
      {
        label: 'midday on the day',
        now: at('2026-09-15T11:00:00.000Z'),
        display: '2026-09-15',
        next: 'Fajr 2026-09-16',
        hold: '2026-09-15T23:00:00.000Z',
        boundary: '2026-09-15T23:00:00.000Z',
        previous: null,
        passed: allPassed(blank15),
      },
      {
        label: '1 ms before 00:00 London at its end',
        now: at('2026-09-15T22:59:59.999Z'),
        display: '2026-09-15',
        next: 'Fajr 2026-09-16',
        hold: '2026-09-15T23:00:00.000Z',
        boundary: '2026-09-15T23:00:00.000Z',
        previous: null,
        passed: allPassed(blank15),
      },
      {
        label: 'at 00:00 London the next list comes on',
        now: at('2026-09-15T23:00:00.000Z'),
        display: '2026-09-16',
        next: 'Fajr 2026-09-16',
        hold: null,
        boundary: 'Fajr 2026-09-16',
        previous: null,
        passed: allPassed(blank15),
      },
      {
        label: '1 ms after 00:00 London',
        now: at('2026-09-15T23:00:00.001Z'),
        display: '2026-09-16',
        next: 'Fajr 2026-09-16',
        hold: null,
        boundary: 'Fajr 2026-09-16',
        previous: null,
        passed: allPassed(blank15),
      },
      {
        label: '1 ms after the following Fajr',
        now: standardAt('Fajr 2026-09-16', 1),
        display: '2026-09-16',
        next: 'Sunrise 2026-09-16',
        hold: null,
        boundary: 'Sunrise 2026-09-16',
        previous: 'Fajr 2026-09-16',
        passed: allPassed(blank15),
      },
    ]
  );

  walk(
    'session 7: a readable Magrib at 00:40 after an unreadable Isha keeps its list day until 00:40',
    [...standard('2026-09-24'), ...standard('2026-09-25', ['Isha']), ...standard('2026-09-26')],
    [
      {
        label: '1 ms after Asr',
        now: standardAt('Asr 2026-09-25', 1),
        display: '2026-09-25',
        next: 'Magrib 2026-09-25',
        hold: null,
        boundary: 'Magrib 2026-09-25',
        previous: 'Asr 2026-09-25',
        passed: { 'Isha 2026-09-25': false },
      },
      {
        label: '00:00 London',
        now: at('2026-09-25T23:00:00.000Z'),
        display: '2026-09-25',
        next: 'Magrib 2026-09-25',
        hold: null,
        boundary: 'Magrib 2026-09-25',
        previous: 'Asr 2026-09-25',
        passed: { 'Isha 2026-09-25': false },
      },
      {
        label: '00:20 London',
        now: at('2026-09-25T23:20:00.000Z'),
        display: '2026-09-25',
        next: 'Magrib 2026-09-25',
        hold: null,
        boundary: 'Magrib 2026-09-25',
        previous: 'Asr 2026-09-25',
        passed: { 'Isha 2026-09-25': false },
      },
      {
        label: '1 ms before the 00:40 Magrib',
        now: at('2026-09-25T23:39:59.999Z'),
        display: '2026-09-25',
        next: 'Magrib 2026-09-25',
        hold: null,
        boundary: 'Magrib 2026-09-25',
        previous: 'Asr 2026-09-25',
        passed: { 'Isha 2026-09-25': false },
      },
      {
        label: 'at the 00:40 Magrib',
        now: at('2026-09-25T23:40:00.000Z'),
        display: '2026-09-26',
        next: 'Fajr 2026-09-26',
        hold: null,
        boundary: 'Fajr 2026-09-26',
        previous: 'Magrib 2026-09-25',
        passed: { 'Isha 2026-09-25': false },
      },
      {
        label: '1 ms after the 00:40 Magrib',
        now: at('2026-09-25T23:40:00.001Z'),
        display: '2026-09-26',
        next: 'Fajr 2026-09-26',
        hold: null,
        boundary: 'Fajr 2026-09-26',
        previous: 'Magrib 2026-09-25',
        passed: { 'Isha 2026-09-25': true },
      },
    ]
  );
});

describe('where a fully unreadable list day sits in the sequence', () => {
  walk(
    'at the start',
    [...blankStandard('2026-09-15'), ...standard('2026-09-16'), ...standard('2026-09-17')],
    [
      {
        label: 'the evening before, with nothing earlier in the sequence',
        now: at('2026-09-14T21:00:00.000Z'),
        display: '2026-09-15',
        next: 'Fajr 2026-09-16',
        hold: '2026-09-15T23:00:00.000Z',
        boundary: '2026-09-15T23:00:00.000Z',
        previous: null,
      },
      {
        label: 'midday on the day',
        now: at('2026-09-15T11:00:00.000Z'),
        display: '2026-09-15',
        next: 'Fajr 2026-09-16',
        hold: '2026-09-15T23:00:00.000Z',
        boundary: '2026-09-15T23:00:00.000Z',
        previous: null,
      },
      {
        label: '00:00 London at its end',
        now: at('2026-09-15T23:00:00.000Z'),
        display: '2026-09-16',
        next: 'Fajr 2026-09-16',
        hold: null,
        boundary: 'Fajr 2026-09-16',
        previous: null,
      },
    ]
  );

  walk(
    'at the end',
    [...standard('2026-09-14'), ...standard('2026-09-15'), ...blankStandard('2026-09-16')],
    [
      {
        label: '1 ms before the last readable row',
        now: standardAt('Isha 2026-09-15', -1),
        display: '2026-09-15',
        next: 'Isha 2026-09-15',
        hold: '2026-09-15T23:00:00.000Z',
        boundary: 'Isha 2026-09-15',
        previous: 'Magrib 2026-09-15',
      },
      {
        label: 'at the last readable row its list waits for 00:00, with nothing readable left to count to',
        now: standardAt('Isha 2026-09-15'),
        display: '2026-09-15',
        next: null,
        hold: '2026-09-15T23:00:00.000Z',
        boundary: '2026-09-15T23:00:00.000Z',
        previous: null,
      },
      {
        label: 'at 00:00 London at its start the unreadable day comes on',
        now: at('2026-09-15T23:00:00.000Z'),
        display: '2026-09-16',
        next: null,
        hold: '2026-09-16T23:00:00.000Z',
        boundary: '2026-09-16T23:00:00.000Z',
        previous: null,
      },
      {
        label: '1 ms before 00:00 London at its end',
        now: at('2026-09-16T22:59:59.999Z'),
        display: '2026-09-16',
        next: null,
        hold: '2026-09-16T23:00:00.000Z',
        boundary: '2026-09-16T23:00:00.000Z',
        previous: null,
      },
      {
        label: 'at 00:00 London at its end nothing is left',
        now: at('2026-09-16T23:00:00.000Z'),
        display: null,
        next: null,
        hold: null,
        boundary: null,
        previous: null,
      },
    ]
  );

  walk(
    'two in a row',
    [
      ...standard('2026-09-14'),
      ...blankStandard('2026-09-15'),
      ...blankStandard('2026-09-16'),
      ...standard('2026-09-17'),
    ],
    [
      {
        label: "1 ms after the list before's Isha",
        now: standardAt('Isha 2026-09-14', 1),
        display: '2026-09-14',
        next: 'Fajr 2026-09-17',
        hold: '2026-09-14T23:00:00.000Z',
        boundary: '2026-09-14T23:00:00.000Z',
        previous: null,
      },
      {
        label: 'as the list before ends',
        now: at('2026-09-14T23:00:00.000Z'),
        display: '2026-09-15',
        next: 'Fajr 2026-09-17',
        hold: '2026-09-15T23:00:00.000Z',
        boundary: '2026-09-15T23:00:00.000Z',
        previous: null,
      },
      {
        label: '1 ms before the first ends',
        now: at('2026-09-15T22:59:59.999Z'),
        display: '2026-09-15',
        next: 'Fajr 2026-09-17',
        hold: '2026-09-15T23:00:00.000Z',
        boundary: '2026-09-15T23:00:00.000Z',
        previous: null,
      },
      {
        label: 'as the first ends',
        now: at('2026-09-15T23:00:00.000Z'),
        display: '2026-09-16',
        next: 'Fajr 2026-09-17',
        hold: '2026-09-16T23:00:00.000Z',
        boundary: '2026-09-16T23:00:00.000Z',
        previous: null,
      },
      {
        label: '1 ms before the second ends',
        now: at('2026-09-16T22:59:59.999Z'),
        display: '2026-09-16',
        next: 'Fajr 2026-09-17',
        hold: '2026-09-16T23:00:00.000Z',
        boundary: '2026-09-16T23:00:00.000Z',
        previous: null,
      },
      {
        label: 'as the second ends',
        now: at('2026-09-16T23:00:00.000Z'),
        display: '2026-09-17',
        next: 'Fajr 2026-09-17',
        hold: null,
        boundary: 'Fajr 2026-09-17',
        previous: null,
      },
      {
        label: '1 ms after the following Fajr',
        now: standardAt('Fajr 2026-09-17', 1),
        display: '2026-09-17',
        next: 'Sunrise 2026-09-17',
        hold: null,
        boundary: 'Sunrise 2026-09-17',
        previous: 'Fajr 2026-09-17',
      },
    ]
  );

  walk(
    'three in a row',
    [
      ...standard('2026-09-14'),
      ...blankStandard('2026-09-15'),
      ...blankStandard('2026-09-16'),
      ...blankStandard('2026-09-17'),
      ...standard('2026-09-18'),
    ],
    [
      {
        label: "1 ms after the list before's Isha",
        now: standardAt('Isha 2026-09-14', 1),
        display: '2026-09-14',
        next: 'Fajr 2026-09-18',
        hold: '2026-09-14T23:00:00.000Z',
        boundary: '2026-09-14T23:00:00.000Z',
        previous: null,
      },
      {
        label: 'as the list before ends',
        now: at('2026-09-14T23:00:00.000Z'),
        display: '2026-09-15',
        next: 'Fajr 2026-09-18',
        hold: '2026-09-15T23:00:00.000Z',
        boundary: '2026-09-15T23:00:00.000Z',
        previous: null,
      },
      {
        label: 'as the first ends',
        now: at('2026-09-15T23:00:00.000Z'),
        display: '2026-09-16',
        next: 'Fajr 2026-09-18',
        hold: '2026-09-16T23:00:00.000Z',
        boundary: '2026-09-16T23:00:00.000Z',
        previous: null,
      },
      {
        label: 'as the second ends',
        now: at('2026-09-16T23:00:00.000Z'),
        display: '2026-09-17',
        next: 'Fajr 2026-09-18',
        hold: '2026-09-17T23:00:00.000Z',
        boundary: '2026-09-17T23:00:00.000Z',
        previous: null,
      },
      {
        label: '1 ms before the third ends',
        now: at('2026-09-17T22:59:59.999Z'),
        display: '2026-09-17',
        next: 'Fajr 2026-09-18',
        hold: '2026-09-17T23:00:00.000Z',
        boundary: '2026-09-17T23:00:00.000Z',
        previous: null,
      },
      {
        label: 'as the third ends',
        now: at('2026-09-17T23:00:00.000Z'),
        display: '2026-09-18',
        next: 'Fajr 2026-09-18',
        hold: null,
        boundary: 'Fajr 2026-09-18',
        previous: null,
      },
    ]
  );

  walk(
    'two in a row at the start',
    [...blankStandard('2026-09-15'), ...blankStandard('2026-09-16'), ...standard('2026-09-17')],
    [
      {
        label: 'the evening before',
        now: at('2026-09-14T21:00:00.000Z'),
        display: '2026-09-15',
        next: 'Fajr 2026-09-17',
        hold: '2026-09-15T23:00:00.000Z',
        boundary: '2026-09-15T23:00:00.000Z',
        previous: null,
      },
      {
        label: 'as the first ends',
        now: at('2026-09-15T23:00:00.000Z'),
        display: '2026-09-16',
        next: 'Fajr 2026-09-17',
        hold: '2026-09-16T23:00:00.000Z',
        boundary: '2026-09-16T23:00:00.000Z',
        previous: null,
      },
    ]
  );

  walk(
    'two in a row at the end',
    [...standard('2026-09-14'), ...blankStandard('2026-09-15'), ...blankStandard('2026-09-16')],
    [
      {
        label: "1 ms after the list before's Isha",
        now: standardAt('Isha 2026-09-14', 1),
        display: '2026-09-14',
        next: null,
        hold: '2026-09-14T23:00:00.000Z',
        boundary: '2026-09-14T23:00:00.000Z',
        previous: null,
      },
      {
        label: 'as the first ends',
        now: at('2026-09-15T23:00:00.000Z'),
        display: '2026-09-16',
        next: null,
        hold: '2026-09-16T23:00:00.000Z',
        boundary: '2026-09-16T23:00:00.000Z',
        previous: null,
      },
      {
        label: 'as the second ends',
        now: at('2026-09-16T23:00:00.000Z'),
        display: null,
        next: null,
        hold: null,
        boundary: null,
        previous: null,
      },
    ]
  );

  walk(
    'after a list day whose Magrib and Isha fall after its own 00:00, handed over at that Isha instead',
    [...standard('2026-09-24'), ...standard('2026-09-25'), ...blankStandard('2026-09-26')],
    [
      {
        label: '1 ms after Asr',
        now: standardAt('Asr 2026-09-25', 1),
        display: '2026-09-25',
        next: 'Magrib 2026-09-25',
        hold: null,
        boundary: 'Magrib 2026-09-25',
        previous: 'Asr 2026-09-25',
      },
      {
        label: '00:00 London is no boundary while its own rows are still to come',
        now: at('2026-09-25T23:00:00.000Z'),
        display: '2026-09-25',
        next: 'Magrib 2026-09-25',
        hold: null,
        boundary: 'Magrib 2026-09-25',
        previous: 'Asr 2026-09-25',
      },
      {
        label: '1 ms before the 01:30 Isha',
        now: at('2026-09-26T00:29:59.999Z'),
        display: '2026-09-25',
        next: 'Isha 2026-09-25',
        hold: null,
        boundary: 'Isha 2026-09-25',
        previous: 'Magrib 2026-09-25',
      },
      {
        label: 'at the 01:30 Isha the unreadable day comes on',
        now: at('2026-09-26T00:30:00.000Z'),
        display: '2026-09-26',
        next: null,
        hold: '2026-09-26T23:00:00.000Z',
        boundary: '2026-09-26T23:00:00.000Z',
        previous: null,
      },
    ]
  );

  walk(
    'after a list day whose last row falls exactly at its own 00:00',
    [
      ...standard('2026-09-14').filter((prayer) => prayer.english !== 'Isha'),
      row(ScheduleType.Standard, 'Isha', '2026-09-14', { clock: '00:00', on: '2026-09-15' }),
      ...blankStandard('2026-09-15'),
    ],
    [
      {
        label: '1 ms before, the row and the end of its day are one boundary',
        now: at('2026-09-14T22:59:59.999Z'),
        display: '2026-09-14',
        next: 'Isha 2026-09-14',
        hold: '2026-09-14T23:00:00.000Z',
        boundary: '2026-09-14T23:00:00.000Z',
        previous: 'Magrib 2026-09-14',
      },
      {
        label: 'at that instant the unreadable day comes on',
        now: at('2026-09-14T23:00:00.000Z'),
        display: '2026-09-15',
        next: null,
        hold: '2026-09-15T23:00:00.000Z',
        boundary: '2026-09-15T23:00:00.000Z',
        previous: null,
      },
    ]
  );
});

describe('a fully unreadable list day across the 2026 clock changes', () => {
  describe.each([
    // [list before, unreadable list day, list after, Isha of the list before, 00:00 at its start, hold end,
    // Fajr of the list after]
    [
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
      '2026-10-23T18:18:00.000Z',
      '2026-10-23T23:00:00.000Z',
      '2026-10-24T23:00:00.000Z',
      '2026-10-25T04:50:00.000Z',
    ],
    [
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
      '2026-10-24T18:16:00.000Z',
      '2026-10-24T23:00:00.000Z',
      '2026-10-26T00:00:00.000Z',
      '2026-10-26T04:52:00.000Z',
    ],
    [
      '2026-03-27',
      '2026-03-28',
      '2026-03-29',
      '2026-03-27T19:50:00.000Z',
      '2026-03-28T00:00:00.000Z',
      '2026-03-29T00:00:00.000Z',
      '2026-03-29T04:42:00.000Z',
    ],
    [
      '2026-03-28',
      '2026-03-29',
      '2026-03-30',
      '2026-03-28T19:52:00.000Z',
      '2026-03-29T00:00:00.000Z',
      '2026-03-29T23:00:00.000Z',
      '2026-03-30T04:40:00.000Z',
    ],
  ])('%s, then %s unreadable, then %s', (before, blank, after, isha, dayStart, holdEnd, fajr) => {
    walk(
      'walk',
      [...standard(before), ...blankStandard(blank), ...standard(after)],
      [
        {
          label: "1 ms before the list before's Isha",
          now: at(isha, -1),
          display: before,
          next: `Isha ${before}`,
          hold: dayStart,
          boundary: isha,
          previous: `Magrib ${before}`,
        },
        {
          label: "1 ms after the list before's Isha it waits for 00:00",
          now: at(isha, 1),
          display: before,
          next: `Fajr ${after}`,
          hold: dayStart,
          boundary: dayStart,
          previous: null,
        },
        {
          label: '1 ms before 00:00 London at its start',
          now: at(dayStart, -1),
          display: before,
          next: `Fajr ${after}`,
          hold: dayStart,
          boundary: dayStart,
          previous: null,
        },
        {
          label: 'at 00:00 London at its start',
          now: at(dayStart),
          display: blank,
          next: `Fajr ${after}`,
          hold: holdEnd,
          boundary: holdEnd,
          previous: null,
        },
        {
          label: '1 ms before 00:00 London at its end',
          now: at(holdEnd, -1),
          display: blank,
          next: `Fajr ${after}`,
          hold: holdEnd,
          boundary: holdEnd,
          previous: null,
        },
        {
          label: 'at 00:00 London at its end',
          now: at(holdEnd),
          display: after,
          next: `Fajr ${after}`,
          hold: null,
          boundary: fajr,
          previous: null,
        },
        {
          label: '1 ms after 00:00 London at its end',
          now: at(holdEnd, 1),
          display: after,
          next: `Fajr ${after}`,
          hold: null,
          boundary: fajr,
          previous: null,
        },
      ]
    );
  });
});

describe('an Extras list held while the next list opens before 00:00', () => {
  const blank11 = blankExtras('2026-12-11', true);

  walk(
    'Friday 11 December fully unreadable, Saturday Midnight at 23:03 on Friday',
    [...extras('2026-12-10'), ...blank11, ...extras('2026-12-12')],
    [
      {
        label: '1 ms before Duha, the last row of the list before',
        now: extrasAt('Duha 2026-12-10', -1),
        display: '2026-12-10',
        next: 'Duha 2026-12-10',
        hold: '2026-12-11T00:00:00.000Z',
        boundary: 'Duha 2026-12-10',
        previous: 'Suhoor 2026-12-10',
        passed: allPassed(blank11),
      },
      {
        label: '1 ms after Duha the list before waits for 00:00',
        now: extrasAt('Duha 2026-12-10', 1),
        display: '2026-12-10',
        next: 'Midnight 2026-12-12',
        hold: '2026-12-11T00:00:00.000Z',
        boundary: '2026-12-11T00:00:00.000Z',
        previous: null,
        passed: allPassed(blank11),
      },
      {
        label: 'at 00:00 London Friday comes on, held, and the next list opens before the hold ends',
        now: at('2026-12-11T00:00:00.000Z'),
        display: '2026-12-11',
        next: 'Midnight 2026-12-12',
        hold: '2026-12-12T00:00:00.000Z',
        boundary: 'Midnight 2026-12-12',
        previous: null,
        passed: allPassed(blank11),
      },
      {
        label: '1 ms before that Midnight',
        now: at('2026-12-11T23:02:59.999Z'),
        display: '2026-12-11',
        next: 'Midnight 2026-12-12',
        hold: '2026-12-12T00:00:00.000Z',
        boundary: 'Midnight 2026-12-12',
        previous: null,
        passed: { 'Midnight 2026-12-12': false },
      },
      {
        label: 'at that Midnight the hold end becomes the boundary',
        now: at('2026-12-11T23:03:00.000Z'),
        display: '2026-12-11',
        next: 'Last Third 2026-12-12',
        hold: '2026-12-12T00:00:00.000Z',
        boundary: '2026-12-12T00:00:00.000Z',
        previous: 'Midnight 2026-12-12',
        passed: { 'Midnight 2026-12-12': false },
      },
      {
        label: '1 ms after that Midnight the held list stays on screen',
        now: at('2026-12-11T23:03:00.001Z'),
        display: '2026-12-11',
        next: 'Last Third 2026-12-12',
        hold: '2026-12-12T00:00:00.000Z',
        boundary: '2026-12-12T00:00:00.000Z',
        previous: 'Midnight 2026-12-12',
        passed: { 'Midnight 2026-12-12': true },
      },
      {
        label: 'at 00:00 London the next list comes on',
        now: at('2026-12-12T00:00:00.000Z'),
        display: '2026-12-12',
        next: 'Last Third 2026-12-12',
        hold: null,
        boundary: 'Last Third 2026-12-12',
        previous: 'Midnight 2026-12-12',
        passed: { 'Midnight 2026-12-12': true },
      },
    ]
  );
});

// =============================================================================
// An unreadable row at every position on its list
// =============================================================================

describe('an unreadable row at each position', () => {
  const standardCases = STANDARD_NAMES.map((english, i) => ({
    list: 'Standard',
    english,
    sequence: [...standard('2026-09-14'), ...standard('2026-09-15', [english]), ...standard('2026-09-16')],
    day: '2026-09-15',
    before: '2026-09-14',
    after: '2026-09-16',
    above: i === 0 ? 'Isha 2026-09-14' : `${STANDARD_NAMES[i - 1]} 2026-09-15`,
    below: i === STANDARD_NAMES.length - 1 ? 'Fajr 2026-09-16' : `${STANDARD_NAMES[i + 1]} 2026-09-15`,
    first: i === 0,
    last: i === STANDARD_NAMES.length - 1,
  }));

  const extrasCases = EXTRAS_NAMES.map((english, i) => ({
    list: 'Friday Extras',
    english,
    sequence: [...extras('2026-09-17'), ...extras('2026-09-18', [english]), ...extras('2026-09-19')],
    day: '2026-09-18',
    before: '2026-09-17',
    after: '2026-09-19',
    above: i === 0 ? 'Duha 2026-09-17' : `${EXTRAS_NAMES[i - 1]} 2026-09-18`,
    below: i === EXTRAS_NAMES.length - 1 ? 'Midnight 2026-09-19' : `${EXTRAS_NAMES[i + 1]} 2026-09-18`,
    first: i === 0,
    last: i === EXTRAS_NAMES.length - 1,
  }));

  describe.each(ORDERS)('given %s', (_order, arrange) => {
    it.each([...standardCases, ...extrasCases])('$list $english', (c) => {
      const prayers = arrange(c.sequence);
      const target = find(prayers, `${c.english} ${c.day}`);
      const aboveAt = instantOf(c.sequence, c.above).getTime();

      const observed = [-1, 0, 1].map((offset) => {
        const now = new Date(aboveAt + offset);
        return {
          offset,
          display: resolveDisplayDate(prayers, now),
          next: keyOf(findNextReadable(prayers, now)),
          passed: isRowPassed(prayers, target, now),
        };
      });

      expect(observed).toEqual([
        { offset: -1, display: c.first ? c.before : c.day, next: c.above, passed: c.first },
        { offset: 0, display: c.last ? c.after : c.day, next: c.below, passed: c.first },
        { offset: 1, display: c.last ? c.after : c.day, next: c.below, passed: true },
      ]);
      expect(keyOf(findPreviousReadable(prayers, findReadable(prayers, c.below)))).toBe(c.above);
    });

    it.each([...standardCases, ...extrasCases])('$list $english is never next', (c) => {
      const prayers = arrange(c.sequence);
      const nows = c.sequence.flatMap((p) => {
        const instant = p.datetime;
        return instant ? [-1, 0, 1].map((offset) => new Date(instant.getTime() + offset)) : [];
      });
      for (const now of nows) {
        const next = findNextReadable(prayers, now);
        expect(keyOf(next)).not.toBe(`${c.english} ${c.day}`);
        if (next) expect(next.datetime.getTime()).toBeGreaterThan(now.getTime());
      }
    });
  });
});

// =============================================================================
// resolveDisplayDate
// =============================================================================

describe('resolveDisplayDate', () => {
  describe.each(ORDERS)('given %s', (_order, arrange) => {
    it.each([
      ['empty input', [] as Prayer[], at('2026-09-15T11:00:00.000Z'), null],
      [
        'every row passed',
        [...standard('2026-09-14'), ...standard('2026-09-15')],
        at('2026-09-16T11:00:00.000Z'),
        null,
      ],
      [
        'a lone unreadable list day, the day before it',
        blankStandard('2026-09-15'),
        at('2026-09-14T11:00:00.000Z'),
        '2026-09-15',
      ],
      ['a lone unreadable list day, after its end', blankStandard('2026-09-15'), at('2026-09-15T23:00:00.000Z'), null],
      [
        'an earlier list day with no readable row that has already ended',
        [...blankStandard('2026-09-14'), ...standard('2026-09-15')],
        at('2026-09-15T11:00:00.000Z'),
        '2026-09-15',
      ],
      [
        'a partly unreadable list day whose readable rows have all passed',
        [...standard('2026-09-14', ['Magrib', 'Isha']), ...standard('2026-09-15')],
        at('2026-09-14T21:00:00.000Z'),
        '2026-09-15',
      ],
      [
        'a later unreadable list day does not jump the queue',
        [...standard('2026-09-14'), ...blankStandard('2026-09-15')],
        at('2026-09-14T11:00:00.000Z'),
        '2026-09-14',
      ],
      [
        'Extras: a Friday with an unreadable Istijaba moves on after Duha',
        [...extras('2026-09-18', ['Istijaba']), ...extras('2026-09-19')],
        extrasAt('Duha 2026-09-18', 1),
        '2026-09-19',
      ],
      [
        'a readable list day stays after its last row until 00:00 when the next has no readable row',
        [...standard('2026-09-14'), ...blankStandard('2026-09-15')],
        at('2026-09-14T21:00:00.000Z'),
        '2026-09-14',
      ],
      [
        'and that unreadable day comes on at the 00:00',
        [...standard('2026-09-14'), ...blankStandard('2026-09-15')],
        at('2026-09-14T23:00:00.000Z'),
        '2026-09-15',
      ],
      [
        'a readable list day before a day missing from the sequence does not wait',
        [...standard('2026-09-14'), ...standard('2026-09-16')],
        at('2026-09-14T21:00:00.000Z'),
        '2026-09-16',
      ],
      [
        'Extras: a Friday whose last row is Istijaba waits for 00:00 before a Saturday with none',
        [...extras('2026-09-18'), ...blankExtras('2026-09-19')],
        at('2026-09-18T17:10:00.000Z'),
        '2026-09-18',
      ],
    ])('%s', (_label, sequence, now, expected) => {
      expect(resolveDisplayDate(arrange(sequence), now)).toBe(expected);
    });
  });
});

// =============================================================================
// getDisplayHoldEnd
// =============================================================================

describe('getDisplayHoldEnd', () => {
  // Worked out by hand: 00:00 on the following date, less one hour while BST applies at that moment
  const HOLD_ENDS: [string, string][] = [
    ['2026-01-15', '2026-01-16T00:00:00.000Z'],
    ['2026-03-28', '2026-03-29T00:00:00.000Z'],
    ['2026-03-29', '2026-03-29T23:00:00.000Z'],
    ['2026-03-30', '2026-03-30T23:00:00.000Z'],
    ['2026-07-15', '2026-07-15T23:00:00.000Z'],
    ['2026-10-24', '2026-10-24T23:00:00.000Z'],
    ['2026-10-25', '2026-10-26T00:00:00.000Z'],
    ['2026-10-26', '2026-10-27T00:00:00.000Z'],
    ['2026-12-31', '2027-01-01T00:00:00.000Z'],
  ];

  it.each(HOLD_ENDS)('the hand-worked end of %s reads 00:00 on the next London date', (day, iso) => {
    const london = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    const reading = (date: Date) => {
      const parts = Object.fromEntries(london.formatToParts(date).map((p) => [p.type, p.value]));
      return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
    };
    const following = new Date(
      Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)) + 1)
    )
      .toISOString()
      .slice(0, 10);

    expect(reading(at(iso))).toBe(`${following} 00:00:00`);
    expect(reading(at(iso, -1000))).toBe(`${day} 23:59:59`);
  });

  describe.each(ORDERS)('given %s', (_order, arrange) => {
    it.each(HOLD_ENDS)('a Standard list day %s with no readable row ends at %s', (day, iso) => {
      const prayers = arrange([...blankStandard(day), ...standard('2026-09-15')]);
      expect(isoOrNull(getDisplayHoldEnd(prayers, day))).toBe(iso);
    });

    it.each(HOLD_ENDS)('an Extras list day %s with no readable row ends at %s', (day, iso) => {
      const prayers = arrange([...blankExtras(day), ...extras('2026-09-18')]);
      expect(isoOrNull(getDisplayHoldEnd(prayers, day))).toBe(iso);
    });

    it.each([
      ['no list on screen', [...standard('2026-09-15')], null],
      ['no list on screen, empty input', [] as Prayer[], null],
      [
        'a list whose readable rows are all to come, before a readable list day',
        [...standard('2026-09-15'), ...standard('2026-09-16')],
        '2026-09-15',
      ],
      ['a list with only its last row readable', [...standard('2026-09-15', STANDARD_NAMES.slice(0, 5))], '2026-09-15'],
      ['a list with only its first row readable', [...standard('2026-09-15', STANDARD_NAMES.slice(1))], '2026-09-15'],
      [
        'a list before a list day the sequence does not hold',
        [...standard('2026-09-15'), ...blankStandard('2026-09-17')],
        '2026-09-15',
      ],
      [
        'a list with readable rows after its own 00:00, before a list day with none',
        [...standard('2026-09-25'), ...blankStandard('2026-09-26')],
        '2026-09-25',
      ],
    ])('none for %s', (_label, sequence, displayDate) => {
      expect(getDisplayHoldEnd(arrange(sequence), displayDate)).toBeNull();
    });

    it.each([
      [
        'a list whose readable rows are all to come, before a list day with none',
        [...standard('2026-09-15'), ...blankStandard('2026-09-16')],
        '2026-09-15',
        '2026-09-15T23:00:00.000Z',
      ],
      [
        'a Friday Extras list with only Istijaba readable, before a Saturday with none',
        [...extras('2026-09-18', EXTRAS_NAMES.slice(0, 4)), ...blankExtras('2026-09-19')],
        '2026-09-18',
        '2026-09-18T23:00:00.000Z',
      ],
    ])('00:00 at its end for %s', (_label, sequence, displayDate, iso) => {
      expect(isoOrNull(getDisplayHoldEnd(arrange(sequence), displayDate))).toBe(iso);
    });
  });
});

// =============================================================================
// getNextBoundary
// =============================================================================

describe('getNextBoundary', () => {
  describe.each(ORDERS)('given %s', (_order, arrange) => {
    it.each([
      [
        'the hold end, when it comes before the next prayer',
        [...standard('2026-09-14'), ...blankStandard('2026-09-15'), ...standard('2026-09-16')],
        at('2026-09-15T11:00:00.000Z'),
        '2026-09-15T23:00:00.000Z',
      ],
      [
        'the next prayer, when it comes before the hold end',
        [...blankExtras('2026-12-11', true), ...extras('2026-12-12')],
        at('2026-12-11T20:00:00.000Z'),
        '2026-12-11T23:03:00.000Z',
      ],
      [
        'the shared instant, when the next prayer falls exactly at the hold end',
        [
          ...blankExtras('2026-12-11', true),
          row(ScheduleType.Extra, 'Midnight', '2026-12-12', '00:00'),
          ...extras('2026-12-12').slice(1),
        ],
        at('2026-12-11T20:00:00.000Z'),
        '2026-12-12T00:00:00.000Z',
      ],
      [
        'the next prayer, when nothing is held',
        [...standard('2026-09-15'), ...standard('2026-09-16')],
        at('2026-09-15T11:00:00.000Z'),
        '2026-09-15T11:58:00.000Z',
      ],
      [
        'the hold end, when no readable prayer is left',
        [...standard('2026-09-15'), ...blankStandard('2026-09-16')],
        at('2026-09-16T11:00:00.000Z'),
        '2026-09-16T23:00:00.000Z',
      ],
      [
        'the next prayer, not the end of an earlier held day that has gone',
        [...blankStandard('2026-09-15'), ...standard('2026-09-16')],
        at('2026-09-16T11:00:00.000Z'),
        '2026-09-16T11:58:00.000Z',
      ],
      [
        'the end of a passed readable list day, before a list day with none',
        [...standard('2026-09-15'), ...blankStandard('2026-09-16')],
        at('2026-09-15T21:00:00.000Z'),
        '2026-09-15T23:00:00.000Z',
      ],
      [
        'a post-midnight Isha, not the 00:00 before it, ahead of a list day with none',
        [...standard('2026-09-25'), ...blankStandard('2026-09-26')],
        at('2026-09-25T23:50:00.000Z'),
        '2026-09-26T00:30:00.000Z',
      ],
      [
        'the end of the unreadable day, once that post-midnight Isha has handed over',
        [...standard('2026-09-25'), ...blankStandard('2026-09-26')],
        at('2026-09-26T00:40:00.000Z'),
        '2026-09-26T23:00:00.000Z',
      ],
      ['nothing, when every row has passed', [...standard('2026-09-15')], at('2026-09-16T11:00:00.000Z'), null],
      [
        'nothing, after a lone unreadable day has ended',
        blankStandard('2026-09-15'),
        at('2026-09-15T23:00:00.000Z'),
        null,
      ],
      ['nothing, for empty input', [] as Prayer[], at('2026-09-15T11:00:00.000Z'), null],
    ])('%s', (_label, sequence, now, expected) => {
      expect(isoOrNull(getNextBoundary(arrange(sequence), now))).toBe(expected);
    });
  });
});

// =============================================================================
// Random unreadable patterns over a fortnight: every boundary is ahead, and nothing on screen changes before it
// =============================================================================

describe('boundaries over random unreadable patterns across the October 2026 clock change', () => {
  const READINGS: Reading[] = ['05:50', '07:30', '12:45', '15:20', '17:55', '19:20'];
  const DAYS = Array.from({ length: 14 }, (_, i) => `2026-10-${String(18 + i).padStart(2, '0')}`);
  const FIRST_SAMPLE_MS = Date.parse('2026-10-17T20:00:00.000Z');
  const LAST_SAMPLE_MS = Date.parse('2026-11-01T00:00:00.000Z');
  const STEP_MS = 53 * 60 * 1000;

  const followingDate = (date: string): string =>
    new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)) + 1))
      .toISOString()
      .slice(0, 10);

  /**
   * Days in list order. With dashes, a day is missing from the sequence one time in twelve, wholly unreadable one
   * time in four, and otherwise each row is unreadable one time in five. With late nights, Magrib and Isha fall
   * after the day's own 00:00, as at high latitudes in summer.
   */
  const fortnight = (seed: number, dashes: boolean, lateNights: boolean): Prayer[] => {
    let state = seed;
    const random = () => {
      state = (state * 1103515245 + 12345) % 2147483648;
      return state / 2147483648;
    };

    return DAYS.flatMap((day) => {
      if (dashes && random() < 1 / 12) return [];
      const readings: Reading[] = lateNights
        ? [
            ...READINGS.slice(0, 4),
            { clock: '00:10', on: followingDate(day) },
            { clock: '00:40', on: followingDate(day) },
          ]
        : READINGS;
      const wholeDay = dashes && random() < 0.25;
      return STANDARD_NAMES.map((name, i) =>
        row(ScheduleType.Standard, name, day, wholeDay || (dashes && random() < 0.2) ? null : readings[i])
      );
    });
  };

  const samples = (): Date[] => {
    const out: Date[] = [];
    for (let ms = FIRST_SAMPLE_MS; ms <= LAST_SAMPLE_MS; ms += STEP_MS) out.push(new Date(ms));
    return out;
  };

  const SEEDS = Array.from({ length: 16 }, (_, i) => [i + 1, i % 2 === 1] as const);

  it.each(SEEDS)('seed %i, Magrib and Isha after 00:00: %s', (seed, lateNights) => {
    const prayers = fortnight(seed, true, lateNights);

    for (const now of samples()) {
      const display = resolveDisplayDate(prayers, now);
      const boundary = getNextBoundary(prayers, now);
      expect(boundary === null).toBe(display === null);
      if (!boundary || !display) continue;

      expect(boundary.getTime()).toBeGreaterThan(now.getTime());
      const halfway = new Date((now.getTime() + boundary.getTime()) / 2);
      expect(resolveDisplayDate(prayers, halfway)).toBe(display);
      expect(resolveDisplayDate(prayers, new Date(boundary.getTime() - 1))).toBe(display);

      // A list with no readable row left to come is on screen only as a day with none, or as the day before one
      const ownRows = prayers.filter((prayer) => prayer.belongsToDate === display);
      if (!ownRows.some((prayer) => isReadable(prayer) && prayer.datetime > now)) {
        const following = prayers.filter((prayer) => prayer.belongsToDate === followingDate(display));
        const noneOwn = !ownRows.some(isReadable);
        const noneFollowing = following.length > 0 && !following.some(isReadable);
        expect(noneOwn || noneFollowing).toBe(true);
      }

      // A day with no readable time never comes on screen before its own 00:00 while the day before it holds
      // readable rows (R8): the day before keeps its place until then. A day before that is missing from the
      // sequence is not waited for, by design, so across such a gap nothing is asserted
      // (a sequence the store builds has no gap)
      if (!ownRows.some(isReadable)) {
        const dayBefore = DAYS[DAYS.indexOf(display) - 1];
        if (prayers.some((prayer) => prayer.belongsToDate === dayBefore && isReadable(prayer))) {
          expect(now.getTime()).toBeGreaterThanOrEqual(createPrayerDatetime(display, '00:00').getTime());
        }
      }
    }
  });

  it.each([false, true])(
    'with every time readable, the list on screen is always the next prayer’s own list day (late nights: %s)',
    (lateNights) => {
      const prayers = fortnight(1, false, lateNights);

      for (const now of samples()) {
        const next = findNextReadable(prayers, now);
        if (!next) continue;
        expect(resolveDisplayDate(prayers, now)).toBe(next.belongsToDate);
      }
    }
  );
});

// =============================================================================
// isRowPassed
// =============================================================================

describe('isRowPassed', () => {
  describe.each(ORDERS)('given %s', (_order, arrange) => {
    const day = [...standard('2026-09-15')];

    it.each([
      ['1 ms before its moment', -1, false],
      ['at its moment', 0, false],
      ['1 ms after its moment', 1, true],
    ])('a readable row, %s', (_label, offset, expected) => {
      const prayers = arrange(day);
      expect(isRowPassed(prayers, find(prayers, 'Asr 2026-09-15'), standardAt('Asr 2026-09-15', offset))).toBe(
        expected
      );
    });

    it.each([
      ['the week before', at('2026-09-08T11:00:00.000Z')],
      ['midday on the day', at('2026-09-15T11:00:00.000Z')],
      ['the week after', at('2026-09-22T11:00:00.000Z')],
    ])('every row of a list with no readable row, %s', (_label, now) => {
      const prayers = arrange([...blankStandard('2026-09-15'), ...standard('2026-09-16')]);
      for (const english of STANDARD_NAMES) {
        expect(isRowPassed(prayers, find(prayers, `${english} 2026-09-15`), now)).toBe(true);
      }
    });

    it.each([
      ['1 ms before Sunrise', standardAt('Sunrise 2026-09-15', -1), false],
      ['at Sunrise', standardAt('Sunrise 2026-09-15'), false],
      ['1 ms after Sunrise', standardAt('Sunrise 2026-09-15', 1), true],
    ])('two unreadable rows in a row pass together, %s', (_label, now, expected) => {
      const prayers = arrange(standard('2026-09-15', ['Dhuhr', 'Asr']));
      expect(isRowPassed(prayers, find(prayers, 'Dhuhr 2026-09-15'), now)).toBe(expected);
      expect(isRowPassed(prayers, find(prayers, 'Asr 2026-09-15'), now)).toBe(expected);
    });

    it('an unreadable Isha waits for every readable row above it, not just some', () => {
      const prayers = arrange(standard('2026-09-15', ['Isha']));
      expect(isRowPassed(prayers, find(prayers, 'Isha 2026-09-15'), standardAt('Asr 2026-09-15', 1))).toBe(false);
    });

    it('an unreadable first row has nothing to wait for, even while the list before is on screen', () => {
      const prayers = arrange([...standard('2026-09-15'), ...standard('2026-09-16', ['Fajr'])]);
      expect(isRowPassed(prayers, find(prayers, 'Fajr 2026-09-16'), at('2026-09-15T11:00:00.000Z'))).toBe(true);
    });

    it.each([
      ['while the list before still has rows to come', at('2026-09-15T11:00:00.000Z'), false],
      ["once its own list's Fajr has passed", standardAt('Fajr 2026-09-16', 1), true],
    ])('an unreadable Sunrise counts only its own list, %s', (_label, now, expected) => {
      const prayers = arrange([...standard('2026-09-15'), ...standard('2026-09-16', ['Sunrise'])]);
      expect(isRowPassed(prayers, find(prayers, 'Sunrise 2026-09-16'), now)).toBe(expected);
    });

    it('an unreadable Isha does not wait for the next list', () => {
      const prayers = arrange([...standard('2026-09-15', ['Isha']), ...standard('2026-09-16')]);
      expect(isRowPassed(prayers, find(prayers, 'Isha 2026-09-15'), standardAt('Magrib 2026-09-15', 1))).toBe(true);
    });

    it.each([
      ['1 ms before Duha', extrasAt('Duha 2026-09-18', -1), false],
      ['1 ms after Duha', extrasAt('Duha 2026-09-18', 1), true],
    ])('Extras: Istijaba and the next night rows dashed by one Magrib, %s', (_label, now, expected) => {
      const prayers = arrange([
        ...extras('2026-09-18', ['Istijaba']),
        ...extras('2026-09-19', ['Midnight', 'Last Third']),
      ]);
      expect(isRowPassed(prayers, find(prayers, 'Istijaba 2026-09-18'), now)).toBe(expected);
      expect(isRowPassed(prayers, find(prayers, 'Midnight 2026-09-19'), now)).toBe(true);
      expect(isRowPassed(prayers, find(prayers, 'Last Third 2026-09-19'), now)).toBe(true);
      expect(isRowPassed(prayers, find(prayers, 'Suhoor 2026-09-19'), now)).toBe(false);
    });
  });

  it.each([
    ['an unreadable row', row(ScheduleType.Standard, 'Asr', '2026-09-15', null), at('2026-09-15T11:00:00.000Z'), true],
    [
      'a readable row still to come',
      row(ScheduleType.Standard, 'Asr', '2026-09-15', '16:21'),
      at('2026-09-15T11:00:00.000Z'),
      false,
    ],
    [
      'a readable row gone',
      row(ScheduleType.Standard, 'Asr', '2026-09-15', '16:21'),
      at('2026-09-15T16:00:00.000Z'),
      true,
    ],
  ])('with empty input, %s', (_label, prayer, now, expected) => {
    expect(isRowPassed([], prayer, now)).toBe(expected);
  });
});

// =============================================================================
// findPreviousReadable
// =============================================================================

describe('findPreviousReadable', () => {
  describe.each(ORDERS)('given %s', (_order, arrange) => {
    it.each([
      [
        'the row above next on its own list',
        [...standard('2026-09-14'), ...standard('2026-09-15'), ...standard('2026-09-16')],
        'Asr 2026-09-15',
        'Dhuhr 2026-09-15',
      ],
      [
        'rows after next are ignored, on its list and later ones',
        [...standard('2026-09-14'), ...standard('2026-09-15'), ...standard('2026-09-16')],
        'Sunrise 2026-09-15',
        'Fajr 2026-09-15',
      ],
      [
        "the list before's last row, for next's first row",
        [...standard('2026-09-14'), ...standard('2026-09-15'), ...standard('2026-09-16')],
        'Fajr 2026-09-15',
        'Isha 2026-09-14',
      ],
      [
        'an unreadable Magrib is passed over',
        [...standard('2026-09-14'), ...standard('2026-09-15', ['Magrib']), ...standard('2026-09-16')],
        'Isha 2026-09-15',
        'Asr 2026-09-15',
      ],
      [
        'two unreadable rows are passed over',
        [...standard('2026-09-15', ['Dhuhr', 'Asr'])],
        'Magrib 2026-09-15',
        'Sunrise 2026-09-15',
      ],
      [
        'an unreadable Fajr reaches into the list before',
        [...standard('2026-09-14'), ...standard('2026-09-15', ['Fajr'])],
        'Sunrise 2026-09-15',
        'Isha 2026-09-14',
      ],
      [
        'unreadable rows on both lists are passed over',
        [...standard('2026-09-14', ['Magrib', 'Isha']), ...standard('2026-09-15', ['Fajr'])],
        'Sunrise 2026-09-15',
        'Asr 2026-09-14',
      ],
      [
        "an unreadable list before is not crossed to an older list's row",
        [...standard('2026-09-14'), ...blankStandard('2026-09-15'), ...standard('2026-09-16')],
        'Fajr 2026-09-16',
        null,
      ],
      [
        "a missing list before is not crossed to an older list's row",
        [...standard('2026-09-14'), ...standard('2026-09-16')],
        'Fajr 2026-09-16',
        null,
      ],
      [
        'no readable row above next and an unreadable list before',
        [...standard('2026-09-14'), ...blankStandard('2026-09-15'), ...standard('2026-09-16', ['Fajr'])],
        'Sunrise 2026-09-16',
        null,
      ],
      [
        'session 7: an unreadable Isha leaves the 00:40 Magrib',
        [...standard('2026-09-24'), ...standard('2026-09-25', ['Isha']), ...standard('2026-09-26')],
        'Fajr 2026-09-26',
        'Magrib 2026-09-25',
      ],
      ['across a year', [...standard('2026-12-31'), ...standard('2027-01-01')], 'Fajr 2027-01-01', 'Isha 2026-12-31'],
      [
        'Extras: dashed night rows reach the list before',
        [...extras('2026-09-17'), ...extras('2026-09-18', ['Midnight', 'Last Third'])],
        'Suhoor 2026-09-18',
        'Duha 2026-09-17',
      ],
      [
        "Extras: a Friday's Istijaba is the list before's last row",
        [...extras('2026-09-18'), ...extras('2026-09-19', ['Midnight', 'Last Third'])],
        'Suhoor 2026-09-19',
        'Istijaba 2026-09-18',
      ],
      [
        'Extras: one Magrib dashing Istijaba and the next night',
        [...extras('2026-09-18', ['Istijaba']), ...extras('2026-09-19', ['Midnight', 'Last Third'])],
        'Suhoor 2026-09-19',
        'Duha 2026-09-18',
      ],
    ])('%s', (_label, sequence, nextKey, expected) => {
      const prayers = arrange(sequence);
      expect(keyOf(findPreviousReadable(prayers, findReadable(prayers, nextKey)))).toBe(expected);
    });

    it('the list before on its own, as the store adds it from storage', () => {
      const next = findReadable(standard('2026-09-15'), 'Fajr 2026-09-15');
      expect(keyOf(findPreviousReadable(arrange(standard('2026-09-14')), next))).toBe('Isha 2026-09-14');
    });

    it('a row at the same instant as next is not before it', () => {
      const prayers = arrange([
        ...standard('2026-09-15').filter((p) => p.english !== 'Dhuhr'),
        row(ScheduleType.Standard, 'Dhuhr', '2026-09-15', '16:21'),
      ]);
      expect(keyOf(findPreviousReadable(prayers, findReadable(prayers, 'Asr 2026-09-15')))).toBe('Sunrise 2026-09-15');
    });

    it('two rows tied at the latest instant give that instant', () => {
      const prayers = arrange([
        ...standard('2026-09-15').filter((p) => p.english !== 'Asr'),
        row(ScheduleType.Standard, 'Asr', '2026-09-15', '12:58'),
      ]);
      const previous = findPreviousReadable(prayers, findReadable(prayers, 'Magrib 2026-09-15'));
      expect(previous?.datetime.toISOString()).toBe('2026-09-15T11:58:00.000Z');
      expect(['Dhuhr', 'Asr']).toContain(previous?.english);
    });
  });

  it('nothing, for empty input', () => {
    expect(findPreviousReadable([], findReadable(standard('2026-09-15'), 'Asr 2026-09-15'))).toBeNull();
  });
});

// =============================================================================
// findNextOccurrence
// =============================================================================

describe('findNextOccurrence', () => {
  describe.each(ORDERS)('given %s', (_order, arrange) => {
    it.each([
      [
        'the same prayer on the next list day',
        [...standard('2026-09-14'), ...standard('2026-09-15'), ...standard('2026-09-16')],
        'Asr 2026-09-14',
        'Asr 2026-09-15',
        true,
      ],
      [
        'an unreadable occurrence is still the one',
        [...standard('2026-09-14'), ...standard('2026-09-15', ['Asr']), ...standard('2026-09-16')],
        'Asr 2026-09-14',
        'Asr 2026-09-15',
        false,
      ],
      [
        'from an unreadable row',
        [...standard('2026-09-14'), ...standard('2026-09-15', ['Asr']), ...standard('2026-09-16')],
        'Asr 2026-09-15',
        'Asr 2026-09-16',
        true,
      ],
      [
        'into a fully unreadable list day',
        [...standard('2026-09-14'), ...blankStandard('2026-09-15'), ...standard('2026-09-16')],
        'Isha 2026-09-14',
        'Isha 2026-09-15',
        false,
      ],
      [
        'the earliest later list day when the next is missing',
        [...standard('2026-09-14'), ...standard('2026-09-16'), ...standard('2026-09-17')],
        'Asr 2026-09-14',
        'Asr 2026-09-16',
        true,
      ],
      [
        'none on the last list day',
        [...standard('2026-09-14'), ...standard('2026-09-15'), ...standard('2026-09-16')],
        'Asr 2026-09-16',
        null,
        null,
      ],
      [
        'earlier list days are ignored',
        [...standard('2026-09-13'), ...standard('2026-09-14'), ...standard('2026-09-15')],
        'Asr 2026-09-15',
        null,
        null,
      ],
      ['the row itself on its own list day is ignored', standard('2026-09-15'), 'Asr 2026-09-15', null, null],
      [
        'other prayers on later list days are ignored',
        [...extras('2026-09-18'), ...extras('2026-09-19')],
        'Istijaba 2026-09-18',
        null,
        null,
      ],
      [
        "Friday's Istijaba finds next Friday's",
        [...extras('2026-09-18'), ...extras('2026-09-19'), ...blankExtras('2026-09-25', true)],
        'Istijaba 2026-09-18',
        'Istijaba 2026-09-25',
        false,
      ],
    ])('%s', (_label, sequence, fromKey, expected, readable) => {
      const prayers = arrange(sequence);
      const found = findNextOccurrence(prayers, find(prayers, fromKey));
      expect(keyOf(found)).toBe(expected);
      expect(found ? isReadable(found) : null).toBe(readable);
    });
  });

  it('nothing, for empty input', () => {
    expect(findNextOccurrence([], row(ScheduleType.Standard, 'Asr', '2026-09-15', null))).toBeNull();
  });
});
