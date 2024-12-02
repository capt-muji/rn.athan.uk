import { atom } from 'jotai';

import { ScheduleStore, ScheduleType } from '@/shared/types';

/** Creates initial prayer data */
const initialPrayer = (scheduleType: ScheduleType) => ({
  index: 0,
  date: '2024-11-15',
  english: 'Fajr',
  arabic: 'الفجر',
  time: '05:35',
  type: scheduleType,
});

/** Creates a prayer schedule atom */
const createScheduleAtom = (scheduleType: ScheduleType) =>
  atom<ScheduleStore>({
    type: scheduleType,
    today: {
      0: initialPrayer(scheduleType),
    },
    tomorrow: {
      0: initialPrayer(scheduleType),
    },
    nextIndex: 0,
  });

/** Standard prayer schedule */
export const standardScheduleAtom = createScheduleAtom(ScheduleType.Standard);

/** Extra prayer schedule */
export const extraScheduleAtom = createScheduleAtom(ScheduleType.Extra);
