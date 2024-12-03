import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';
import { LogBox } from 'react-native';

import * as Types from '@/shared/types';
import { updateOverlayCountdown } from '@/stores/countdown';

LogBox.ignoreLogs(['Require cycle:']);

const store = getDefaultStore();

// Atoms
export const measurementsAtom = atom<Types.Measurements>({
  date: null,
  list: null,
});

export const overlayAtom = atom<Types.OverlayStore>({
  isOn: false,
  selectedPrayerIndex: 0,
  scheduleType: Types.ScheduleType.Standard,
});

// Actions
export const getMeasuements = () => store.get(measurementsAtom);
export const getOverlay = () => store.get(overlayAtom);

export const setMeasurement = (key: keyof Types.Measurements, measurements: Types.PageCoordinates) => {
  const current = getMeasuements();
  store.set(measurementsAtom, { ...current, [key]: measurements });
};

export const toggleOverlay = () => {
  const overlay = getOverlay();
  store.set(overlayAtom, { ...overlay, isOn: !overlay.isOn });
};

export const setSelectedPrayerIndex = (scheduleType: Types.ScheduleType, index: number) => {
  updateOverlayCountdown(scheduleType, index);

  const overlay = getOverlay();

  store.set(overlayAtom, { ...overlay, selectedPrayerIndex: index, scheduleType });
};
