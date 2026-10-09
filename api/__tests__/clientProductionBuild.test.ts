/**
 * Which builds of api/client.ts ask the real endpoint
 *
 * client.test.ts routes to the endpoint with isProd() and isPreview() both true, a pair no build ever
 * has, so nothing there shows that a production build, where only isProd() is true, requests real
 * times rather than serving the mock. This file runs each real build's pair. The clock is pinned only
 * so the dates are fixed; how the client reads London's date is covered by client.test.ts.
 */

jest.mock('@/stores/database', () => ({
  getPrayerByDate: jest.fn(),
  saveAllPrayers: jest.fn(),
  markYearAsFetched: jest.fn(),
  clearAllExcept: jest.fn(),
  getItem: jest.fn(),
}));

const mockIsProd = jest.fn();
const mockIsPreview = jest.fn();

jest.mock('@/shared/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  isProd: () => mockIsProd(),
  isPreview: () => mockIsPreview(),
}));

import { API_CONFIG } from '@/api/config';

import { fetchDay, fetchYear } from '../client';

const PINNED_INSTANT = '2026-09-14T11:00:00Z';
const TODAY = '2026-09-14';

/** Times no mock day carries, so a result built from the mock cannot pass for this payload */
const endpointDay = (date: string) => ({
  date,
  fajr: '04:47',
  fajr_jamat: '05:15',
  sunrise: '06:31',
  dhuhr: '12:53',
  dhuhr_jamat: '13:30',
  asr: '16:29',
  asr_2: '17:02',
  asr_jamat: '17:15',
  magrib: '19:13',
  magrib_jamat: '19:18',
  isha: '20:41',
  isha_jamat: '21:00',
});

const expectedDay = (date: string) => ({
  date,
  fajr: '04:47',
  sunrise: '06:31',
  dhuhr: '12:53',
  asr: '16:29',
  magrib: '19:13',
  isha: '20:41',
  suhoor: '04:27',
  duha: '06:51',
  istijaba: '18:13',
});

const respondWith = (payload: unknown) => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => payload });
};

const BUILDS = [
  { build: 'production', prod: true, preview: false },
  { build: 'preview', prod: false, preview: true },
];

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ now: Date.parse(PINNED_INSTANT) });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('fetchYear by build', () => {
  it.each(BUILDS)('a $build build requests the year and returns its days', async ({ prod, preview }) => {
    mockIsProd.mockReturnValue(prod);
    mockIsPreview.mockReturnValue(preview);
    respondWith({ city: 'london', times: { [TODAY]: endpointDay(TODAY) } });

    const result = await fetchYear(2026);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`${API_CONFIG.endpoint}?format=json&key=${API_CONFIG.key}&year=2026&24hours=true`);
    expect(result).toStrictEqual([expectedDay(TODAY)]);
  });
});

describe('fetchDay by build', () => {
  it.each(BUILDS)('a $build build requests the day and returns it', async ({ prod, preview }) => {
    mockIsProd.mockReturnValue(prod);
    mockIsPreview.mockReturnValue(preview);
    respondWith(endpointDay(TODAY));

    const result = await fetchDay(TODAY);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`${API_CONFIG.endpoint}?format=json&key=${API_CONFIG.key}&date=${TODAY}&24hours=true`);
    expect(result).toStrictEqual(expectedDay(TODAY));
  });
});
