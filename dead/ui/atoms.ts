import { atom } from 'jotai';

import { Measurements, OverlayStore, ScheduleType } from '@/shared/types';

/** UI measurement coordinates */
export const measurementsAtom = atom<Measurements>({
  date: null,
  list: null,
});

/** Page scroll position */
export const pagePositionAtom = atom<number>(0);

/** Overlay state management */
export const overlayAtom = atom<OverlayStore>({
  isOn: false,
  selectedPrayerIndex: 0,
  scheduleType: ScheduleType.Standard,
});
