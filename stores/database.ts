import { MMKV } from 'react-native-mmkv';
import { format } from 'date-fns';
import { createLondonDate } from '@/shared/time';
import { ISingleApiResponseTransformed } from '@/shared/types';

export const database = new MMKV();

export const clear = () => database.clearAll();

export const saveAll = (prayers: ISingleApiResponseTransformed[]) => {
  prayers.forEach(prayer => {
    database.set(prayer.date, JSON.stringify(prayer));
  });
};

export const getByDate = (date: Date): ISingleApiResponseTransformed | null => {
  const londonDate = createLondonDate(date);
  const dateKey = format(londonDate, 'yyyy-MM-dd');
  const data = database.getString(dateKey);
  return data ? JSON.parse(data) : null;
};