import { API_CONFIG } from '@/api/config';
import { MOCK_DATA_SIMPLE } from '@/mocks/simple';
import logger from '@/shared/logger';
import * as PrayerUtils from '@/shared/prayer';
import { createLondonDate } from '@/shared/time';
import { IApiResponse, ISingleApiResponseTransformed } from '@/shared/types';
// no

const buildUrl = (year: number = createLondonDate().getFullYear()): string => {
  const queries = [
    `format=${API_CONFIG.format}`,
    `key=${API_CONFIG.key}`,
    `year=${year}`,
    '24hours=true',
  ].join('&');

  return `${API_CONFIG.endpoint}?${queries}`;
};

const parseResponse = async (response: Response): Promise<IApiResponse> => {
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

  const data: IApiResponse = await response.json();
  if (!data?.city) throw new Error('Incomplete data received');

  return data;
};

const fetch = async (year?: number): Promise<IApiResponse> => {
  if (process.env.EXPO_PUBLIC_ENV !== 'prod') return MOCK_DATA_SIMPLE;

  try {
    const response = await globalThis.fetch(buildUrl(year), {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });
    // lol globalThis

    return parseResponse(response);
  } catch (error) {
    logger.error({ error, year }, 'Error fetching prayer times');
    throw error;
  }
};

export const handle = async (year?: number): Promise<ISingleApiResponseTransformed[]> => {
  try {
    const data = await fetch(year);
    logger.info({ dataLength: data.data?.length }, 'API data fetched successfully');

    const dataFiltered = PrayerUtils.filterApiData(data);
    logger.info({ filteredLength: dataFiltered.length }, 'Data filtered successfully');

    const dataTransformed = PrayerUtils.transformApiData(dataFiltered);
    logger.info({ transformedLength: dataTransformed.length }, 'Data transformed successfully');

    return dataTransformed;
  } catch (error) {
    logger.error({ error }, 'Error processing data');
    throw error;
  }
};
