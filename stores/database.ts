import { format } from 'date-fns';
import { createJSONStorage } from 'jotai/utils';
import { MMKV } from 'react-native-mmkv';

import logger from '@/shared/logger';
import * as TimeUtils from '@/shared/time';
import * as Types from '@/shared/types';

/** Main MMKV database instance */
export const database = new MMKV();

/** Simple storage interface */
export const mmkvStorage = createJSONStorage(() => ({
  getItem: (key: string) => {
    const value = database.getString(key);
    const data = value ? JSON.parse(value) : null;

    logger.info(`MMKV READ: ${key} ::`, data);
    return data;
  },
  setItem: (key: string, value: unknown) => {
    logger.info(`MMKV WRITE: ${key} ::`, value);

    database.set(key, JSON.stringify(value));
  },
  removeItem: (key: string) => {
    logger.info(`MMKV DELETE: ${key}`);

    database.delete(key);
  },
}));

export const clearAllPrayers = () => {
  const keys = database.getAllKeys();

  keys.forEach((key) => {
    if (!key.startsWith('prayer_')) return;

    database.delete(key);
    logger.info(`MMKV DELETE: ${key}`);
  });
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
