/**
 * Unit tests for api/client.ts
 *
 * - The year download: HTTP and empty-payload failures, the request, the mock and preview paths
 * - Per-field validation: an unreadable time becomes null on its own day and nothing else moves,
 *   spanning every field, every malformed shape and every position in a multi-day payload, on the
 *   real clock and at 00:30 BST, where a UTC date is yesterday in London
 * - The single-day request (R13): its URL, its refusals, and the same pipeline as the year
 *
 * Fixture rule: a single-day payload cannot tell "nulled one field" from "dropped the day", which is
 * how finding 8 shipped broken, so every validation case here carries several days.
 */

// =============================================================================
// MOCK SETUP (must be before imports)
// =============================================================================

// Mock Database (imported transitively via shared/prayer)
jest.mock('@/stores/database', () => ({
  getPrayerByDate: jest.fn(),
  saveAllPrayers: jest.fn(),
  markYearAsFetched: jest.fn(),
  clearAllExcept: jest.fn(),
  getItem: jest.fn(),
}));

// Mock logger (env helpers control the real-fetch vs mock-data path)
const mockIsProd = jest.fn();
const mockIsPreview = jest.fn();

jest.mock('@/shared/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  isProd: (value: boolean) => mockIsProd(value),
  isPreview: (value: boolean) => mockIsPreview(value),
}));

import { formatInTimeZone } from 'date-fns-tz';

import { API_CONFIG } from '@/api/config';
import { MOCK_DATA_SIMPLE } from '@/mocks/simple';
import { PRAYER_TIMEZONE } from '@/shared/constants';
import logger from '@/shared/logger';
import type { IApiSingleTime, ISingleApiResponseTransformed } from '@/shared/types';

// Import after mocks
import { fetchDay, fetchYear } from '../client';

// =============================================================================
// TEST HELPERS
// =============================================================================

const DAY_MS = 86_400_000;

/** London's calendar date now, read with date-fns-tz so shared/time.ts is not its own oracle */
const londonToday = () => formatInTimeZone(Date.now(), PRAYER_TIMEZONE, 'yyyy-MM-dd');

/**
 * Calendar arithmetic on the date string. Adding 24 hours to an instant instead skips or repeats a
 * London date across the clock changes, which would make "yesterday" fall outside the date filter.
 */
