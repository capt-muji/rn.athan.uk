
import { useAtomValue } from 'jotai';
import { standardScheduleAtom, extraScheduleAtom } from '@/stores/store';
import { ScheduleType } from '@/shared/types';
import { isTimePassed } from '@/shared/time';

export const usePrayer = (index: number, type: ScheduleType) => {
  const isStandard = type === ScheduleType.Standard;

  const schedule = useAtomValue(isStandard ? standardScheduleAtom : extraScheduleAtom);

  const prayer = schedule.today[index];
  const isPassed = isTimePassed(prayer.time);
  const isNext = index === schedule.nextIndex;

  const ui = {
    initialColorPos: isPassed || isNext ? 1 : 0
  };

  return {
    ...prayer,
    isStandard,
    schedule,
    isPassed,
    isNext,
    ui
  };
};