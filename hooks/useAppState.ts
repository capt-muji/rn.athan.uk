import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { 
  isLoadingAtom, 
  hasErrorAtom, 
  todaysPrayersAtom, 
  tomorrowsPrayersAtom, 
  nextPrayerIndexAtom,
  dateAtom 
} from '@/stores/state';
import { createSchedule, filterApiData, transformApiData } from '@/shared/prayer';
import { IApiResponse } from '@/shared/types';
import storage from '@/stores/database';
import usePrayer from '@/hooks/usePrayer';

export const useAppState = () => {
  // const [, setIsLoading] = useAtom(isLoadingAtom);
  // const [, setHasError] = useAtom(hasErrorAtom);
  // const [, setTodaysPrayers] = useAtom(todaysPrayersAtom);
  // const [, setTomorrowsPrayers] = useAtom(tomorrowsPrayersAtom);
  // const [, setNextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  // const [, setDate] = useAtom(dateAtom);
  const PrayerHook = usePrayer();



  const initialize = useCallback(async (apiData: IApiResponse) => {
    
    try {
      const prayerData = await PrayerHook.fetch();

      PrayerHook.saveAll(prayerData);
      PrayerHook.setTodayAndTomorrow();
      PrayerHook.setNextIndex();


      const dataDate = Object.values(todaysPrayers)[0].date;
      setDate(dataDate);

      setIsLoading(false);
      setHasError(false);

      return { todaysPrayers, tomorrowsPrayers, nextPrayerIndex };
    } catch (error) {
      setIsLoading(false);
      setHasError(true);
      return null;
    }
  }, []);

  return { initialize };
};
