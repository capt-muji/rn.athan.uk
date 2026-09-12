/**
 * Unit tests for api/client.ts
 *
 * Tests fetchYear validation and transformation:
 * - Empty times dataset (unpopulated year) must throw
 * - Malformed responses must throw
 * - HTTP errors must throw
 * - Valid responses are filtered and transformed
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

import type { IApiSingleTime } from '@/shared/types';

// Import after mocks
import { fetchYear } from '../client';

// =============================================================================
// TEST HELPERS
// =============================================================================

const createMockTime = (date: string): IApiSingleTime => ({
  date,
  fajr: '06:00',
  fajr_jamat: '06:30',
  sunrise: '07:30',
  dhuhr: '12:30',
  dhuhr_jamat: '13:00',
  asr: '15:00',
  asr_2: '15:30',
  asr_jamat: '15:45',
  magrib: '17:30',
  magrib_jamat: '17:35',
  isha: '19:00',
  isha_jamat: '19:15',
});

const createResponse = (payload: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => payload,
});

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
    global.fetch = jest.fn().mockResolvedValue(createResponse({ city: 'london', times: {} }));

    await expect(fetchYear(2027)).rejects.toThrow('Incomplete data received');
  });

  it('throws when data is null', async () => {
    global.fetch = jest.fn().mockResolvedValue(createResponse(null));

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
});

// =============================================================================
// fetchYear() DAY-SHAPE TESTS
//
// A malformed or partial day used to reach MMKV and then throw deep in the
// pipeline, taking every prayer that day down with it rather than only its own.
// Each case below is one the sweep reproduced against the unguarded pipeline.
// =============================================================================

describe('fetchYear day shape', () => {
  const today = new Date().toISOString().split('T')[0] as string;

  const payloadWithToday = (times: unknown) => ({ city: 'london', times: { [today]: times } });

  const expectRejection = async (times: unknown, message: string | RegExp) => {
    global.fetch = jest.fn().mockResolvedValue(createResponse(payloadWithToday(times)));

    await expect(fetchYear(2026)).rejects.toThrow(message);
  };

  it('rejects a time that is not zero-padded HH:mm', async () => {
    const day = { ...createMockTime(today), dhuhr: '11:5' };

    await expectRejection(day, 'Malformed prayer time: ' + today + ' dhuhr is "11:5"');
  });

  it('rejects a missing time rather than calling split on undefined', async () => {
    const day: Partial<IApiSingleTime> = { ...createMockTime(today) };
    delete day.isha;

    await expectRejection(day, 'isha is undefined');
  });

  it('rejects a non-time placeholder, which is what high latitude sends for polar day', async () => {
    const day = { ...createMockTime(today), sunrise: '-----' };

    await expectRejection(day, 'sunrise is "-----"');
  });

  it('rejects an out-of-range time', async () => {
    const day = { ...createMockTime(today), magrib: '25:61' };

    await expectRejection(day, 'magrib is "25:61"');
  });

  it('rejects a day with no times at all', async () => {
    await expectRejection(null, 'fajr is undefined');
  });

  it('names the offending day, so the failure is diagnosable from one log line', async () => {
    const day = { ...createMockTime(today), asr: 'x' };

    await expectRejection(day, new RegExp(`Malformed prayer time: ${today} asr is "x"`));
  });

  it('does not reject a past day the app already discards', async () => {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0] as string;
    const payload = {
      city: 'london',
      times: {
        [weekAgo]: { ...createMockTime(weekAgo), fajr: '-----' },
        [today]: createMockTime(today),
      },
    };
    global.fetch = jest.fn().mockResolvedValue(createResponse(payload));

    const result = await fetchYear(2026);

    expect(result.map((p) => p.date)).toEqual([today]);
  });
});

// =============================================================================
// fetchYear() TRANSFORMATION TESTS
// =============================================================================

describe('fetchYear transformation', () => {
  it('returns filtered and transformed data for a populated year', async () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    const payload = {
      city: 'london',
      times: {
        [weekAgo]: createMockTime(weekAgo),
        [today]: createMockTime(today),
        [tomorrow]: createMockTime(tomorrow),
      },
    };
    global.fetch = jest.fn().mockResolvedValue(createResponse(payload));

    const result = await fetchYear(2026);

    // Past dates filtered out, recent dates kept
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.date)).toEqual([today, tomorrow]);

    // Raw prayer times preserved
    expect(result[0]).toMatchObject({
      date: today,
      fajr: '06:00',
      sunrise: '07:30',
      dhuhr: '12:30',
      magrib: '17:30',
      isha: '19:00',
    });

    // Derived prayer times calculated; Midnight and Last Third are never stored —
    // they belong to the night before a day and are worked out when lists are built
    expect(result[0]).not.toHaveProperty('midnight');
    expect(result[0]).not.toHaveProperty('last third');
    expect(result[0].suhoor).toBeDefined();
    expect(result[0].duha).toBeDefined();
    expect(result[0].istijaba).toBeDefined();
  });
});
