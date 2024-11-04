import { MMKV } from 'react-native-mmkv';
import { ISingleScheduleTransformed } from '@/types/prayers';

const mmkv = new MMKV();

export const storage = {
  storePrayers: (prayers: ISingleScheduleTransformed[]) => {
    prayers.forEach(prayer => {
      mmkv.set(prayer.date, JSON.stringify(prayer));
    });
  },

  getTodaysPrayers: (): ISingleScheduleTransformed | null => {
    const today = new Date().toISOString().split('T')[0];
    const data = mmkv.getString(today);
    return data ? JSON.parse(data) : null;
  },

  clear: () => mmkv.clearAll()
};
