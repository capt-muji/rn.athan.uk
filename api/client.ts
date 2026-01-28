import { API_CONFIG } from '@/api/config';
import { MOCK_DATA_SIMPLE } from '@/mocks/simple';
import logger, { isProd, isPreview } from '@/shared/logger';
import * as PrayerUtils from '@/shared/prayer';
import * as TimeUtils from '@/shared/time';
import { IApiResponse, ISingleApiResponseTransformed } from '@/shared/types';

// Constructs the API URL with required parameters:
// - format (JSON/XML)
// - API key
// - Year
// - 24-hour format flag
const buildApiUrl = (year: number = TimeUtils.createLondonDate().getFullYear()): string => {
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
  if (!data?.city) throw new Error('Incomplete data received');

  return data;
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
  return PrayerUtils.transformApiData(filteredData);
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
