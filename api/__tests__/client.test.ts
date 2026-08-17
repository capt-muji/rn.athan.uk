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

// Import after mocks
import { fetchYear } from '../client';

import { IApiSingleTime } from '@/shared/types';

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

    // Derived prayer times calculated
    expect(result[0].midnight).toBeDefined();
    expect(result[0]['last third']).toBeDefined();
    expect(result[0].suhoor).toBeDefined();
    expect(result[0].duha).toBeDefined();
    expect(result[0].istijaba).toBeDefined();
  });
});
