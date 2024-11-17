import { useState } from 'react';
import * as Api from '@/api/client';
import Storage from '@/stores/database';
import { isDateTodayOrFuture } from '@/shared/time';
import { transformApiData, createSchedule } from '@/shared/prayer';
import { PrayerType, IApiResponse, ISingleApiResponseTransformed, IScheduleNow } from '@/shared/types';

export default function usePrayer(type: PrayerType) {
  const [schedule, setSchedule] = useState<IScheduleNow>({});
  const [prayerNextIndex, setPrayerNextIndex] = useState<number>(-1);
  const [extraNextIndex, setExtraNextIndex] = useState<number>(-1);
  const [dateToday, setDateToday] = useState<string>('');

  // Fetch, filter and transform prayer times
  const fetch = async (year?: number): Promise<ISingleApiResponseTransformed[]> => {
    const apiData = await Api.fetch(year);
    const apiDataFiltered: IApiResponse = { city: apiData.city, times: {}};

    const entries = Object.entries(apiData.times);

    entries.forEach(([date, data]) => {
      if (!isDateTodayOrFuture(date)) return;
      apiDataFiltered.times[date] = data;
    });

    return transformApiData(apiDataFiltered);
  };

  // Stores prayers in the database
  const saveAll = (prayers: ISingleApiResponseTransformed[]) => {
    Storage.prayers.storePrayers(prayers);
  };


  // Set today and tomorrow prayers in the store
  const setTodayAndTomorrow = () => {
    console.log(`Setting ${type} schedule`);

    const todayRaw = Storage.prayers.getTodayOrTomorrow('today');
    const tomorrowRaw = Storage.prayers.getTodayOrTomorrow('tomorrow');
    
    if (!todayRaw || !tomorrowRaw) throw new Error('Data not found');
    
    const todaySchedule = createSchedule(todayRaw, type);
    const tomorrowSchedule = createSchedule(tomorrowRaw, type);

    setSchedule(todaySchedule);

    console.log(`Finished setting ${type} schedule`);
    return { today: todaySchedule, tomorrow: tomorrowSchedule };
  }

  // Initialize next prayer index
  const setNextIndex = (prayers: IScheduleNow) => {
    console.log('Setting next prayer');

    const schedule = Object.values(prayers);
    const nextPrayer = schedule.find(prayer => !prayer.passed) || prayers[0];
    
    // Store next index in the appropriate atom based on type
    if (type === 'standard') {
      setPrayerNextIndex(nextPrayer.index);
    } else {
      setExtraNextIndex(nextPrayer.index);
    }

    console.log('Finished setting next prayer');
    return nextPrayer;
  };

  // Mark next prayer as passed and set next prayer index
  // setPrayersNextIndex(nextPrayer.index === 5 ? 0 : prayersNextIndex + 1);
  // Reset to Fajr if last prayer has passed
  // console.log('Finished setting next prayer');

  // Set date in the store from the today's prayers
  const setDate = (prayers: IScheduleNow) => {
    const dataDate = Object.values(prayers)[0].date;
    setDateToday(dataDate);
  };

  return {
    schedule,
    nextIndex: type === 'standard' ? prayerNextIndex : extraNextIndex,
    dateToday,
    fetch,
    saveAll,
    setTodayAndTomorrow,
    setNextIndex,
    setDate
  };
};