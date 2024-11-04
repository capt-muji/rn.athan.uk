import { MMKV } from 'react-native-mmkv';
import { ISingleScheduleTransformed } from '@/types/prayers';
import { getTodaysDate } from '../utils/time';

const mmkv = new MMKV();

const storePrayers = (prayers: ISingleScheduleTransformed[]) => {
  prayers.forEach(prayer => {
    mmkv.set(prayer.date, JSON.stringify(prayer));
  });
};

const getTodaysPrayers = (): ISingleScheduleTransformed | null => {
  const data = mmkv.getString(getTodaysDate());
  return data ? JSON.parse(data) : null;
};

export default {
  prayers: {
    storePrayers,
    getTodaysPrayers
  },
  clear: () => mmkv.clearAll()
};
