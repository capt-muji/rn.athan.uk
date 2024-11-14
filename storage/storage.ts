import { MMKV } from 'react-native-mmkv';

import { DaySelection, ISingleScheduleTransformed } from '@/types/prayers';
import { getTodayOrTomorrow } from '@/utils/time';

const storage = new MMKV();

const storePrayers = (prayers: ISingleScheduleTransformed[]) => {
  prayers.forEach(prayer => {
    storage.set(prayer.date, JSON.stringify(prayer));
  });
};

const getTodayOrTomorrowPrayers = (day: DaySelection = 'today'): ISingleScheduleTransformed | null => {
  const data = storage.getString(getTodayOrTomorrow(day));
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
