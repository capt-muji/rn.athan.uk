import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import * as TimeUtils from '@/shared/time';
import { CountdownStore, ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/overlay';
import { getSchedule, incrementNextIndex } from '@/stores/schedule';
import { dateAtom, sync } from '@/stores/sync';

const store = getDefaultStore();
const timers: { [key: string]: NodeJS.Timer } = {};

// --- Initial values ---

const createInitialCountdown = (): CountdownStore => ({ timeLeft: 10, name: 'Fajr' });

// --- Atoms ---

export const standardCountdownAtom = atom<CountdownStore>(createInitialCountdown());
export const extraCountdownAtom = atom<CountdownStore>(createInitialCountdown());
export const overlayCountdownAtom = atom<CountdownStore>(createInitialCountdown());

// --- Timer Controls ---
const clearTimer = (timerKey: string) => {
  if (timers[timerKey]) {
    clearInterval(timers[timerKey]);
    delete timers[timerKey];
  }
};

const startStandardTimer = (timeLeft: number, name: string) => {
  clearTimer('standard');
  store.set(standardCountdownAtom, { timeLeft, name });

  timers['standard'] = setInterval(() => {
    const currentTime = store.get(standardCountdownAtom).timeLeft - 1;
    if (currentTime <= 0) {
      clearTimer('standard');
      incrementNextIndex(ScheduleType.Standard);
      const { nextIndex } = getSchedule(ScheduleType.Standard);
      if (nextIndex === 0) return startMidnightTimer();
      startNextStandardPrayer();
      return;
    }
    store.set(standardCountdownAtom, { timeLeft: currentTime, name });
  }, 1000);
};

const startExtraTimer = (timeLeft: number, name: string) => {
  clearTimer('extra');
  store.set(extraCountdownAtom, { timeLeft, name });

  timers['extra'] = setInterval(() => {
    const currentTime = store.get(extraCountdownAtom).timeLeft - 1;
    if (currentTime <= 0) {
      clearTimer('extra');
      incrementNextIndex(ScheduleType.Extra);
      const { nextIndex } = getSchedule(ScheduleType.Extra);
      if (nextIndex === 0) return startMidnightTimer();
      startNextExtraPrayer();
      return;
    }
    store.set(extraCountdownAtom, { timeLeft: currentTime, name });
  }, 1000);
};

const startOverlayTimer = (timeLeft: number, name: string) => {
  clearTimer('overlay');
  store.set(overlayCountdownAtom, { timeLeft, name });

  timers['overlay'] = setInterval(() => {
    const currentTime = store.get(overlayCountdownAtom).timeLeft - 1;
    if (currentTime <= 0) {
      clearTimer('overlay');
      return;
    }
    store.set(overlayCountdownAtom, { timeLeft: currentTime, name });
  }, 1000);
};

const startMidnightTimer = () => {
  const savedDate = store.get(dateAtom);
  clearTimer('midnight');

  timers['midnight'] = setInterval(() => {
    const currentDate = TimeUtils.formatDateShort(TimeUtils.createLondonDate());
    if (currentDate !== savedDate) sync();
  }, 1000);
};

// --- Prayer Schedule Handlers ---
const startNextStandardPrayer = () => {
  const schedule = getSchedule(ScheduleType.Standard);
  const prayer = schedule.today[schedule.nextIndex];
  const { timeLeft, name } = TimeUtils.calculateCountdown(prayer);
  startStandardTimer(timeLeft, name);
};

const startNextExtraPrayer = () => {
  const schedule = getSchedule(ScheduleType.Extra);
  const prayer = schedule.today[schedule.nextIndex];
  const { timeLeft, name } = TimeUtils.calculateCountdown(prayer);
  startExtraTimer(timeLeft, name);
};

// --- Public API ---
export const startCountdowns = () => {
  const standardSchedule = getSchedule(ScheduleType.Standard);
  const extraSchedule = getSchedule(ScheduleType.Extra);

  if (!TimeUtils.isLastPrayerPassed(standardSchedule)) {
    startNextStandardPrayer();
  }

  if (!TimeUtils.isLastPrayerPassed(extraSchedule)) {
    startNextExtraPrayer();
  }

  if (TimeUtils.isLastPrayerPassed(standardSchedule) && TimeUtils.isLastPrayerPassed(extraSchedule)) {
    startMidnightTimer();
  }

  const overlay = store.get(overlayAtom);
  const prayer = getSchedule(overlay.scheduleType).today[overlay.selectedPrayerIndex];
  const { timeLeft, name } = TimeUtils.calculateCountdown(prayer);
  startOverlayTimer(timeLeft, name);
};

export const updateOverlayCountdown = (type: ScheduleType, selectedIndex: number) => {
  const schedule = getSchedule(type);
  const prayer = schedule.today[selectedIndex];
  const { timeLeft, name } = TimeUtils.calculateCountdown(prayer);
  startOverlayTimer(timeLeft, name);
};

export const cleanup = () => {
  ['standard', 'extra', 'overlay', 'midnight'].forEach(clearTimer);
};
