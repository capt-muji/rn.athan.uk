import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { 
  isLoadingAtom, 
  hasErrorAtom, 
  todaysPrayersAtom, 
  tomorrowsPrayersAtom, 
  nextPrayerIndexAtom 
} from '@/store/store';
import { createTodayStructure, transformApiData } from '@/utils/prayer';
import { IApiResponse } from '@/types/api';
import storage from '@/storage/storage';

export const usePrayers = () => {
  const [, setIsLoading] = useAtom(isLoadingAtom);
  const [, setHasError] = useAtom(hasErrorAtom);
  const [, setTodaysPrayers] = useAtom(todaysPrayersAtom);
  const [, setTomorrowsPrayers] = useAtom(tomorrowsPrayersAtom);
  const [, setNextPrayerIndex] = useAtom(nextPrayerIndexAtom);

  const initialize = useCallback(async (apiData: IApiResponse) => {
    try {
      const transformedPrayers = transformApiData(apiData);
      storage.prayers.storePrayers(transformedPrayers);

      const todayRaw = storage.prayers.getTodaysPrayers();
      const tomorrowRaw = storage.prayers.getTomorrowsPrayers();
      
      if (!todayRaw || !tomorrowRaw) throw new Error('Prayers not found');

      const todaysPrayers = createTodayStructure(todayRaw);
      const tomorrowsPrayers = createTodayStructure(tomorrowRaw);
      
      const nextPrayer = Object.values(todaysPrayers).find(p => !p.passed);
      const nextPrayerIndex = nextPrayer?.index ?? -1;

      setIsLoading(false);
      setHasError(false);
      setTodaysPrayers(todaysPrayers);
      setTomorrowsPrayers(tomorrowsPrayers);
      setNextPrayerIndex(nextPrayerIndex);

      return { todaysPrayers, tomorrowsPrayers, nextPrayerIndex };
    } catch (error) {
      setIsLoading(false);
      setHasError(true);
      return null;
    }
  }, []);

  return { initialize };
};
