import { getDefaultStore } from 'jotai/vanilla';

import { measurementsAtom, overlayAtom } from './atoms';

import { Measurements, PageCoordinates, ScheduleType } from '@/shared/types';

const store = getDefaultStore();

/** Gets overlay state */
export const getOverlay = () => store.get(overlayAtom);

/** Updates UI measurements */
export const setMeasurement = (key: keyof Measurements, measurements: PageCoordinates) => {
  const current = store.get(measurementsAtom);
  store.set(measurementsAtom, { ...current, [key]: measurements });
};

/** Toggles overlay visibility */
export const toggleOverlay = () => {
  const overlay = getOverlay();
  store.set(overlayAtom, { ...overlay, isOn: !overlay.isOn });
};

/** Updates selected prayer in overlay */
export const setSelectedPrayerIndex = (index: number, scheduleType: ScheduleType) => {
  const overlay = getOverlay();
  store.set(overlayAtom, { ...overlay, selectedPrayerIndex: index, scheduleType });
};
