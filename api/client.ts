import { API_CONFIG } from '@/api/config';
import { MOCK_DATA_SIMPLE } from '@/mocks/simple';
import logger, { isPreview, isProd } from '@/shared/logger';
import * as PrayerUtils from '@/shared/prayer';
import * as TimeUtils from '@/shared/time';
import type {
  IApiResponse,
  IApiSingleTime,
  ISingleApiResponseTransformed,
  IValidatedApiResponse,
  RequiredTimeName,
} from '@/shared/types';

/**
 * One endpoint answers a whole year (`year=`) or a single day (`date=`), so both requests are built
 * here. `24hours=true` goes on both: without it afternoon times come back in 12-hour form (Dhuhr
 * `01:02` for `13:02`), which still passes TIME_PATTERN, so nothing downstream could catch it.
 */
const buildApiUrl = (period: { year: number } | { date: string }): string => {
  const selector = 'date' in period ? `date=${period.date}` : `year=${period.year}`;
  const queries = [`format=${API_CONFIG.format}`, `key=${API_CONFIG.key}`, selector, '24hours=true'].join('&');

  return `${API_CONFIG.endpoint}?${queries}`;
};

const REQUEST_INIT: RequestInit = { method: 'GET', headers: { 'Cache-Control': 'no-cache' } };

// A date the endpoint does not serve answers 404 with an `error` body, which must not be read as data
const readBody = async <T>(response: Response): Promise<T> => {
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

  return response.json();
};

// Validates API response:
// 1. Checks HTTP status
// 2. Validates response structure
// 3. Returns typed data if valid
const validateApiResponse = async (response: Response): Promise<IApiResponse> => {
  const data = await readBody<IApiResponse>(response);
  // An unpopulated year returns HTTP 200 with an empty `times` object - treat as failure
  if (Object.keys(data?.times ?? {}).length === 0) throw new Error('Incomplete data received');

  return data;
};

/** The six times every list row, notification and derived prayer is built from */
const REQUIRED_TIMES: readonly RequiredTimeName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];

/** 24-hour HH:mm, which is the format `24hours=true` asks the endpoint for */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Marks each time the pipeline cannot read as null, before it reaches MMKV
 *
 * `createPrayerDatetime` turns a malformed time into `new Date(NaN)`, which throws on the first
 * `toISOString()`, and a missing one throws on `split`. Null is the one value every consumer is made
 * to handle, so an unreadable time is stored as that and drawn as `--:--`.
 *
 * Per FIELD, not per day. Dropping the day cost the five readable prayers alongside the bad one, and
 * worse: with the record gone the list resolved to tomorrow and showed tomorrow's times as today's,
 * and the hole made every launch wipe and re-download the year only to drop the same day again
 * (findings 67 and 70). A day with every field unreadable is still kept, so the day is still shown.
 *
 * Only the shape is checked. A well-formed but implausible time, such as six `00:00`s, passes
 * untouched (finding 70), and nothing is ever substituted for a value that fails.
 *
 * It throws only when nothing from today onwards is readable. One day's fault, or a polar-summer run
 * of `"-----"`, leaves the rest usable; every field failing is a format change, and storing that would
 * replace a good cache with a year of dashes. Yesterday does not count towards that, because the date
 * filter keeps it only for the progress bar: a format change from today on, with yesterday still
 * readable, would otherwise be stored. A payload holding no day from today on (31 December alone, on
 * 1 January) is judged on the days it does hold, or it could never pass.
 *
 * @param apiData Filtered API response data
 * @returns Every day that came in, each of its six times a readable HH:mm or null
 */
const validateApiTimes = (apiData: IApiResponse): IValidatedApiResponse => {
  // Nothing survived the date filter, which is a short payload rather than an unreadable one
  if (Object.keys(apiData.times).length === 0) throw new Error('Incomplete data received');

  const today = TimeUtils.getTodayDateString();
  const holdsTodayOrLater = Object.keys(apiData.times).some((date) => date >= today);
  const validatedTimes: IValidatedApiResponse['times'] = {};
  let anyReadable = false;

  for (const [date, times] of Object.entries(apiData.times)) {
    const counts = !holdsTodayOrLater || date >= today;
    const day = {} as Record<RequiredTimeName, string | null>;

    for (const field of REQUIRED_TIMES) {
      const value: unknown = times?.[field];

      // RegExp.test stringifies its argument, so an array such as ['19:25'] would otherwise pass
      if (typeof value === 'string' && TIME_PATTERN.test(value)) {
        day[field] = value;
        if (counts) anyReadable = true;
        continue;
      }

      day[field] = null;
      logger.warn('API: unreadable prayer time', { date, field, value: JSON.stringify(value) });
    }

    validatedTimes[date] = day;
  }

  if (!anyReadable) throw new Error('Malformed prayer times: nothing in the payload is readable');

  return { city: apiData.city, times: validatedTimes };
};

/** The year download and the single-day request go through the same filter, validation and transform */
const processPayload = (data: IApiResponse): ISingleApiResponseTransformed[] => {
  const filteredData = PrayerUtils.filterApiData(data);
  const validatedData = validateApiTimes(filteredData);
  return PrayerUtils.transformApiData(validatedData);
};

// Fetches raw prayer time data from API
// Uses mock data in non-production environments
// Implements no-cache policy for fresh data
const fetchRawData = async (year: number): Promise<IApiResponse> => {
  if (!isProd() && !isPreview()) return MOCK_DATA_SIMPLE;

  try {
    const response = await globalThis.fetch(buildApiUrl({ year }), REQUEST_INIT);
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
  return processPayload(data);
};

// High-level function to get processed prayer data for a specific year
const getYearData = async (targetYear: number): Promise<ISingleApiResponseTransformed[]> => {
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

/** Non-production serves the day from the same mock the year download uses, so both stay in step */
const fetchRawDay = async (date: string): Promise<IApiSingleTime> => {
  if (!isProd() && !isPreview()) {
    const mockDay = MOCK_DATA_SIMPLE.times[date];
    if (!mockDay) throw new Error(`Mock data has no day ${date}`);
    return mockDay;
  }

  const response = await globalThis.fetch(buildApiUrl({ date }), REQUEST_INIT);
  return readBody<IApiSingleTime>(response);
};

/**
 * Fetches one day's prayer times, for a day whose year cannot be downloaded: 31 December on
 * 1 January, once the endpoint serves only the new year (R13)
 *
 * The endpoint answers a single day as a flat object rather than a year's `times` map, so the body
 * is wrapped as one before the shared pipeline, and an unreadable time comes back null exactly as it
 * would from the year download.
 *
 * @param date The day to fetch, YYYY-MM-DD in London
 * @returns That day, transformed
 * @throws When the endpoint refuses the date (HTTP 404), answers for a different day, the day is
 * before yesterday, or none of its times can be read
 */
export const fetchDay = async (date: string): Promise<ISingleApiResponseTransformed> => {
  logger.info('API: Fetching prayer times for day', { date });

  try {
    const body = await fetchRawDay(date);
    // Wrapped under the requested key, so a body for another day would otherwise be stored as this one
    if (body?.date !== date) throw new Error(`Day response is for ${JSON.stringify(body?.date)}, not ${date}`);

    const [day] = processPayload({ city: 'london', times: { [date]: body } });
    logger.info('API: Prayer times fetched for day', { date });
    return day;
  } catch (error) {
    logger.error('API: Error fetching prayer times for day', { error, date });
    throw error;
  }
};
