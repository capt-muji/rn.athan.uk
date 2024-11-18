import { useCallback } from 'react';
import useStore from '@/stores/store';
import useData from '@/hooks/useData';
import useSchedule from '@/hooks/useSchedule';
import { DaySelection } from '@/shared/types';
import {formatDate, createLondonDate } from '@/shared/time';

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

      // Set current date from first prayer of standard schedule
      const firstPrayer = standardSchedule.today()[0];
      console.log('firstPrayer', firstPrayer);
      console.log('firstPrayer.date', firstPrayer.date);
      date.setCurrent(firstPrayer.date);
      
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
    date,
  };
};
