import { IApiResponse, ISingleApiResponseTransformed } from "@/shared/types";
import { API_CONFIG } from "./config";
import { createLondonDate } from "@/shared/time";
import { MOCK_DATA_SIMPLE } from '@/mocks/data_simple';
import * as PrayerUtils from '@/shared/prayer';

const buildUrl = (year: number = createLondonDate().getFullYear()): string => {
  const queries = [
    `format=${API_CONFIG.format}`,
    `key=${API_CONFIG.key}`,
    `year=${year}`,
    '24hours=true'
  ].join("&");

  return `${API_CONFIG.endpoint}?${queries}`;
}

const parseResponse = async (response: Response): Promise<IApiResponse> => {
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

  const data = await response.json() as IApiResponse;
  if (!data?.city) throw new Error('Incomplete data received');
    
  return data;
}

const fetch = async (year?: number): Promise<IApiResponse> => {
  if (process.env.EXPO_PUBLIC_ENV !== 'prod') return MOCK_DATA_SIMPLE;

  console.log('We are in production mode');

  try {
    const response = await globalThis.fetch(buildUrl(year), {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });

    return parseResponse(response);
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    throw error;
  }
}

export const handle = async (year?: number): Promise<ISingleApiResponseTransformed[]> => {
  try {
    const data = await fetch(year);
    console.log('API data fetched successfully');
    
    const dataFiltered = PrayerUtils.filterApiData(data);
    console.log('Data filtered successfully');
    
    const dataTransformed = PrayerUtils.transformApiData(dataFiltered);
    console.log('Data transformed successfully');
    
    return dataTransformed;
  } catch (error) {
    console.error('Error processing data:', error);
    throw error;
  }
};