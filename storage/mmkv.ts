import { MMKV } from 'react-native-mmkv';
import { IAllTimes, ISinglePrayer } from '../api';
import { isTodayOrFuture } from '../utils/isTodayOrFuture';

class MMKVManager {
  private storage: MMKV;

  constructor() {
    this.storage = new MMKV();
  }

  // Save prayer times for today and future days as single records
  public storeAllPrayerRecords(times: IAllTimes) {
    Object.keys(times).forEach(date => {
      if (!isTodayOrFuture(date)) return;
      this.storage.set(date, JSON.stringify(times[date]));

      console.log('====================================');
      console.log('stored allllll');
      console.log(this.storage.getAllKeys());
      console.log('====================================');
    });
  }

  public getPrayersByDate(date: string): ISinglePrayer | null {
    const data = this.storage.getString(date);
    return data ? JSON.parse(data) as ISinglePrayer : null;
  }

  public clearAllRecords() {
    this.storage.clearAll();
  }
}

export const storage = new MMKVManager();
