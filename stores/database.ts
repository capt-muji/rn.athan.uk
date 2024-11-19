import { MMKV } from 'react-native-mmkv';
import { format } from 'date-fns';
import { createLondonDate } from '@/shared/time';
import { DaySelection, ISingleApiResponseTransformed } from '@/shared/types';
import { getRecentDate } from '@/shared/time';

export const database = new MMKV();

export const clear = () => database.clearAll();

export const saveAll = (prayers: ISingleApiResponseTransformed[]) => {
  prayers.forEach(prayer => {
    const x = prayer;
    console.log(prayer.date);
    database.set(prayer.date, JSON.stringify(prayer));
  });
};

// export const getTodayOrTomorrow = (day: DaySelection = DaySelection.Today): ISingleApiResponseTransformed | null => {
//   const date = getRecentDate(day);
//   const data = database.getString(date);
//   return data ? JSON.parse(data) : null;
// };

export const getByDate = (date: Date): ISingleApiResponseTransformed | null => {
  const londonDate = createLondonDate(date);
  const dateKey = format(londonDate, 'yyyy-MM-dd');
  const data = database.getString(dateKey);
  return data ? JSON.parse(data) : null;
};