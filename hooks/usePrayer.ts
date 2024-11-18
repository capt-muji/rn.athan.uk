import { useAtom } from 'jotai';
import * as Api from '@/api/client';
import Storage from '@/stores/database';
import { isDateTodayOrFuture } from '@/shared/time';
import { transformApiData } from '@/shared/prayer';
import { IScheduleNow } from '@/shared/types';
import Store from '@/stores/store';

export default function usePrayer() {
  const [date, setDate] = useAtom(Store.date.current);

  const fetch = async (year?: number) => {
    const apiData = await Api.fetch(year);
    const filteredTimes = Object.fromEntries(
      Object.entries(apiData.times)
        .filter(([date]) => isDateTodayOrFuture(date))
    );

    return transformApiData({ ...apiData, times: filteredTimes });
  };

  return {
    fetch,
    saveAll: Storage.prayers.storePrayers,
    updateDate: (prayers: IScheduleNow) => setDate(Object.values(prayers)[0].date),
  };
}