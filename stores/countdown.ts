import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import * as TimeUtils from '@/shared/time';
import * as Types from '@/shared/types';
import { getOverlay } from '@/stores/overlay';
import { getSchedule } from '@/stores/schedule';

const store = getDefaultStore();

let intervalId: NodeJS.Timeout;

// --- Atoms ---

const createCountdownAtom = () =>
  atom<Types.CountdownStore>({
    time: 1000,
    name: 'Fajr',
  });

export const standardCountdownAtom = createCountdownAtom();
export const extraCountdownAtom = createCountdownAtom();
export const overlayCountdownAtom = createCountdownAtom();

// --- Actions ---

const updateCountdown = (type: Types.ScheduleType) => {
  const isStandard = type === Types.ScheduleType.Standard;
  const schedule = getSchedule(type);
  const prayer = schedule.today[schedule.nextIndex];

  const countdown = TimeUtils.calculateCountdown(prayer);

  // TODO: Fix this
  // if (countdown.hasElapsed) return incrementNextIndex(type);

  const countdownAtom = isStandard ? standardCountdownAtom : extraCountdownAtom;
  store.set(countdownAtom, { time: countdown.time, name: countdown.name });
};

export const updateOverlayCountdown = (type: Types.ScheduleType, selectedIndex: number) => {
  const schedule = getSchedule(type);
  const prayer = schedule.today[selectedIndex];

  const countdown = TimeUtils.calculateCountdown(prayer);
  store.set(overlayCountdownAtom, { time: countdown.time, name: countdown.name });
};

const updateAllCountdowns = () => {
  updateCountdown(Types.ScheduleType.Standard);
  updateCountdown(Types.ScheduleType.Extra);

  const overlay = getOverlay();
  updateOverlayCountdown(overlay.scheduleType, overlay.selectedPrayerIndex);
};

export const startCountdowns = () => {
  // Clean up any existing interval first
  stopCountdowns();

  // Initial countdown updates
  updateAllCountdowns();

  // Start countdown
  intervalId = setInterval(updateAllCountdowns, 1000);
};

export const stopCountdowns = () => {
  if (intervalId) clearInterval(intervalId);
};
