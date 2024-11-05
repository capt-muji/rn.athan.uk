import { MMKV } from 'react-native-mmkv';

import { ISingleScheduleTransformed } from '@/types/prayers';
import { getTodaysDate } from '@/utils/time';

const storage = new MMKV();

const getTomorrowsDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

const storePrayers = (prayers: ISingleScheduleTransformed[]) => {
  prayers.forEach(prayer => {
    storage.set(prayer.date, JSON.stringify(prayer));
  });
};

const getTodaysPrayers = (): ISingleScheduleTransformed | null => {
  const data = storage.getString(getTodaysDate());
  return data ? JSON.parse(data) : null;
};

const getTomorrowsPrayers = (): ISingleScheduleTransformed | null => {
  const data = storage.getString(getTomorrowsDate());
  return data ? JSON.parse(data) : null;
};

export default {
  prayers: {
    storePrayers,
    getTodaysPrayers,
    getTomorrowsPrayers
  },
  clear: () => storage.clearAll()
};
