import { format } from 'date-fns';
import { MMKV } from 'react-native-mmkv';

import logger from '@/shared/logger';
import { createLondonDate } from '@/shared/time';
import { ISingleApiResponseTransformed } from '@/shared/types';
import { markYearAsFetched } from '@/stores/actions';

export const database = new MMKV();

/**
 * Clears all data from MMKV storage
 */
export const clear = () => database.clearAll();

/**
 * Saves prayer times to storage and marks the year as fetched
 */
export const saveAll = (prayers: ISingleApiResponseTransformed[]) => {
  prayers.forEach((prayer) => {
    database.set(prayer.date, JSON.stringify(prayer));
  });

  const year = createLondonDate(prayers[0].date).getFullYear();
  markYearAsFetched(year);

  logger.info('Data saved');
};

/**
 * Retrieves prayer times for a specific date from storage
 */
export const getByDate = (date: Date): ISingleApiResponseTransformed | null => {
  const londonDate = createLondonDate(date);
  const dateKey = format(londonDate, 'yyyy-MM-dd');
  const data = database.getString(dateKey);
  return data ? JSON.parse(data) : null;
};
