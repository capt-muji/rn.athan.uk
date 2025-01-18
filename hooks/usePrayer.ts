import { useAtomValue } from 'jotai';

import { useSchedule } from '@/hooks/useSchedule';
import * as TimeUtils from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { syncTriggerAtom } from '@/stores/ui';

export const usePrayer = (type: ScheduleType, index = 0, isOverlay = false) => {
  useAtomValue(syncTriggerAtom);

  const { schedule, isStandard } = useSchedule(type);

  const todayPrayer = schedule.today[index];
  const tomorrowPrayer = schedule.tomorrow[index];

  const isPassed = TimeUtils.isTimePassed(todayPrayer.time);
  const isNext = index === schedule.nextIndex;

  // Use tomorrow's prayer if the current prayer is passed and shown in overlay
  const prayer = isPassed && isOverlay ? tomorrowPrayer : todayPrayer;

  const ui = {
    initialColorPos: isPassed || isNext ? 1 : 0,
  };

  return {
    ...prayer,
    isStandard,
    isPassed,
    isNext,
    isOverlay,
    ui,
  };
};
