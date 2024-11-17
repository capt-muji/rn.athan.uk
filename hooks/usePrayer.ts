import { useState } from 'react';
import * as Api from '@/api/client';
import Storage from '@/stores/database';
import { isDateTodayOrFuture } from '@/shared/time';
import { transformApiData, createSchedule } from '@/shared/prayer';
import { IApiResponse, ISingleApiResponseTransformed, IScheduleNow } from '@/shared/types';

export default function usePrayer() {
  const [prayersToday, setPrayersToday] = useState<IScheduleNow>({});
  const [prayersTomorrow, setPrayersTomorrow] = useState<IScheduleNow>({});
  const [prayersNextIndex, setPrayersNextIndex] = useState<number>(-1);
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
    console.log('Setting today and tomorrow prayers');

    const todayRaw = Storage.prayers.getTodayOrTomorrow('today');
    const tomorrowRaw = Storage.prayers.getTodayOrTomorrow('tomorrow');
    
    if (!todayRaw || !tomorrowRaw) throw new Error('Prayers not found');
    
    const todaysPrayers = createSchedule(todayRaw);
    const tomorrowsPrayers = createSchedule(tomorrowRaw);

    console.log('muji: 🐳 ↼↼↼ todaysPrayers :: start ⇀⇀⇀ 🐳');
    console.log(JSON.stringify(todaysPrayers, null, 2));
    console.log('muji: 🐳 ↽↽↽ todaysPrayers :: end   ⇁⇁⇁ 🐳');

    setPrayersToday(todaysPrayers);
    setPrayersTomorrow(tomorrowsPrayers);


  }

  // Mark as passed and set next prayer index
  const setNextIndex = () => {
    console.log('Setting next prayer');


    const prayers = Object.values(prayersToday);


    const nextPrayer = prayers.find(prayer => !prayer.passed) || prayers[0];
    
    setPrayersNextIndex(nextPrayer.index);

    // Reset to Fajr if last prayer has passed
    // setPrayersNextIndex(prayersNextIndex === 5 ? 0 : prayersNextIndex + 1);
    console.log('Finished setting next prayer');
  };

  // Set date in the store from the today's prayers
  const setDate = () => {
    const dataDate = Object.values(prayersToday)[0].date;
    setDateToday(dataDate);
  };

  return {
    fetch,
    saveAll,
    setTodayAndTomorrow,
    setNextIndex,
    setDate
  };
};