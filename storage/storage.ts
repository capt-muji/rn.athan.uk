import { MMKV } from 'react-native-mmkv';

import { ISingleScheduleTransformed } from '@/types/prayers';
import { getTodayOrTomorrow } from '@/utils/time';

const storage = new MMKV();

const storePrayers = (prayers: ISingleScheduleTransformed[]) => {
  prayers.forEach(prayer => {
    storage.set(prayer.date, JSON.stringify(prayer));
  });
};

const getTodaysPrayers = (): ISingleScheduleTransformed | null => {
  const data = storage.getString(getTodayOrTomorrow('today'));
  return data ? JSON.parse(data) : null;
};

const getTomorrowsPrayers = (): ISingleScheduleTransformed | null => {
  const data = storage.getString(getTodayOrTomorrow('tomorrow'));
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
