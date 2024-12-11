import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import * as TimeUtils from '@/shared/time';
import { Measurements, OverlayStore, PageCoordinates, ScheduleType } from '@/shared/types';
import { getSchedule } from '@/stores/schedule';
import { startTimerOverlay, standardTimerAtom, extraTimerAtom } from '@/stores/timer';

const store = getDefaultStore();

// --- Atoms ---

export const measurementsAtom = atom<Measurements>({
  date: null,
  list: null,
});

export const overlayAtom = atom<OverlayStore>({
  isOn: false,
  selectedPrayerIndex: 0,
  scheduleType: ScheduleType.Standard,
});

// --- Actions ---

const canShowOverlay = (type: ScheduleType): boolean => {
  const schedule = getSchedule(type);
  if (TimeUtils.isLastPrayerPassed(schedule)) return true;

  const timerAtom = type === ScheduleType.Standard ? standardTimerAtom : extraTimerAtom;
  const timeLeft = store.get(timerAtom).timeLeft;
  return timeLeft > 2;
};

const setMeasurement = (key: keyof Measurements, measurements: PageCoordinates) => {
  const current = store.get(measurementsAtom);
  store.set(measurementsAtom, { ...current, [key]: measurements });
};

const toggleOverlay = (force?: boolean) => {
  const overlay = store.get(overlayAtom);
  const newState = force !== undefined ? force : !overlay.isOn;

  // Don't allow opening if timer is too low
  if (!overlay.isOn && newState && !canShowOverlay(overlay.scheduleType)) return;

  store.set(overlayAtom, { ...overlay, isOn: newState });
};

const setSelectedPrayerIndex = (scheduleType: ScheduleType, index: number) => {
  if (!canShowOverlay(scheduleType)) return;

  const overlay = store.get(overlayAtom);
  store.set(overlayAtom, { ...overlay, selectedPrayerIndex: index, scheduleType });
  startTimerOverlay();
};

export { setMeasurement, toggleOverlay, setSelectedPrayerIndex, canShowOverlay };
