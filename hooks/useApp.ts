import { useCallback } from 'react';
import useStore from '@/stores/store';
import usePrayer from '@/hooks/usePrayer';
import useSchedule from '@/hooks/useSchedule';
import { DaySelection } from '@/shared/types';

export const useApp = () => {
  const { app, date } = useStore();

  const standardSchedule = useSchedule('standard');
  const extraSchedule = useSchedule('extra');
  const prayer = usePrayer();

  const initialize = useCallback(async () => {
    try {
      const data = await prayer.fetch();
      prayer.saveAll(data);

      // Set all current schedules 
      standardSchedule.setScheduleDay(DaySelection.Today);
      standardSchedule.setScheduleDay(DaySelection.Tomorrow);
      extraSchedule.setScheduleDay(DaySelection.Today);
      extraSchedule.setScheduleDay(DaySelection.Tomorrow);

      // Set next prayer
      standardSchedule.setNextIndex();
      extraSchedule.setNextIndex();

      // Set current date
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
