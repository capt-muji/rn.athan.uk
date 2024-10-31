import { IApiResponse } from "@/types/api";

const config = {
  key: "2a99f189-6e3b-4015-8fb8-ff277642561d",
  path: "times",
  format: "json",
  baseUrl: "https://www.londonprayertimes.com",
  get queries() {
    return [
      `format=${this.format}`,
      `key=${this.key}`,
      `year=${new Date().getFullYear()}`,
      '24hours=true'
    ].join("&");
  }
};

const urls = {
  getPrayersUrl: `${config.baseUrl}/api/${config.path}?${config.queries}`
};

export const get = async (): Promise<IApiResponse> => {
  try {
    const response = await fetch(urls.getPrayersUrl, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (!response.ok) {
      console.error('Network response was not ok:', response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as IApiResponse;

    if (data?.city) return data;
    else {
      console.error('Error partial:', data);
      throw new Error('Incomplete data received');
    }

  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};
