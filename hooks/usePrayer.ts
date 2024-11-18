import * as Api from '@/api/client';
import { storePrayers } from '@/stores/database';
import { isDateTodayOrFuture } from '@/shared/time';
import { transformApiData } from '@/shared/prayer';
import { IApiResponse, ISingleApiResponseTransformed } from '@/shared/types';

export default function usePrayer() {
  const fetchAll = async (year?: number): Promise<ISingleApiResponseTransformed[]> => {
    const apiData = await Api.fetch(year);
    const filteredTimes = Object.fromEntries(
      Object.entries(apiData.times)
        .filter(([date]) => isDateTodayOrFuture(date))
    );

    return transformApiData({ ...apiData, times: filteredTimes });
  };

  return {
    fetchAll,
    saveAll: storePrayers
  };
}