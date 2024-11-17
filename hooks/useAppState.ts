import { useCallback } from 'react';
import { useAtom } from 'jotai';
import {  isLoadingAtom, hasErrorAtom } from '@/stores/store';
import usePrayer from '@/hooks/usePrayer';

export const useAppState = () => {
  const [, setIsLoading] = useAtom(isLoadingAtom);
  const [, setHasError] = useAtom(hasErrorAtom);
  const PrayerHook = usePrayer();

  const initialize = useCallback(async () => {
    console.log('Initializing app');

    try {
      const data = await PrayerHook.fetch();

      PrayerHook.saveAll(data);
      PrayerHook.setTodayAndTomorrow();
      PrayerHook.setNextIndex();
      PrayerHook.setDate();

      setIsLoading(false);
      setHasError(false);

      console.log('Successfully initialized app');
    } catch (error) {
      console.error('Error initializing app:', error);

      setIsLoading(false);
      setHasError(true);
      
      return null;
    }
  }, []);

  return { initialize };
};
