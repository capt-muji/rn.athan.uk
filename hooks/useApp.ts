import { useCallback } from 'react';
import useStore from '@/stores/store';
import useData from '@/hooks/useData';
import useSchedule from '@/hooks/useSchedule';
import { DaySelection } from '@/shared/types';

export const useApp = () => {
  const { app, date } = useStore();

  const standardSchedule = useSchedule('standard');
  const extraSchedule = useSchedule('extra');
  const data = useData();

  const initialize = useCallback(async () => {
    try {
      const prayers = await data.fetchAll();
      data.saveAll(prayers);

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

  return { 
    initialize,
    isLoading: app.isLoading,
    hasError: app.hasError,
    date
  };
};
