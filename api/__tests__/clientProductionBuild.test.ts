/**
 * Which builds of api/client.ts ask the real endpoint
 *
 * client.test.ts routes to the endpoint with isProd() and isPreview() both true, a pair no build ever
 * has, so nothing there shows that a production build, where only isProd() is true, requests real
 * times rather than serving the mock. This file runs each real build's pair, on a pinned clock.
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

import { formatInTimeZone } from 'date-fns-tz';

import { API_CONFIG } from '@/api/config';
import { PRAYER_TIMEZONE } from '@/shared/constants';

import { fetchDay, fetchYear } from '../client';

/** London's date at the pinned instant, from date-fns-tz so shared/time.ts is not its own oracle */
const londonToday = () => formatInTimeZone(Date.now(), PRAYER_TIMEZONE, 'yyyy-MM-dd');

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

const INSTANTS = [
  { label: '00:30 BST on 14 September', iso: '2026-09-13T23:30:00Z' },
  { label: '23:59:41 BST on 14 September', iso: '2026-09-14T22:59:41Z' },
  { label: 'midday GMT on 15 January', iso: '2026-01-15T12:00:00Z' },
];

const CASES = BUILDS.flatMap((build) => INSTANTS.map((instant) => ({ ...build, ...instant })));

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

const pin = ({ iso, prod, preview }: { iso: string; prod: boolean; preview: boolean }) => {
  jest.useFakeTimers({ now: Date.parse(iso) });
  mockIsProd.mockReturnValue(prod);
  mockIsPreview.mockReturnValue(preview);
};

describe('fetchYear by build', () => {
  it.each(CASES)('a $build build at $label requests the year and returns its days', async (testCase) => {
    pin(testCase);
    const today = londonToday();
    respondWith({ city: 'london', times: { [today]: endpointDay(today) } });

    const result = await fetchYear(2026);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`${API_CONFIG.endpoint}?format=json&key=${API_CONFIG.key}&year=2026&24hours=true`);
    expect(result).toStrictEqual([expectedDay(today)]);
  });
});

describe('fetchDay by build', () => {
  it.each(CASES)('a $build build at $label requests the day and returns it', async (testCase) => {
    pin(testCase);
    const today = londonToday();
    respondWith(endpointDay(today));

    const result = await fetchDay(today);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`${API_CONFIG.endpoint}?format=json&key=${API_CONFIG.key}&date=${today}&24hours=true`);
    expect(result).toStrictEqual(expectedDay(today));
  });
});
