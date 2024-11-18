import { useCallback } from 'react';
import { useAtom } from 'jotai';
import Store from '@/stores/store';
import usePrayer from '@/hooks/usePrayer';
import useSchedule from '@/hooks/useSchedule';

export const useAppState = () => {
  const [isLoading, setIsLoading] = useAtom(Store.app.isLoading);
  const [hasError, setHasError] = useAtom(Store.app.hasError);
  
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
      prayer.updateDate(standardToday);

      setIsLoading(false);
      setHasError(false);
    } catch (error) {
      console.error('Error initializing app:', error);
      setIsLoading(false);
      setHasError(true);
    }
  }, []);

  return { isLoading, hasError, initialize };
};
