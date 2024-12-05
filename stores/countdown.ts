import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import * as TimeUtils from '@/shared/time';
import { CountdownStore, ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/overlay';
import { getSchedule, incrementNextIndex } from '@/stores/schedule';
import { dateAtom, sync } from '@/stores/sync';

const store = getDefaultStore();

// --- Atoms ---

const createInitialCountdown = (): CountdownStore => ({ timeLeft: 10, name: 'Fajr' });

export const standardCountdownAtom = atom<CountdownStore>(createInitialCountdown());
export const extraCountdownAtom = atom<CountdownStore>(createInitialCountdown());
export const overlayCountdownAtom = atom<CountdownStore>(createInitialCountdown());

// --- Countdown Logic ---

const handleScheduleFinish = (type: ScheduleType) => {
  incrementNextIndex(type);

  const { nextIndex } = getSchedule(type);
  if (nextIndex === 0) return monitorMidnight();

  updateScheduleCountdown(type);
};

const updateCountdownState = (countdownAtom: typeof standardCountdownAtom, secondsLeft: number, name: string) => {
  store.set(countdownAtom, { timeLeft: secondsLeft, name });
};

const startCountdownTimer = (
  countdownAtom: typeof standardCountdownAtom,
  timeLeft: number,
  name: string,
  onFinish?: () => void
) => {
  updateCountdownState(countdownAtom, timeLeft, name);

  TimeUtils.countdown(timeLeft, {
    onTick: (secondsLeft) => updateCountdownState(countdownAtom, secondsLeft, name),
    onFinish: () => onFinish?.(),
  });
};

// --- Schedule Countdowns ---

const updateScheduleCountdown = (type: ScheduleType) => {
  const countdownAtom = type === ScheduleType.Standard ? standardCountdownAtom : extraCountdownAtom;
  const schedule = getSchedule(type);
  const prayer = schedule.today[schedule.nextIndex];
  const { timeLeft, name } = TimeUtils.calculateCountdown(prayer);

  startCountdownTimer(countdownAtom, timeLeft, name, () => handleScheduleFinish(type));
};

// --- Overlay Countdown ---

export const updateOverlayCountdown = (type: ScheduleType, selectedIndex: number) => {
  const schedule = getSchedule(type);
  const prayer = schedule.today[selectedIndex];
  const { timeLeft, name } = TimeUtils.calculateCountdown(prayer);

  startCountdownTimer(overlayCountdownAtom, timeLeft, name);
};

// --- Midnight Check ---

const monitorMidnight = () => {
  const savedDate = store.get(dateAtom);

  setInterval(() => {
    const currentDate = TimeUtils.formatDateShort(TimeUtils.createLondonDate());
    if (currentDate !== savedDate) sync();
  }, 1000);
};

// --- Public API ---

export const startCountdowns = () => {
  const standardSchedule = getSchedule(ScheduleType.Standard);
  const isScheduleFinishedStandard = TimeUtils.isLastPrayerPassed(standardSchedule);
  const isScheduleFinishedExtra = TimeUtils.isLastPrayerPassed(standardSchedule);

  if (!isScheduleFinishedStandard) updateScheduleCountdown(ScheduleType.Standard);
  if (!isScheduleFinishedExtra) updateScheduleCountdown(ScheduleType.Extra);
  if (isScheduleFinishedStandard && isScheduleFinishedExtra) monitorMidnight();

  const overlay = store.get(overlayAtom);
  updateOverlayCountdown(overlay.scheduleType, overlay.selectedPrayerIndex);
};
