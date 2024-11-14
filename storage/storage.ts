import { MMKV } from 'react-native-mmkv';

import { DaySelection, ISingleScheduleTransformed } from '@/types/prayers';
import { getTodayOrTomorrowDate } from '@/utils/time';

const storage = new MMKV();

const storePrayers = (prayers: ISingleScheduleTransformed[]) => {
  prayers.forEach(prayer => {
    storage.set(prayer.date, JSON.stringify(prayer));
  });
};

const getTodayOrTomorrowPrayers = (day: DaySelection = 'today'): ISingleScheduleTransformed | null => {
  const date = getTodayOrTomorrowDate(day);
  const data = storage.getString(date);
  return data ? JSON.parse(data) : null;
};

// Add storage interface for Jotai
export const jotaiStorage = {
  getItem: (key: string) => {
    const value = storage.getString(key);
    return value ? JSON.parse(value) : null;
  },
  setItem: (key: string, value: any) => {
    storage.set(key, JSON.stringify(value));
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
};

export default {
  prayers: {
    storePrayers,
    getTodayOrTomorrowPrayers
  },
  clear: () => storage.clearAll()
};
