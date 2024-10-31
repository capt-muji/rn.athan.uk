import { MMKV } from 'react-native-mmkv';
import { ISingleScheduleTransformed } from '../types/prayers';

class MMKVManager {
  private storage: MMKV;

  constructor() {
    this.storage = new MMKV();
  }
  
  public storeManyDays(times: ISingleScheduleTransformed[]) {
    times.forEach(transformedPrayer => {
      const date = transformedPrayer.date;
      this.storage.set(date, JSON.stringify(transformedPrayer));
    });
  }

  public getTodaysPrayers(): ISingleScheduleTransformed | null {
    const [ today ] = new Date().toISOString().split('T'); 
    return this.getPrayersByDate(today);
  }

  public getPrayersByDate(date: string): ISingleScheduleTransformed | null {
    const data = this.storage.getString(date);
    return data ? JSON.parse(data) as ISingleScheduleTransformed : null;
  }

  public clearAllRecords() {
    this.storage.clearAll();
  }
}

export const storage = new MMKVManager();
