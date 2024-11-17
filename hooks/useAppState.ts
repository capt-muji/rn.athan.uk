import { useCallback } from 'react';
import { useAtom } from 'jotai';
import {  isLoadingAtom, hasErrorAtom } from '@/stores/store';
import usePrayer from '@/hooks/usePrayer';
import useSchedule from '@/hooks/useSchedule';

export const useAppState = () => {
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  const [hasError, setHasError] = useAtom(hasErrorAtom);

  const PrayerHook = usePrayer();
  const ScheduleStandardHook = useSchedule('standard');
  const ScheduleExtraHook = useSchedule('extra');

  const initialize = useCallback(async () => {
    console.log('Initializing app');

    try {
      const data = await PrayerHook.fetch();
      PrayerHook.saveAll(data);

      const { today: standardToday } = ScheduleStandardHook.setTodayAndTomorrow();
      const { today: extraToday } = ScheduleExtraHook.setTodayAndTomorrow();

      ScheduleStandardHook.updateNextIndex(standardToday);
      ScheduleExtraHook.updateNextIndex(extraToday);

      PrayerHook.updateDate(standardToday);

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

  return { isLoading, hasError, initialize, };
};
