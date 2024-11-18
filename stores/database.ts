import { MMKV } from 'react-native-mmkv';

import { DaySelection, ISingleApiResponseTransformed } from '@/shared/types';
import { getTodayOrTomorrowDate } from '@/shared/time';

export const database = new MMKV();

export const clear = () => database.clearAll();

export const storePrayers = (prayers: ISingleApiResponseTransformed[]) => {
  prayers.forEach(prayer => {
    database.set(prayer.date, JSON.stringify(prayer));
  });
};

export const getTodayOrTomorrow = (day: DaySelection = DaySelection.Today): ISingleApiResponseTransformed | null => {
  const date = getTodayOrTomorrowDate(day);
  const data = database.getString(date);
  return data ? JSON.parse(data) : null;
};