import { useCallback } from 'react';
import usePrayer from '@/hooks/usePrayer';
import useSchedule from '@/hooks/useSchedule';
import useBaseStore from '@/hooks/useBaseStore';

export const useAppState = () => {
  const base = useBaseStore('standard');
  const prayer = usePrayer();
  const standardSchedule = useSchedule('standard');
  const extraSchedule = useSchedule('extra');

  const initialize = useCallback(async () => {
    try {
      const data = await prayer.fetch();
      prayer.saveAll(data);

      const { today: standardToday } = standardSchedule.setTodayAndTomorrow();
      const { today: extraToday } = extraSchedule.setTodayAndTomorrow();

      standardSchedule.updateNextIndex(standardToday);
      extraSchedule.updateNextIndex(extraToday);
      base.setDate(new Date().toISOString());

      base.setIsLoading(false);
      base.setHasError(false);
    } catch (error) {
      console.error('Error initializing app:', error);
      base.setIsLoading(false);
      base.setHasError(true);
    }
  }, []);

  return { 
    isLoading: base.isLoading, 
    hasError: base.hasError, 
    initialize 
  };
};
