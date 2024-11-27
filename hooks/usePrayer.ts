import { useAtomValue } from 'jotai';

import * as PrayerUtils from '@/shared/prayer';
import * as TimeUtils from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { standardScheduleAtom, extraScheduleAtom } from '@/stores/store';

export const usePrayer = (index: number, type: ScheduleType) => {
  const isStandard = type === ScheduleType.Standard;

  const schedule = useAtomValue(isStandard ? standardScheduleAtom : extraScheduleAtom);

  const prayer = schedule.today[index];
  const isPassed = TimeUtils.isTimePassed(prayer.time);
  const isLastPrayerPassed = PrayerUtils.isLastPrayerPassed(schedule);
  const isNext = index === schedule.nextIndex;

  const ui = {
    initialColorPos: isPassed || isNext ? 1 : 0,
  };

  return {
    ...prayer,
    isStandard,
    schedule,
    isPassed,
    isNext,
    isLastPrayerPassed,
    ui,
  };
};
