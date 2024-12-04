import { useSchedule } from './useSchedule';

import * as TimeUtils from '@/shared/time';
import { ScheduleType } from '@/shared/types';

export const usePrayer = (type: ScheduleType, index: number = 0) => {
  const { schedule, isStandard } = useSchedule(type);

  const prayer = schedule.today[index];
  const isPassed = TimeUtils.isTimePassed(prayer.time);
  const isNext = index === schedule.nextIndex;

  const ui = {
    initialColorPos: isPassed || isNext ? 1 : 0,
  };

  return {
    ...prayer,
    isStandard,
    isPassed,
    isNext,
    ui,
  };
};
