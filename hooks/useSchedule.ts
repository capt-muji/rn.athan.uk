import { useAtomValue } from 'jotai';

import * as TimeUtils from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { getScheduleMutedState } from '@/stores/notifications';
import { standardScheduleAtom, extraScheduleAtom } from '@/stores/schedule';
import { getTempMutedAtom } from '@/stores/ui';

export const useSchedule = (type: ScheduleType) => {
  const isStandard = type === ScheduleType.Standard;

  const schedule = useAtomValue(isStandard ? standardScheduleAtom : extraScheduleAtom);
  const tempMuted = useAtomValue(getTempMutedAtom(type));
  const persistedMuted = getScheduleMutedState(type);

  // Use the temporary override if set, otherwise fall back to persisted
  const currentMuted = tempMuted !== null ? tempMuted : persistedMuted;

  const lastIndex = Object.keys(schedule.today).length - 1;
  const lastPrayer = schedule.today[lastIndex];
  const isLastPrayerPassed = TimeUtils.isTimePassed(lastPrayer.time);

  return {
    schedule,
    isStandard,
    isLastPrayerPassed,
    persistedMuted,
    currentMuted,
  };
};
