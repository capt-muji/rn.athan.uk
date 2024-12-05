import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import { Measurements, OverlayStore, PageCoordinates, ScheduleType } from '@/shared/types';
import { updateOverlayCountdown } from '@/stores/countdown';

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

export const setMeasurement = (key: keyof Measurements, measurements: PageCoordinates) => {
  const current = store.get(measurementsAtom);
  store.set(measurementsAtom, { ...current, [key]: measurements });
};

export const toggleOverlay = () => {
  const overlay = store.get(overlayAtom);
  store.set(overlayAtom, { ...overlay, isOn: !overlay.isOn });
};

export const setSelectedPrayerIndex = (scheduleType: ScheduleType, index: number) => {
  updateOverlayCountdown(scheduleType, index);

  const overlay = store.get(overlayAtom);

  store.set(overlayAtom, { ...overlay, selectedPrayerIndex: index, scheduleType });
};
