import type { IGetPrayersApiResponse, ISinglePrayer } from "!api";

interface ICacheData {
  result: IGetPrayersApiResponse;
  updatedAt: number;
}

export const getCache = (name: string): ICacheData | null => {
  const cache = localStorage.getItem(name);

  if (cache) return JSON.parse(cache);

  console.log(`No cache found for ${name}`);
  return null;
};

export const setCache = (name: string, data: ICacheData): void => {
  localStorage.setItem(name, JSON.stringify(data));
  console.log(`New cache set for ${name}`, { data });
};

export const deleteCache = (name: string): void => {
  localStorage.removeItem(name);
  console.log(`Deleted cache for ${name}`);
};

export const getPrayersByDateCache = (date: string): ISinglePrayer | null => {
  const cache = getCache("data");

  if (!cache) return null;

  return cache.result.times[date] || null;
};