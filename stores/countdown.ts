import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import * as TimeUtils from '@/shared/time';
import * as Types from '@/shared/types';
import { getSchedule, incrementNextIndex } from '@/stores/schedule';

const store = getDefaultStore();

let isSetup = false;

// Atoms
const createCountdownAtom = () =>
  atom<Types.CountdownStore>({
    time: '0s',
    name: 'Fajr',
  });

export const standardCountdownAtom = createCountdownAtom();
export const extraCountdownAtom = createCountdownAtom();

// Actions
const updateCountdown = (type: Types.ScheduleType) => {
  const isStandard = type === Types.ScheduleType.Standard;

  const schedule = getSchedule(type);
  const prayer = schedule.today[schedule.nextIndex];
  const prayerDate = TimeUtils.getDateTodayOrTomorrow(Types.DaySelection.Today);
  const timeDiff = TimeUtils.getTimeDifference(prayer.time, prayerDate);

  if (timeDiff <= 500) return incrementNextIndex(type);

  const countdownAtom = isStandard ? standardCountdownAtom : extraCountdownAtom;
  store.set(countdownAtom, {
    time: TimeUtils.formatTime(timeDiff),
    name: prayer.english,
  });
};

export const setupCountdowns = () => {
  // Prevent multiple setups
  if (isSetup) return;

  // Initial countdown updates
  updateCountdown(Types.ScheduleType.Standard);
  updateCountdown(Types.ScheduleType.Extra);

  // Start timers
  const updateAllCountdowns = () => {
    updateCountdown(Types.ScheduleType.Standard);
    updateCountdown(Types.ScheduleType.Extra);
  };

  setInterval(updateAllCountdowns, 1000);

  isSetup = true;
};
