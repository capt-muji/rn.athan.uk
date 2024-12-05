import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import * as TimeUtils from '@/shared/time';
import { CountdownStore, ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/overlay';
import { getSchedule, incrementNextIndex } from '@/stores/schedule';
import { dateAtom, sync } from '@/stores/sync';

const store = getDefaultStore();

// --- Atoms ---

const createCountdownAtom = () => atom<CountdownStore>({ timeLeft: 10, name: 'Fajr' });

export const standardCountdownAtom = createCountdownAtom();
export const extraCountdownAtom = createCountdownAtom();
export const overlayCountdownAtom = createCountdownAtom();

// --- Actions ---

const updateCountdown = (type: ScheduleType) => {
  const isStandard = type === ScheduleType.Standard;
  const countdownAtom = isStandard ? standardCountdownAtom : extraCountdownAtom;

  const schedule = getSchedule(type);
  const prayer = schedule.today[schedule.nextIndex];
  const countdown = TimeUtils.calculateCountdown(prayer);

  store.set(countdownAtom, { timeLeft: countdown.timeLeft, name: countdown.name });

  // Start new countdown
  TimeUtils.countdown(countdown.timeLeft, {
    onTick: (secondsLeft) => {
      store.set(countdownAtom, { timeLeft: secondsLeft, name: countdown.name });
    },
    onFinish: () => {
      incrementNextIndex(type);

      const { nextIndex } = getSchedule(type);
      if (nextIndex === 0) return checkMidnight();

      updateCountdown(type);
    },
  });
};

export const updateOverlayCountdown = (type: ScheduleType, selectedIndex: number) => {
  const schedule = getSchedule(type);
  const prayer = schedule.today[selectedIndex];

  const countdown = TimeUtils.calculateCountdown(prayer);

  // Start new countdown
  TimeUtils.countdown(countdown.timeLeft, {
    onTick: (secondsLeft) => {
      store.set(overlayCountdownAtom, { timeLeft: secondsLeft, name: countdown.name });
    },
    onFinish: () => {},
  });

  store.set(overlayCountdownAtom, { timeLeft: countdown.timeLeft, name: countdown.name });
};

// Refreshes the schedules at midnight
const checkMidnight = () => {
  const savedDate = store.get(dateAtom);

  setInterval(() => {
    const currentDate = TimeUtils.formatDateShort(TimeUtils.createLondonDate());
    if (currentDate !== savedDate) sync();
  }, 1000);
};

export const startCountdowns = () => {
  const standardSchedule = getSchedule(ScheduleType.Standard);

  const isScheduleFinishedStandard = TimeUtils.isLastPrayerPassed(standardSchedule);
  const isScheduleFinishedExtra = TimeUtils.isLastPrayerPassed(standardSchedule);

  if (!isScheduleFinishedStandard) updateCountdown(ScheduleType.Standard);
  if (!isScheduleFinishedExtra) updateCountdown(ScheduleType.Extra);
  if (isScheduleFinishedStandard && isScheduleFinishedStandard) checkMidnight();

  const overlay = store.get(overlayAtom);
  updateOverlayCountdown(overlay.scheduleType, overlay.selectedPrayerIndex);
};
