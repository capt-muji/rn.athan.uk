import { useCallback } from 'react';
import { useAtom } from 'jotai';
import {  isLoadingAtom, hasErrorAtom } from '@/stores/store';
import { IApiResponse } from '@/shared/types';
import usePrayer from '@/hooks/usePrayer';

export const useAppState = () => {
  const [, setIsLoading] = useAtom(isLoadingAtom);
  const [, setHasError] = useAtom(hasErrorAtom);
  const PrayerHook = usePrayer();

  const initialize = useCallback(async (apiData: IApiResponse) => {
    
    try {
      const prayerData = await PrayerHook.fetch();

      PrayerHook.saveAll(prayerData);
      PrayerHook.setTodayAndTomorrow();
      PrayerHook.setNextIndex();
      PrayerHook.setDate();

      setIsLoading(false);
      setHasError(false);
    } catch (error) {
      console.error('Error initializing app:', error);

      setIsLoading(false);
      setHasError(true);
      
      return null;
    }
  }, []);

  return { initialize };
};
