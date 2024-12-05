import { format } from 'date-fns';
import { createJSONStorage } from 'jotai/utils';
import { MMKV } from 'react-native-mmkv';

import logger from '@/shared/logger';
import * as TimeUtils from '@/shared/time';
import * as Types from '@/shared/types';

/** Main MMKV database instance */
export const database = new MMKV();

export const getItem = (key: string) => {
  const value = database.getString(key);
  const data = value ? JSON.parse(value) : null;

  logger.info(`MMKV READ: ${key} ::`, data);
  return data;
};

export const setItem = (key: string, value: unknown) => {
  logger.info(`MMKV WRITE: ${key} ::`, value);

  database.set(key, JSON.stringify(value));
};

export const removeItem = (key: string) => {
  logger.info(`MMKV DELETE: ${key}`);

  database.delete(key);
};

/** Simple storage interface */
export const mmkvStorage = createJSONStorage(() => ({ getItem, setItem, removeItem }));

export const clearPrefix = (prefix: string) => {
  const keys = database.getAllKeys();

  keys.forEach((key) => {
    if (!key.startsWith(prefix)) return;

    database.delete(key);
    logger.info(`MMKV DELETE: ${key}`);
  });

  logger.info(`MMKV INFO: Cleared all entries with prefix "${prefix}"`);
};

export const saveAllPrayers = (prayers: Types.ISingleApiResponseTransformed[]) => {
  prayers.forEach((prayer) => {
    const key = `prayer_${prayer.date}`;

    database.set(key, JSON.stringify(prayer));
    logger.info(`MMKV WRITE: ${key}`);
  });

  logger.info(`MMKV INFO: ${prayers.length} prayers saved`);
};

export const getPrayerByDate = (date: Date): Types.ISingleApiResponseTransformed | null => {
  const londonDate = TimeUtils.createLondonDate(date);
  const keyDate = format(londonDate, 'yyyy-MM-dd');
  const key = `prayer_${keyDate}`;

  const data = database.getString(key);

  logger.info(`MMKV READ: ${key}`);

  return data ? JSON.parse(data) : null;
};

export const markYearAsFetched = (year: number) => {
  const fetchedYears = getItem('fetched_years') || {};
  setItem('fetched_years', { ...fetchedYears, [year]: true });
};

/**
 * Clears prayer-related data from storage
 * Preserves user preferences
 */
export const cleanup = () => {
  clearPrefix('prayer_');
  clearPrefix('display_date');
  clearPrefix('fetched_years');
};
