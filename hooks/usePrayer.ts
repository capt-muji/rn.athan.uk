import { useAtomValue } from 'jotai';

import { useSchedule } from '@/hooks/useSchedule';
import * as TimeUtils from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/overlay';

export const usePrayer = (type: ScheduleType, index: number = 0) => {
  const { schedule, isStandard } = useSchedule(type);

  const overlay = useAtomValue(overlayAtom);

  const todayPrayer = schedule.today[index];
  const tomorrowPrayer = schedule.tomorrow[index];

  const isPassed = TimeUtils.isTimePassed(todayPrayer.time);
  const isNext = index === schedule.nextIndex;
  const isOnOverlay = overlay.isOn && overlay.selectedPrayerIndex === index && overlay.scheduleType === type;

  // Use tomorrow's prayer if the current prayer is passed and shown in overlay
  const prayer = isPassed && isOnOverlay ? tomorrowPrayer : todayPrayer;

  const ui = {
    initialColorPos: isPassed || isNext ? 1 : 0,
  };

  return {
    ...prayer,
    isStandard,
    isPassed,
    isNext,
    isOnOverlay,
    ui,
  };
};
