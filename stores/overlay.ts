import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import { Measurements, OverlayStore, PageCoordinates, ScheduleType } from '@/shared/types';
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
  const timerAtom = type === ScheduleType.Standard ? standardTimerAtom : extraTimerAtom;
  const timeLeft = store.get(timerAtom).timeLeft;
  return timeLeft > 2;
};

const setMeasurement = (key: keyof Measurements, measurements: PageCoordinates) => {
  const current = store.get(measurementsAtom);
  store.set(measurementsAtom, { ...current, [key]: measurements });
};

const toggleOverlay = () => {
  const overlay = store.get(overlayAtom);

  // Don't allow opening if timer is too low
  if (!overlay.isOn && !canShowOverlay(overlay.scheduleType)) return;

  store.set(overlayAtom, { ...overlay, isOn: !overlay.isOn });
};

const setSelectedPrayerIndex = (scheduleType: ScheduleType, index: number) => {
  if (!canShowOverlay(scheduleType)) return;

  const overlay = store.get(overlayAtom);
  store.set(overlayAtom, { ...overlay, selectedPrayerIndex: index, scheduleType });
  startTimerOverlay();
};

export { setMeasurement, toggleOverlay, setSelectedPrayerIndex, canShowOverlay };