const londonDate = (days = 0) =>
  new Date(Date.parse(`${londonToday()}T12:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/** A readable day; `minute` makes each day's times distinct, so one day's values cannot pass for another's */
const createMockTime = (date: string, minute = 0): IApiSingleTime => ({
  date,
  fajr: `06:0${minute}`,
  fajr_jamat: '06:30',
  sunrise: `07:3${minute}`,
  dhuhr: `12:3${minute}`,
  dhuhr_jamat: '13:00',
  asr: `15:0${minute}`,
  asr_2: '15:30',
  asr_jamat: '15:45',
  magrib: `17:3${minute}`,
  magrib_jamat: '17:35',
  isha: `19:0${minute}`,
  isha_jamat: '19:15',
});

/** What the pipeline must make of createMockTime(date, minute), written out rather than computed */
const expectedDay = (date: string, minute = 0): ISingleApiResponseTransformed => ({
  date,
  fajr: `06:0${minute}`,
  sunrise: `07:3${minute}`,
  dhuhr: `12:3${minute}`,
  asr: `15:0${minute}`,
  magrib: `17:3${minute}`,
  isha: `19:0${minute}`,
  suhoor: `05:4${minute}`,
  duha: `07:5${minute}`,
  istijaba: `16:3${minute}`,
});

const ALL_NULL = {
  fajr: null,
  sunrise: null,
  dhuhr: null,
  asr: null,
  magrib: null,
  isha: null,
  suhoor: null,
  duha: null,
  istijaba: null,
};

const createResponse = (payload: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => payload,
});

const respondWith = (payload: unknown) => {
  global.fetch = jest.fn().mockResolvedValue(createResponse(payload));
};

const payloadOf = (times: Record<string, unknown>) => ({ city: 'london', times });

const REQUIRED_FIELDS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'] as const;
type RequiredField = (typeof REQUIRED_FIELDS)[number];

/** The derived time that must follow its source to null */
const DERIVED_FROM: Partial<Record<RequiredField, 'suhoor' | 'duha' | 'istijaba'>> = {
  fajr: 'suhoor',
  sunrise: 'duha',
  magrib: 'istijaba',
};

const MISSING = Symbol('key missing');

/** Every shape the owner's definition calls broken (finding 69), and a few that coerce into looking valid */
const MALFORMED: { label: string; value: unknown }[] = [
  { label: 'the placeholder "-----"', value: '-----' },
  { label: 'an empty string', value: '' },
  { label: 'null', value: null },
  { label: 'a missing key', value: MISSING },
  { label: 'an unpadded hour "7:30"', value: '7:30' },
  { label: 'seconds appended "19:25:00"', value: '19:25:00' },
  { label: 'a leading space " 19:25"', value: ' 19:25' },
  { label: 'a trailing newline', value: '19:25\n' },
  { label: 'the first hour out of range "24:00"', value: '24:00' },
  { label: 'an hour out of range "25:00"', value: '25:00' },
  { label: 'a minute out of range "19:60"', value: '19:60' },
  { label: 'the number 1925', value: 1925 },
  { label: 'letters "abc"', value: 'abc' },
  // RegExp.test stringifies its argument, so these two read as "19:25" to a bare pattern check
  { label: 'an array ["19:25"]', value: ['19:25'] },
  { label: 'an object whose toString is "19:25"', value: { toString: () => '19:25' } },
];

const breakFields = (day: IApiSingleTime, fields: readonly RequiredField[], value: unknown) => {
  const broken: Record<string, unknown> = { ...day };
  for (const field of fields) {
    if (value === MISSING) delete broken[field];
    else broken[field] = value;
  }
  return broken;
};

/** What the warning must carry for a value, as the client stringifies it */
const shown = (value: unknown) => JSON.stringify(value === MISSING ? undefined : value);

const nullFields = (day: ISingleApiResponseTransformed, fields: readonly RequiredField[]) => {
  const result: ISingleApiResponseTransformed = { ...day };
  for (const field of fields) {
    result[field] = null;
    const derived = DERIVED_FROM[field];
    if (derived) result[derived] = null;
  }
  return result;
};

/** Yesterday, today, tomorrow and a day in another season, each with its own times */
const POSITIONS = [
  { position: 'yesterday', offset: -1 },
  { position: 'today', offset: 0 },
  { position: 'tomorrow', offset: 1 },
  { position: 'months away', offset: 200 },
] as const;

const buildWindow = () =>
  POSITIONS.map(({ position, offset }, minute) => ({ position, date: londonDate(offset), minute }));

// =============================================================================
// RESET MOCKS BEFORE EACH TEST
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();

  global.fetch = jest.fn();

  // Route through the real fetch path (not mock data)
  mockIsProd.mockReturnValue(true);
  mockIsPreview.mockReturnValue(true);
});

// =============================================================================
// fetchYear() VALIDATION TESTS
// =============================================================================

describe('fetchYear', () => {
  it('throws when API returns empty times dataset (unpopulated year)', async () => {
    respondWith({ city: 'london', times: {} });

    await expect(fetchYear(2027)).rejects.toThrow('Incomplete data received');
  });

  it('throws when data is null', async () => {
    respondWith(null);

    await expect(fetchYear(2027)).rejects.toThrow('Incomplete data received');
  });

  it('throws on HTTP error status', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        createResponse({ city: 'london', times: { '2027-01-01': createMockTime('2027-01-01') } }, false, 500)
      );

    await expect(fetchYear(2027)).rejects.toThrow('HTTP error! status: 500');
  });

  it('logs and rethrows a request that fails before any response', async () => {
    const failure = new TypeError('Network request failed');
    global.fetch = jest.fn().mockRejectedValue(failure);

    await expect(fetchYear(2027)).rejects.toBe(failure);
    expect(logger.error).toHaveBeenCalledWith('API: Error fetching prayer times', { error: failure, year: 2027 });
  });

  // The URL builder now serves the single-day request too; the year request must not pick up its parameter
  it('asks for the year with 24-hour times and no date', async () => {
    respondWith(payloadOf({ [londonDate()]: createMockTime(londonDate()) }));

    await fetchYear(2027);

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`${API_CONFIG.endpoint}?format=json&key=${API_CONFIG.key}&year=2027&24hours=true`);
    expect(new URL(url).searchParams.has('date')).toBe(false);
    expect(init).toEqual({ method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
  });

  it("asks for London's current year when none is given", async () => {
    respondWith(payloadOf({ [londonDate()]: createMockTime(londonDate()) }));

    await fetchYear();

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(new URL(url).searchParams.get('year')).toBe(londonToday().slice(0, 4));
  });

  it('serves the mock year without a request outside production and preview', async () => {
    mockIsProd.mockReturnValue(false);
    mockIsPreview.mockReturnValue(false);

    const result = await fetchYear(2026);

    expect(global.fetch).not.toHaveBeenCalled();
    const yesterday = londonDate(-1);
    const expectedDates = Object.keys(MOCK_DATA_SIMPLE.times).filter((date) => date >= yesterday);
    expect(result.map((day) => day.date)).toEqual(expectedDates);
  });

  it('requests the year in a preview build', async () => {
    mockIsProd.mockReturnValue(false);
    mockIsPreview.mockReturnValue(true);
    respondWith(payloadOf({ [londonDate()]: createMockTime(londonDate()) }));

    const result = await fetchYear(2026);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual([expectedDay(londonDate())]);
  });
});

// =============================================================================
// fetchYear() DAY-SHAPE TESTS
//
// An unreadable time used to take its whole day out of the payload, and with today's record gone the
// list resolved to tomorrow and showed it as today (finding 70). Each unreadable time is now null on
// its own day, the day is kept, and the payload is rejected only when nothing in it is readable.
// Run twice: on the real clock, and at 00:30 BST, where UTC fixtures used to name the wrong day.
// =============================================================================

const dayShapeSuite = () => {
  describe.each(POSITIONS)('with the unreadable day $position', ({ position }) => {
    const cases = REQUIRED_FIELDS.flatMap((field) => MALFORMED.map(({ label, value }) => ({ field, label, value })));

    it.each(cases)('nulls $field alone when it is $label', async ({ field, value }) => {
      const window = buildWindow();
      const target = window.find((day) => day.position === position)!;
      const times = Object.fromEntries(
        window.map(({ date, minute }) => {
          const day = createMockTime(date, minute);
          return [date, date === target.date ? breakFields(day, [field], value) : day];
        })
      );
      respondWith(payloadOf(times));

      const result = await fetchYear(2026);

      // Every other field of every day, the broken day's included, exactly as a clean payload gives it
      expect(result).toStrictEqual(
        window.map(({ date, minute }) => {
          const day = expectedDay(date, minute);
          return date === target.date ? nullFields(day, [field]) : day;
        })
      );
      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith('API: unreadable prayer time', {
        date: target.date,
        field,
        value: shown(value),
      });
    });
  });

  it('nulls several fields on one day and leaves the rest of that day and every other day alone', async () => {
    const window = buildWindow();
    const today = window[1];
    const times: Record<string, unknown> = Object.fromEntries(
      window.map(({ date, minute }) => [date, createMockTime(date, minute)])
    );
    times[today.date] = { ...createMockTime(today.date, today.minute), fajr: '-----', asr: '', isha: null };
    respondWith(payloadOf(times));

    const result = await fetchYear(2026);

    expect(result).toStrictEqual(
      window.map(({ date, minute }) =>
        date === today.date ? nullFields(expectedDay(date, minute), ['fajr', 'asr', 'isha']) : expectedDay(date, minute)
      )
    );
    expect(logger.warn).toHaveBeenCalledTimes(3);
  });

  it.each(POSITIONS)(
    'keeps $position when all six of its times are unreadable, every time null',
    async ({ position }) => {
      const window = buildWindow();
      const target = window.find((day) => day.position === position)!;
      const times = Object.fromEntries(
        window.map(({ date, minute }) => {
          const day = createMockTime(date, minute);
          return [date, date === target.date ? breakFields(day, REQUIRED_FIELDS, '-----') : day];
        })
      );
      respondWith(payloadOf(times));

      const result = await fetchYear(2026);

      expect(result).toStrictEqual(
        window.map(({ date, minute }) => (date === target.date ? { date, ...ALL_NULL } : expectedDay(date, minute)))
      );
      expect(logger.warn).toHaveBeenCalledTimes(6);
    }
  );

  it('keeps a day that arrives with no times at all', async () => {
    const window = buildWindow();
    const today = window[1];
    const times: Record<string, unknown> = Object.fromEntries(
      window.map(({ date, minute }) => [date, createMockTime(date, minute)])
    );
    times[today.date] = null;
    respondWith(payloadOf(times));

    const result = await fetchYear(2026);

    expect(result).toStrictEqual(
      window.map(({ date, minute }) => (date === today.date ? { date, ...ALL_NULL } : expectedDay(date, minute)))
    );
    for (const field of REQUIRED_FIELDS) {
      expect(logger.warn).toHaveBeenCalledWith('API: unreadable prayer time', {
        date: today.date,
        field,
        value: undefined,
      });
    }
  });

  it('rejects the payload when no field on any day is readable', async () => {
    const times = Object.fromEntries(
      buildWindow().map(({ date, minute }) => [
        date,
        breakFields(createMockTime(date, minute), REQUIRED_FIELDS, '-----'),
      ])
    );
    respondWith(payloadOf(times));

    await expect(fetchYear(2026)).rejects.toThrow('Malformed prayer times: nothing in the payload is readable');
  });

  // The boundary of that rejection: one readable time from today on, here on a day in another season, is enough
  it('keeps every day while a single time from today on is readable', async () => {
    const window = buildWindow();
    const far = window[3];
    const times = Object.fromEntries(
      window.map(({ date, minute }) => [date, breakFields(createMockTime(date, minute), REQUIRED_FIELDS, '-----')])
    );
    times[far.date] = { ...times[far.date], dhuhr: '12:33' };
    respondWith(payloadOf(times));

    const result = await fetchYear(2026);

    expect(result).toStrictEqual(
      window.map(({ date }) => (date === far.date ? { date, ...ALL_NULL, dhuhr: '12:33' } : { date, ...ALL_NULL }))
    );
    expect(logger.warn).toHaveBeenCalledTimes(23);
  });

  // Yesterday is kept only for the progress bar, so a format change from today on must not pass on it
  it('rejects the payload when only yesterday is readable', async () => {
    const window = buildWindow();
    const yesterday = window[0];
    const times = Object.fromEntries(
      window.map(({ date, minute }) => {
        const day = createMockTime(date, minute);
        return [date, date === yesterday.date ? day : breakFields(day, REQUIRED_FIELDS, '-----')];
      })
    );
    respondWith(payloadOf(times));

    await expect(fetchYear(2026)).rejects.toThrow('Malformed prayer times: nothing in the payload is readable');
  });

  it('keeps every day when one time today is readable and nothing else is', async () => {
    const window = buildWindow();
    const today = window[1];
    const times: Record<string, unknown> = Object.fromEntries(
      window.map(({ date, minute }) => [date, breakFields(createMockTime(date, minute), REQUIRED_FIELDS, '-----')])
    );
    times[today.date] = { ...(times[today.date] as object), asr: '15:01' };
    respondWith(payloadOf(times));

    const result = await fetchYear(2026);

    expect(result).toStrictEqual(
      window.map(({ date }) => (date === today.date ? { date, ...ALL_NULL, asr: '15:01' } : { date, ...ALL_NULL }))
    );
  });

  // December's next-year download holds no today and no yesterday
  it('rejects a payload of only later days when nothing on them is readable', async () => {
    const tomorrow = londonDate(1);
    const far = londonDate(200);
    respondWith(
      payloadOf({
        [tomorrow]: breakFields(createMockTime(tomorrow), REQUIRED_FIELDS, ''),
        [far]: breakFields(createMockTime(far), REQUIRED_FIELDS, ''),
      })
    );

    await expect(fetchYear(2027)).rejects.toThrow('Malformed prayer times: nothing in the payload is readable');
  });

  it('keeps a payload of only later days when one time on them is readable', async () => {
    const tomorrow = londonDate(1);
    const far = londonDate(200);
    respondWith(
      payloadOf({
        [tomorrow]: breakFields(createMockTime(tomorrow), REQUIRED_FIELDS, ''),
        [far]: { ...breakFields(createMockTime(far), REQUIRED_FIELDS, ''), isha: '19:03' },
      })
    );

    await expect(fetchYear(2027)).resolves.toStrictEqual([
      { date: tomorrow, ...ALL_NULL },
      { date: far, ...ALL_NULL, isha: '19:03' },
    ]);
  });

  // Holding today, or a later day without today, is what takes yesterday out of the judgement
  it.each([
    { label: 'yesterday and today alone', offset: 0 },
    { label: 'yesterday and a later day, without today', offset: 1 },
  ])('rejects a payload of $label when only yesterday is readable', async ({ offset }) => {
    const yesterday = londonDate(-1);
    const later = londonDate(offset);
    respondWith(
      payloadOf({
        [yesterday]: createMockTime(yesterday),
        [later]: breakFields(createMockTime(later), REQUIRED_FIELDS, '-----'),
      })
    );

    await expect(fetchYear(2026)).rejects.toThrow('Malformed prayer times: nothing in the payload is readable');
  });

  // The previous-year download on 1 January filters down to 31 December alone
  it('keeps a payload holding only yesterday when one time on it is readable', async () => {
    const yesterday = londonDate(-1);
    respondWith(
      payloadOf({
        [yesterday]: { ...breakFields(createMockTime(yesterday), REQUIRED_FIELDS, '-----'), magrib: '17:30' },
      })
    );

    await expect(fetchYear(2025)).resolves.toStrictEqual([
      { date: yesterday, ...ALL_NULL, magrib: '17:30', istijaba: '16:30' },
    ]);
  });

  it('rejects a payload holding only yesterday when nothing on it is readable', async () => {
    const yesterday = londonDate(-1);
    respondWith(payloadOf({ [yesterday]: breakFields(createMockTime(yesterday), REQUIRED_FIELDS, '-----') }));

    await expect(fetchYear(2025)).rejects.toThrow('Malformed prayer times: nothing in the payload is readable');
  });

  it('judges readability after the date filter, so a readable day already past cannot carry the payload', async () => {
    const window = buildWindow().slice(0, 3);
    const weekAgo = londonDate(-7);
    const times = Object.fromEntries([
      [weekAgo, createMockTime(weekAgo)],
      ...window.map(({ date, minute }) => [date, breakFields(createMockTime(date, minute), REQUIRED_FIELDS, '')]),
    ]);
    respondWith(payloadOf(times));

    await expect(fetchYear(2026)).rejects.toThrow('Malformed prayer times: nothing in the payload is readable');
  });

  it('discards days before yesterday without validating them', async () => {
    const today = londonDate();
    const weekAgo = londonDate(-7);
    const twoDaysAgo = londonDate(-2);
    respondWith(
      payloadOf({
        [weekAgo]: { ...createMockTime(weekAgo), fajr: '-----' },
        [twoDaysAgo]: createMockTime(twoDaysAgo),
        [today]: createMockTime(today),
      })
    );

    const result = await fetchYear(2026);

    expect(result).toStrictEqual([expectedDay(today)]);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('rejects a payload whose days are all before yesterday as incomplete, not as unreadable', async () => {
    const weekAgo = londonDate(-7);
    respondWith(payloadOf({ [weekAgo]: createMockTime(weekAgo) }));

    await expect(fetchYear(2026)).rejects.toThrow('Incomplete data received');
  });

  // Finding 70: plausibility is a different feature, and this session must not smuggle it in
  it('leaves a well-formed but implausible day of six 00:00s exactly as it came', async () => {
    const window = buildWindow();
    const today = window[1];
    const times: Record<string, unknown> = Object.fromEntries(
      window.map(({ date, minute }) => [date, createMockTime(date, minute)])
    );
    times[today.date] = breakFields(createMockTime(today.date), REQUIRED_FIELDS, '00:00');
    respondWith(payloadOf(times));

    const result = await fetchYear(2026);

    expect(result[1]).toStrictEqual({
      date: today.date,
      fajr: '00:00',
      sunrise: '00:00',
      dhuhr: '00:00',
      asr: '00:00',
      magrib: '00:00',
      isha: '00:00',
      suhoor: '23:40',
      duha: '00:20',
      istijaba: '23:00',
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  // The string check added in front of the pattern must not turn a real HH:mm away at either edge
  it.each(['00:00', '00:59', '09:59', '10:00', '19:59', '20:00', '23:00', '23:59'])(
    'reads %s as a time',
    async (value) => {
      const window = buildWindow();
      const today = window[1];
      const times = Object.fromEntries(window.map(({ date, minute }) => [date, createMockTime(date, minute)]));
      times[today.date] = { ...createMockTime(today.date, today.minute), dhuhr: value };
      respondWith(payloadOf(times));

      const result = await fetchYear(2026);

      expect(result[1]).toStrictEqual({ ...expectedDay(today.date, today.minute), dhuhr: value });
      expect(logger.warn).not.toHaveBeenCalled();
    }
  );

  it('keeps the days of a polar-summer run of "-----", with only those times null', async () => {
    const today = londonDate();
    const times: Record<string, unknown> = { [today]: createMockTime(today) };
    const polar: string[] = [];
    for (let offset = 100; offset < 160; offset++) {
      const date = londonDate(offset);
      polar.push(date);
      times[date] = { ...createMockTime(date), sunrise: '-----', magrib: '-----' };
    }
    respondWith({ city: 'tromso', times });

    const result = await fetchYear(2026);

    expect(result).toStrictEqual([
      expectedDay(today),
      ...polar.map((date) => nullFields(expectedDay(date), ['sunrise', 'magrib'])),
    ]);
    expect(logger.warn).toHaveBeenCalledTimes(120);
  });
};

describe('fetchYear day shape, on the real clock', () => {
  dayShapeSuite();
});

describe('fetchYear day shape, at 00:30 BST on 14 September (23:30 UTC on the 13th)', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: Date.parse('2026-09-13T23:30:00Z') });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // The control point: without it a clock that failed to pin would rerun the real-clock suite
  it('is a different calendar day in London than in UTC', () => {
    expect(londonDate()).toBe('2026-09-14');
    expect(new Date().toISOString().slice(0, 10)).toBe('2026-09-13');
  });

  dayShapeSuite();
});

// =============================================================================
// fetchYear() DERIVED TIMES, END TO END
// =============================================================================

describe('fetchYear derived times', () => {
  const combinations = [0, 1, 2, 3, 4, 5, 6, 7].map((mask) => ({
    fajr: Boolean(mask & 1),
    sunrise: Boolean(mask & 2),
    magrib: Boolean(mask & 4),
  }));

  it.each(combinations)(
    'fajr unreadable $fajr, sunrise $sunrise, magrib $magrib: suhoor, duha and istijaba follow',
    async (broken) => {
      const window = buildWindow();
      const today = window[1];
      const brokenFields = REQUIRED_FIELDS.filter((field) => broken[field as keyof typeof broken]);
      const times: Record<string, unknown> = Object.fromEntries(
        window.map(({ date, minute }) => [date, createMockTime(date, minute)])
      );
      times[today.date] = breakFields(createMockTime(today.date, today.minute), brokenFields, 'x');
      respondWith(payloadOf(times));

      const result = await fetchYear(2026);
      const day = result.find((entry) => entry.date === today.date)!;

      expect(day.suhoor === null).toBe(day.fajr === null);
      expect(day.duha === null).toBe(day.sunrise === null);
      expect(day.istijaba === null).toBe(day.magrib === null);
      expect(day.fajr === null).toBe(broken.fajr);
      expect(day.sunrise === null).toBe(broken.sunrise);
      expect(day.magrib === null).toBe(broken.magrib);
      expect(day).toStrictEqual(nullFields(expectedDay(today.date, today.minute), brokenFields));
    }
  );
});

// =============================================================================
// fetchYear() TRANSFORMATION TESTS
// =============================================================================

describe('fetchYear transformation', () => {
  it('returns filtered and transformed data for a populated year', async () => {
    const today = londonDate();
    const tomorrow = londonDate(1);
    const weekAgo = londonDate(-7);

    respondWith(
      payloadOf({
        [weekAgo]: createMockTime(weekAgo),
        [today]: createMockTime(today),
        [tomorrow]: createMockTime(tomorrow, 5),
      })
    );

    const result = await fetchYear(2026);

    // Past dates filtered out, recent dates kept. Midnight and Last Third are never stored: they
    // belong to the night before a day and are worked out when lists are built, and a strict match
    // fails on any extra key
    expect(result).toStrictEqual([expectedDay(today), expectedDay(tomorrow, 5)]);
  });
});

// =============================================================================
// fetchDay()
// =============================================================================

describe('fetchDay', () => {
  const fetchDaySuite = () => {
    it('asks the endpoint for that one day, with 24-hour times and no year', async () => {
      const today = londonDate();
      respondWith(createMockTime(today));

      await fetchDay(today);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe(`${API_CONFIG.endpoint}?format=json&key=${API_CONFIG.key}&date=${today}&24hours=true`);
      const params = new URL(url).searchParams;
      expect(params.get('date')).toBe(today);
      expect(params.get('24hours')).toBe('true');
      expect(params.has('year')).toBe(false);
      expect(init).toEqual({ method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
    });

    it.each([
      { label: 'yesterday, the 31 December asked for on 1 January', offset: -1 },
      { label: 'today', offset: 0 },
      { label: 'tomorrow', offset: 1 },
    ])('returns $label, transformed', async ({ offset }) => {
      const date = londonDate(offset);
      respondWith(createMockTime(date, 7));

      await expect(fetchDay(date)).resolves.toStrictEqual(expectedDay(date, 7));
      expect(logger.info).toHaveBeenCalledWith('API: Prayer times fetched for day', { date });
    });

    it('rejects a day the date filter discards', async () => {
      const twoDaysAgo = londonDate(-2);
      respondWith(createMockTime(twoDaysAgo));

      await expect(fetchDay(twoDaysAgo)).rejects.toThrow('Incomplete data received');
    });
  };

  describe('on the real clock', () => {
    fetchDaySuite();
  });

  describe('at 00:30 BST on 14 September (23:30 UTC on the 13th)', () => {
    beforeEach(() => {
      jest.useFakeTimers({ now: Date.parse('2026-09-13T23:30:00Z') });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    fetchDaySuite();
  });

  it('rejects a date the endpoint does not serve (HTTP 404)', async () => {
    const date = londonDate(-1);
    global.fetch = jest.fn().mockResolvedValue(createResponse({ error: 'No data found' }, false, 404));

    await expect(fetchDay(date)).rejects.toThrow('HTTP error! status: 404');
    expect(logger.error).toHaveBeenCalledWith('API: Error fetching prayer times for day', {
      error: expect.any(Error),
      date,
    });
  });

  it('rejects when the request itself fails', async () => {
    const failure = new TypeError('Network request failed');
    global.fetch = jest.fn().mockRejectedValue(failure);

    await expect(fetchDay(londonDate())).rejects.toBe(failure);
  });

  // The endpoint answers one day as a flat object with no `times` key; read as a year it would look empty
  it('accepts the flat single-day answer rather than rejecting it as an empty year', async () => {
    const today = londonDate();
    const body = createMockTime(today);
    expect(body).not.toHaveProperty('times');
    respondWith(body);

    await expect(fetchDay(today)).resolves.toStrictEqual(expectedDay(today));
  });

  // The body is stored under the requested key, so another day's times would otherwise land as this day's
  it.each([
    { label: "today's times when yesterday was asked for", asked: -1, answered: 0 },
    { label: "yesterday's times when today was asked for", asked: 0, answered: -1 },
    { label: "tomorrow's times when today was asked for", asked: 0, answered: 1 },
  ])('rejects $label, and returns nothing', async ({ asked, answered }) => {
    const askedDate = londonDate(asked);
    const answeredDate = londonDate(answered);
    respondWith(createMockTime(answeredDate));

    let returned: unknown;
    await expect(
      fetchDay(askedDate).then((day) => {
        returned = day;
      })
    ).rejects.toThrow(`Day response is for "${answeredDate}", not ${askedDate}`);
    expect(returned).toBeUndefined();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalledWith('API: Prayer times fetched for day', expect.anything());
  });

  it('rejects the right day written in another format', async () => {
    const today = londonDate();
    const reformatted = today.split('-').reverse().join('/');
    respondWith(createMockTime(reformatted));

    await expect(fetchDay(today)).rejects.toThrow(`Day response is for "${reformatted}", not ${today}`);
  });

  // A single day of yesterday is judged on yesterday; nothing readable on it is still a rejection
  it('rejects yesterday when nothing on it is readable', async () => {
    const yesterday = londonDate(-1);
    respondWith(breakFields(createMockTime(yesterday), REQUIRED_FIELDS, '-----'));

    await expect(fetchDay(yesterday)).rejects.toThrow('Malformed prayer times: nothing in the payload is readable');
  });

  it('rejects a body with no date', async () => {
    const today = londonDate();
    const { date: _date, ...undated } = createMockTime(today);
    respondWith(undated);

    await expect(fetchDay(today)).rejects.toThrow(`Day response is for undefined, not ${today}`);
  });

  it('rejects an empty body', async () => {
    respondWith(null);

    await expect(fetchDay(londonDate())).rejects.toThrow('Day response is for undefined');
  });

  const cases = REQUIRED_FIELDS.flatMap((field) => MALFORMED.map(({ label, value }) => ({ field, label, value })));

  it.each(cases)('keeps the day with $field null when it is $label', async ({ field, value }) => {
    const today = londonDate();
    respondWith(breakFields(createMockTime(today, 4), [field], value));

    await expect(fetchDay(today)).resolves.toStrictEqual(nullFields(expectedDay(today, 4), [field]));
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith('API: unreadable prayer time', {
      date: today,
      field,
      value: shown(value),
    });
  });

  it('keeps the day when all but one time is unreadable', async () => {
    const today = londonDate();
    respondWith({ ...breakFields(createMockTime(today), REQUIRED_FIELDS, '-----'), isha: '19:00' });

    await expect(fetchDay(today)).resolves.toStrictEqual({ date: today, ...ALL_NULL, isha: '19:00' });
  });

  it('rejects a day with nothing readable', async () => {
    const today = londonDate();
    respondWith(breakFields(createMockTime(today), REQUIRED_FIELDS, '-----'));

    await expect(fetchDay(today)).rejects.toThrow('Malformed prayer times: nothing in the payload is readable');
  });

  it('requests the day in a preview build', async () => {
    mockIsProd.mockReturnValue(false);
    mockIsPreview.mockReturnValue(true);
    const today = londonDate();
    respondWith(createMockTime(today));

    await expect(fetchDay(today)).resolves.toStrictEqual(expectedDay(today));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  describe('outside production and preview', () => {
    beforeEach(() => {
      mockIsProd.mockReturnValue(false);
      mockIsPreview.mockReturnValue(false);
    });

    const lastMockDate = () => Object.keys(MOCK_DATA_SIMPLE.times).at(-1)!;

    it('serves the mock day without a request, exactly as the mock year gives it', async () => {
      const date = lastMockDate();

      const day = await fetchDay(date);

      expect(global.fetch).not.toHaveBeenCalled();
      const raw = MOCK_DATA_SIMPLE.times[date];
      for (const field of REQUIRED_FIELDS) expect(day[field]).toBe(raw[field]);
      expect(day).toStrictEqual((await fetchYear()).find((entry) => entry.date === date));
    });

    it('sends the mock day through validation', async () => {
      const date = lastMockDate();
      const raw = MOCK_DATA_SIMPLE.times[date];
      const original = raw.asr;
      raw.asr = '-----';

      try {
        const day = await fetchDay(date);

        expect(day.asr).toBeNull();
        expect(day.fajr).toBe(raw.fajr);
        expect(logger.warn).toHaveBeenCalledWith('API: unreadable prayer time', {
          date,
          field: 'asr',
          value: '"-----"',
        });
      } finally {
        raw.asr = original;
      }
    });

    it('rejects a day the mock does not have', async () => {
      await expect(fetchDay('2099-01-01')).rejects.toThrow('Mock data has no day 2099-01-01');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
