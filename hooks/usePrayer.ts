import * as Api from '@/api/client';
import { IApiResponse, IApiTimes, ISingleApiResponseTransformed } from '@/shared/types';
import { isDateTodayOrFuture } from '@/shared/time';
import storage from '@/stores/database';
import { transformApiData } from '@/shared/prayer';

export default function usePrayer() {
  // Fetch, filter and transform prayer times
  const fetch = async (year?: number): Promise<ISingleApiResponseTransformed[]> => {
    const apiData = await Api.fetch(year);
    const apiDataFiltered: IApiResponse = {
      city: apiData.city,
      times: {}
    };

    const entries = Object.entries(apiData.times);

    entries.forEach(([date, data]) => {
      if (!isDateTodayOrFuture(date)) return;
      apiDataFiltered.times[date] = data;
    });

    return transformApiData(apiDataFiltered);
  };

  // Stores prayers in the database
  const storeAll = (prayers: ISingleApiResponseTransformed[]) => {
    storage.prayers.storePrayers(prayers);
  };

  return {
    fetch,
    storeAll,
  };
};