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
    logger.info(`Reading from storage: ${key}`, value ? JSON.parse(value) : null);
    return value ? JSON.parse(value) : null;
  },
  setItem: (key: string, value: unknown) => {
    logger.info(`Writing to storage: ${key}`, value);
    database.set(key, JSON.stringify(value));
  },
  removeItem: (key: string) => {
    logger.info(`Removing from storage: ${key}`);
    database.delete(key);
  },
}));

/** Clears all storage */
export const clear = () => database.clearAll();

/** Saves prayer times */
export const saveAll = (prayers: Types.ISingleApiResponseTransformed[]) => {
  prayers.forEach((prayer) => {
    database.set(prayer.date, JSON.stringify(prayer));
  });
  logger.info('Data saved');
};

/** Retrieves prayer times */
export const getByDate = (date: Date): Types.ISingleApiResponseTransformed | null => {
  const londonDate = TimeUtils.createLondonDate(date);
  const dateKey = format(londonDate, 'yyyy-MM-dd');
  const data = database.getString(dateKey);
  return data ? JSON.parse(data) : null;
};
