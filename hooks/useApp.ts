import { useCallback } from 'react';
import { useAtom } from 'jotai';
import Store from '@/stores/store';
import usePrayer from '@/hooks/usePrayer';
import useSchedule from '@/hooks/useSchedule';
import { DaySelection } from '@/shared/types';

export const useAppState = () => {
  const [, setIsLoading] = useAtom(Store.app.isLoading);
  const [, setHasError] = useAtom(Store.app.hasError);
  const [, setCurrentDate] = useAtom(Store.date.current);

  const standardSchedule = useSchedule('standard');
  const extraSchedule = useSchedule('extra');
  
  const prayer = usePrayer();

  const initialize = useCallback(async () => {
    try {
      const data = await prayer.fetch();
      prayer.saveAll(data);

      const standardToday = standardSchedule.setScheduleDay(DaySelection.Today);
      const standardTomorrow = standardSchedule.setScheduleDay(DaySelection.Tomorrow);

      const extraToday = extraSchedule.setScheduleDay(DaySelection.Today);
      const extraTomorrow = extraSchedule.setScheduleDay(DaySelection.Tomorrow);


      
      
      standardSchedule.updateNextIndex(standardToday);
      extraSchedule.schedule.updateNextIndex(extraToday);
      setCurrentDate(new Date().toISOString());

      setIsLoading(false);
      setHasError(false);
    } catch (error) {
      console.error('Error initializing app:', error);
      setIsLoading(false);
      setHasError(true);
    }
  }, []);

  return { initialize };
};
