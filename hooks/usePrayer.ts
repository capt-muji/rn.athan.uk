import { useAtom } from 'jotai';

import * as Api from '@/api/client';
import Storage from '@/stores/database';
import { isDateTodayOrFuture } from '@/shared/time';
import { transformApiData, createSchedule } from '@/shared/prayer';
import { prayersTodayAtom, prayersTomorrowsAtom, prayersNextIndexAtom, dateTodayAtom } from '@/stores/store';
import { IApiResponse, ISingleApiResponseTransformed } from '@/shared/types';

export default function usePrayer() {
  const [prayersToday, setPrayersTodayAtom] = useAtom(prayersTodayAtom);
  const [, setPrayersTomorrowAtom] = useAtom(prayersTomorrowsAtom);
  const [prayersNextIndex, setPrayersNextIndex] = useAtom(prayersNextIndexAtom);
  const [, setDateToday] = useAtom(dateTodayAtom);

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
    const todayRaw = Storage.prayers.getTodayOrTomorrow('today');
    const tomorrowRaw = Storage.prayers.getTodayOrTomorrow('tomorrow');

    if (!todayRaw || !tomorrowRaw) throw new Error('Prayers not found');

    const todaysPrayers = createSchedule(todayRaw);
    const tomorrowsPrayers = createSchedule(tomorrowRaw);

    setPrayersTodayAtom(todaysPrayers);
    setPrayersTomorrowAtom(tomorrowsPrayers);
  }

  // Set next prayer index
  const setNextIndex = () => {
    if (prayersNextIndex === -1) {
      // During app initialization, find first upcoming prayer
      const nextPrayer = Object.values(prayersToday).find(p => !p.passed);
      setPrayersNextIndex(nextPrayer?.index ?? 0);
      return;
    }

    // Reset to Fajr if last prayer has passed
    setPrayersNextIndex(prayersNextIndex === 5 ? 0 : prayersNextIndex + 1);
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