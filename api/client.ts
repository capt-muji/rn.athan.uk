import { API_CONFIG } from '@/api/config';
import { MOCK_DATA_SIMPLE } from '@/mocks/simple';
import logger from '@/shared/logger';
import * as PrayerUtils from '@/shared/prayer';
import { createLondonDate, getCurrentYear } from '@/shared/time';
import * as TimeUtils from '@/shared/time';
import { FetchDataResult, IApiResponse, ISingleApiResponseTransformed } from '@/shared/types';

const _buildUrl = (year: number = createLondonDate().getFullYear()): string => {
  const queries = [`format=${API_CONFIG.format}`, `key=${API_CONFIG.key}`, `year=${year}`, '24hours=true'].join('&');

  return `${API_CONFIG.endpoint}?${queries}`;
};

const _parseResponse = async (response: Response): Promise<IApiResponse> => {
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

  const data: IApiResponse = await response.json();
  if (!data?.city) throw new Error('Incomplete data received');

  return data;
};

const _fetch = async (year?: number): Promise<IApiResponse> => {
  if (process.env.EXPO_PUBLIC_ENV !== 'prod') return MOCK_DATA_SIMPLE;

  try {
    const response = await globalThis.fetch(_buildUrl(year), {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });

    return _parseResponse(response);
  } catch (error) {
    logger.error('API: Error fetching prayer times', { error, year });
    throw error;
  }
};

/** Fetches and processes prayer data for a single year */
const _fetchYearData = async (year?: number): Promise<ISingleApiResponseTransformed[]> => {
  const targetYear = year || getCurrentYear();

  try {
    logger.info('API: Fetching prayer times for year', { year: targetYear });
    const data = await _fetch(targetYear);
    logger.info('API: Data fetched');

    const dataFiltered = PrayerUtils.filterApiData(data);
    const dataTransformed = PrayerUtils.transformApiData(dataFiltered);

    return dataTransformed;
  } catch (error) {
    logger.error('API: Error processing data', { error });
    throw error;
  }
};

/**
 * Main API function to fetch prayer data for current year and optionally next year
 */
export const fetchData = async (needsNextYear: boolean): Promise<FetchDataResult> => {
  const currentYear = TimeUtils.getCurrentYear();

  try {
    const currentYearData = await _fetchYearData(currentYear);
    let nextYearData = null;

    if (needsNextYear) {
      nextYearData = await _fetchYearData(currentYear + 1);
    }

    return { currentYearData, nextYearData, currentYear };
  } catch (error) {
    logger.error('API: Failed to fetch prayer data', { error });
    throw error;
  }
};
