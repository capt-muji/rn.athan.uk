import { useCallback } from 'react';
import usePrayer from '@/hooks/usePrayer';
import useSchedule from '@/hooks/useSchedule';
import useBaseStore from '@/hooks/useBaseStore';

export const useAppState = () => {
  const { app, date, schedule } = useBaseStore('standard');
  const prayer = usePrayer();
  const standardSchedule = useSchedule('standard');
  const extraSchedule = useSchedule('extra');

  const initialize = useCallback(async () => {
    try {
      const data = await prayer.fetch();
      prayer.saveAll(data);

      const { today: standardToday } = standardSchedule.setTodayAndTomorrow();
      const { today: extraToday } = extraSchedule.setTodayAndTomorrow();

      schedule.updateNextIndex(standardToday);
      extraSchedule.schedule.updateNextIndex(extraToday);
      date.setCurrent(new Date().toISOString());

      app.setIsLoading(false);
      app.setHasError(false);
    } catch (error) {
      console.error('Error initializing app:', error);
      app.setIsLoading(false);
      app.setHasError(true);
    }
  }, []);

  return { initialize };
};
