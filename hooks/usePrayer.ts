import * as Api from '@/api/client';
import Storage from '@/stores/database';
import { isDateTodayOrFuture } from '@/shared/time';
import { transformApiData } from '@/shared/prayer';
import { IApiResponse, ISingleApiResponseTransformed, IScheduleNow } from '@/shared/types';
import { useAtom } from 'jotai';
import { dateAtom } from '@/stores/store';

export default function usePrayer() {
  const [date, setDate] = useAtom(dateAtom);

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

  const updateDate = (prayers: IScheduleNow) => {
    const dataDate = Object.values(prayers)[0].date;
    setDate(dataDate);
  };

  return {
    fetch,
    saveAll,
    updateDate,
  };
};