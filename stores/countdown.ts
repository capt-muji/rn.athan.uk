import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import { overlayAtom } from './overlay';

import * as TimeUtils from '@/shared/time';
import { CountdownStore, ScheduleType } from '@/shared/types';
import { getSchedule, incrementNextIndex } from '@/stores/schedule';
import { dateAtom, sync } from '@/stores/sync';

const store = getDefaultStore();

const timers: {
  [key: string]: ReturnType<typeof setInterval> | undefined;
} = {
  standard: undefined,
  extra: undefined,
  overlay: undefined,
  midnight: undefined,
};

// --- Initial values ---

const createInitialCountdown = (): CountdownStore => ({ timeLeft: 10, name: 'Fajr' });

// --- Atoms ---

export const standardCountdownAtom = atom<CountdownStore>(createInitialCountdown());
export const extraCountdownAtom = atom<CountdownStore>(createInitialCountdown());
export const overlayCountdownAtom = atom<CountdownStore>(createInitialCountdown());

// --- Timer Controls ---
const clearTimer = (timerKey: string) => {
  if (!timers[timerKey]) return;

  clearInterval(timers[timerKey]);
  delete timers[timerKey];
};

const startTimerSchedule = (type: ScheduleType, timeLeft: number, name: string) => {
  const isStandard = type === ScheduleType.Standard;
  const timerKey = isStandard ? 'standard' : 'extra';
  const countdownAtom = isStandard ? standardCountdownAtom : extraCountdownAtom;

  clearTimer(timerKey);
  store.set(countdownAtom, { timeLeft, name });

  timers[timerKey] = setInterval(() => {
    const currentTime = store.get(countdownAtom).timeLeft - 1;

    if (currentTime <= 0) {
      clearTimer(timerKey);
      incrementNextIndex(type);

      const { nextIndex } = getSchedule(type);

      if (nextIndex === 0) return startTimerMidnight();
      return updateTimerSchedule(type);
    }

    store.set(countdownAtom, { timeLeft: currentTime, name });
  }, 1000);
};

const startTimerOverlay = (timeLeft: number, name: string) => {
  clearTimer('overlay');
  store.set(overlayCountdownAtom, { timeLeft, name });

  timers['overlay'] = setInterval(() => {
    const currentTime = store.get(overlayCountdownAtom).timeLeft - 1;
    if (currentTime <= 0) return clearTimer('overlay');

    store.set(overlayCountdownAtom, { timeLeft: currentTime, name });
  }, 1000);
};

const startTimerMidnight = () => {
  clearTimer('midnight');
  const savedDate = store.get(dateAtom);

  timers['midnight'] = setInterval(() => {
    const currentDate = TimeUtils.formatDateShort(TimeUtils.createLondonDate());

    if (currentDate !== savedDate) sync();
  }, 1000);
};

// --- Prayer Schedule Handlers ---
const updateTimerSchedule = (type: ScheduleType) => {
  const schedule = getSchedule(type);
  const prayer = schedule.today[schedule.nextIndex];
  const { timeLeft, name } = TimeUtils.calculateCountdown(prayer);
  startTimerSchedule(type, timeLeft, name);
};

// --- Public API ---
export const startCountdowns = () => {
  const standardSchedule = getSchedule(ScheduleType.Standard);
  const extraSchedule = getSchedule(ScheduleType.Extra);

  const isStandardFinished = TimeUtils.isLastPrayerPassed(standardSchedule);
  const isExtraFinished = TimeUtils.isLastPrayerPassed(extraSchedule);

  if (!isStandardFinished) updateTimerSchedule(ScheduleType.Standard);
  if (!isExtraFinished) updateTimerSchedule(ScheduleType.Extra);

  if (isStandardFinished && isExtraFinished) startTimerMidnight();

  updateTimerOverlay();
};

export const updateTimerOverlay = () => {
  const overlay = store.get(overlayAtom);

  const prayer = getSchedule(overlay.scheduleType).today[overlay.selectedPrayerIndex];
  const { timeLeft, name } = TimeUtils.calculateCountdown(prayer);

  startTimerOverlay(timeLeft, name);
};
