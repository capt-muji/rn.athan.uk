import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import * as Types from '@/shared/types';

// Atoms
export const measurementsAtom = atom<Types.Measurements>({
  date: null,
  list: null,
});

export const pagePositionAtom = atom<number>(0);

export const overlayAtom = atom<Types.OverlayStore>({
  isOn: false,
  selectedPrayerIndex: 0,
  scheduleType: Types.ScheduleType.Standard,
});

// Actions
const store = getDefaultStore();

export const getOverlay = () => store.get(overlayAtom);

export const setMeasurement = (key: keyof Types.Measurements, measurements: Types.PageCoordinates) => {
  const current = store.get(measurementsAtom);
  store.set(measurementsAtom, { ...current, [key]: measurements });
};

export const toggleOverlay = () => {
  const overlay = getOverlay();
  store.set(overlayAtom, { ...overlay, isOn: !overlay.isOn });
};

export const setSelectedPrayerIndex = (index: number, scheduleType: Types.ScheduleType) => {
  const overlay = getOverlay();
  store.set(overlayAtom, { ...overlay, selectedPrayerIndex: index, scheduleType });
};
