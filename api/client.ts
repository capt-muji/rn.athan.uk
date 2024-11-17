import { IApiResponse } from "@/shared/types";
import { API_CONFIG } from "./config";
import { createLondonDate } from "@/shared/time";

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

export const fetch = async (year?: number): Promise<IApiResponse> => {
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
