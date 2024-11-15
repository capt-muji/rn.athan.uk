import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { 
  isLoadingAtom, 
  hasErrorAtom, 
  todaysPrayersAtom, 
  tomorrowsPrayersAtom, 
  nextPrayerIndexAtom,
  dateAtom 
} from '@/store/store';
import { createSchedule, transformApiData } from '@/utils/prayer';
import { IApiResponse } from '@/types/api';
import storage from '@/storage/storage';
import { formatDate } from '@/utils/time';

export const useInit = () => {
  const [, setIsLoading] = useAtom(isLoadingAtom);
  const [, setHasError] = useAtom(hasErrorAtom);
  const [, setTodaysPrayers] = useAtom(todaysPrayersAtom);
  const [, setTomorrowsPrayers] = useAtom(tomorrowsPrayersAtom);
  const [, setNextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [, setDate] = useAtom(dateAtom);

  const initialize = useCallback(async (apiData: IApiResponse) => {
    
    try {
      const transformedPrayers = transformApiData(apiData);
      storage.prayers.storePrayers(transformedPrayers);
      const todayRaw = storage.prayers.getTodayOrTomorrowPrayers('today');
      const tomorrowRaw = storage.prayers.getTodayOrTomorrowPrayers('tomorrow');
      
      if (!todayRaw || !tomorrowRaw) throw new Error('Prayers not found');

      const todaysPrayers = createSchedule(todayRaw);
      const tomorrowsPrayers = createSchedule(tomorrowRaw);
      
      const nextPrayer = Object.values(todaysPrayers).find(p => !p.passed);
      const nextPrayerIndex = nextPrayer?.index ?? 0; // Fallback to Fajr if all prayers have passed

      setTodaysPrayers(todaysPrayers);
      setTomorrowsPrayers(tomorrowsPrayers);
      setNextPrayerIndex(nextPrayerIndex);

      const formattedDate = formatDate(Object.values(todaysPrayers)[0].date);
      setDate(formattedDate);

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
