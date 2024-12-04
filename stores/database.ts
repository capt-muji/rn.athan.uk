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

/** Clears all storage */
export const clearAllPrayers = () => database.clearAll();

/** Saves prayer times */
export const saveAllPrayers = (prayers: Types.ISingleApiResponseTransformed[]) => {
  prayers.forEach((prayer) => {
    database.set(`prayer_${prayer.date}`, JSON.stringify(prayer));
  });

  logger.info(`MMKV: ${prayers.length} prayers saved`);
};

/** Retrieves prayer times */
export const getPrayerByDate = (date: Date): Types.ISingleApiResponseTransformed | null => {
  const londonDate = TimeUtils.createLondonDate(date);
  const dateKey = format(londonDate, 'yyyy-MM-dd');
  const data = database.getString(`prayer_${dateKey}`);

  logger.info(`MMKV: Read prayer by date ${dateKey}`);

  return data ? JSON.parse(data) : null;
};
