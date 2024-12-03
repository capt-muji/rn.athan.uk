import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import * as TimeUtils from '@/shared/time';
import * as Types from '@/shared/types';
import { getOverlay } from '@/stores/overlay';
import { getSchedule, incrementNextIndex } from '@/stores/schedule';

const store = getDefaultStore();

let isStarted = false;

// Atoms
const createCountdownAtom = () =>
  atom<Types.CountdownStore>({
    time: '0s',
    name: 'Fajr',
  });

export const standardCountdownAtom = createCountdownAtom();
export const extraCountdownAtom = createCountdownAtom();
export const overlayCountdownAtom = createCountdownAtom();

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

export const updateOverlayCountdown = (type: Types.ScheduleType, prayerIndex: number) => {
  const schedule = getSchedule(type);
  const prayer = schedule.today[prayerIndex];
  const prayerDate = TimeUtils.getDateTodayOrTomorrow(Types.DaySelection.Today);
  const timeDiff = TimeUtils.getTimeDifference(prayer.time, prayerDate);

  store.set(overlayCountdownAtom, {
    time: TimeUtils.formatTime(timeDiff),
    name: prayer.english,
  });
};

export const startCountdowns = () => {
  if (isStarted) return;

  // Initial countdown updates
  updateCountdown(Types.ScheduleType.Standard);
  updateCountdown(Types.ScheduleType.Extra);

  // Start timers
  const updateAllCountdowns = () => {
    updateCountdown(Types.ScheduleType.Standard);
    updateCountdown(Types.ScheduleType.Extra);

    const overlay = getOverlay();
    updateOverlayCountdown(overlay.scheduleType, overlay.selectedPrayerIndex);
  };

  setInterval(updateAllCountdowns, 1000);
  isStarted = true;
};
