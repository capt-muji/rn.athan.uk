import { format } from 'date-fns';
import { createJSONStorage } from 'jotai/utils';
import { MMKV } from 'react-native-mmkv';

import logger from '@/shared/logger';
import * as TimeUtils from '@/shared/time';
import * as Types from '@/shared/types';

/** Main MMKV database instance */
export const database = new MMKV();

/** Custom storage implementation for MMKV with JSON serialization */
export const mmkvStorage = createJSONStorage(() => ({
  getItem: (key: string) => {
    const value = database.getString(key);
    return value ? JSON.parse(value) : null;
  },
  setItem: (key: string, value: unknown) => {
    database.set(key, JSON.stringify(value));
  },
  removeItem: (key: string) => {
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
