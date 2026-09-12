import { API_CONFIG } from '@/api/config';
import { MOCK_DATA_SIMPLE } from '@/mocks/simple';
import logger, { isPreview, isProd } from '@/shared/logger';
import * as PrayerUtils from '@/shared/prayer';
import * as TimeUtils from '@/shared/time';
import type { IApiResponse, IApiTimes, ISingleApiResponseTransformed } from '@/shared/types';

// Constructs the API URL with required parameters:
// - format (JSON/XML)
// - API key
// - Year
// - 24-hour format flag
const buildApiUrl = (year: number = TimeUtils.getCurrentYear()): string => {
  const queries = [`format=${API_CONFIG.format}`, `key=${API_CONFIG.key}`, `year=${year}`, '24hours=true'].join('&');

  return `${API_CONFIG.endpoint}?${queries}`;
};

// Validates API response:
// 1. Checks HTTP status
// 2. Validates response structure
// 3. Returns typed data if valid
const validateApiResponse = async (response: Response): Promise<IApiResponse> => {
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

  const data: IApiResponse = await response.json();
  // An unpopulated year returns HTTP 200 with an empty `times` object - treat as failure
  if (Object.keys(data?.times ?? {}).length === 0) throw new Error('Incomplete data received');

  return data;
};

/** The six times every list row, notification and derived prayer is built from */
const REQUIRED_TIMES = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'] as const;

/** 24-hour HH:mm, which is the format `24hours=true` asks the endpoint for */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Drops any day the pipeline cannot read, before it reaches MMKV
 *
 * `createPrayerDatetime` turns a malformed time into `new Date(NaN)`, which throws on the
 * first `toISOString()`, and a missing one throws on `split`. Either way the whole day is
 * built before the requested row is picked out, so one bad field takes down every prayer
 * that day rather than only its own.
 *
 * Per DAY, not per response, and that distinction is the whole point. The endpoint returns a
 * year, so rejecting the payload would let one unreadable day months away take down the day
 * the user is standing on — and `updatePrayerData` clears the cache BEFORE it fetches, so a
 * throw here leaves the app with nothing and the same thing happens on every retry. High
 * latitude makes that concrete rather than theoretical: providers emit `"-----"` for a whole
 * polar-summer window, so an all-or-nothing guard would make those cities permanently
 * unusable instead of unusable for the weeks the sun does not set.
 *
 * @param apiData Filtered API response data
 * @returns The same data minus any day that cannot be read
 */
const validateApiTimes = (apiData: IApiResponse): IApiResponse => {
  const readableTimes: IApiTimes = {};
  const today = TimeUtils.getTodayDateString();
  let todayDropped = false;

  for (const [date, times] of Object.entries(apiData.times)) {
    const malformed = REQUIRED_TIMES.find((name) => !TIME_PATTERN.test(times?.[name]));

    if (!malformed) {
      readableTimes[date] = times;
      continue;
    }

    const shown = JSON.stringify(times?.[malformed]);
    logger.warn('API: dropping an unreadable day', { date, field: malformed, value: shown });
    if (date === today) todayDropped = true;
  }

  // Losing a future day degrades the buffer; losing today leaves the app with no times to
  // show at all, which is worth failing loudly for rather than rendering an empty list
  if (todayDropped) throw new Error(`Malformed prayer time: ${today} is unreadable`);
  if (Object.keys(readableTimes).length === 0) throw new Error('Incomplete data received');

  return { city: apiData.city, times: readableTimes };
};

// Fetches raw prayer time data from API
// Uses mock data in non-production environments
// Implements no-cache policy for fresh data
const fetchRawData = async (year?: number): Promise<IApiResponse> => {
  if (!isProd() && !isPreview()) return MOCK_DATA_SIMPLE;

  try {
    const response = await globalThis.fetch(buildApiUrl(year), {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });
    return validateApiResponse(response);
  } catch (error) {
    logger.error('API: Error fetching prayer times', { error, year });
    throw error;
  }
};

// Transforms raw API data for a specific year:
// 1. Fetches raw data
// 2. Filters unnecessary data
// 3. Transforms into application-specific format
const transformYearData = async (targetYear: number): Promise<ISingleApiResponseTransformed[]> => {
  const data = await fetchRawData(targetYear);
  const filteredData = PrayerUtils.filterApiData(data);
  const validatedData = validateApiTimes(filteredData);
  return PrayerUtils.transformApiData(validatedData);
};

// High-level function to get processed prayer data for a specific year
const getYearData = async (year?: number): Promise<ISingleApiResponseTransformed[]> => {
  const targetYear = year || TimeUtils.getCurrentYear();

  try {
    logger.info('API: Fetching prayer times for year', { year: targetYear });
    const data = await transformYearData(targetYear);
    logger.info('API: Data fetched');
    return data;
  } catch (error) {
    logger.error('API: Error processing data', { error });
    throw error;
  }
};

// Fetches prayer times for a specific year
export const fetchYear = async (year?: number): Promise<ISingleApiResponseTransformed[]> => {
  const targetYear = year || TimeUtils.getCurrentYear();
  logger.info('API: Fetching prayer times for year', { year: targetYear });
  const data = await getYearData(targetYear);
  logger.info('API: Prayer times fetched', { year: targetYear });
  return data;
};
