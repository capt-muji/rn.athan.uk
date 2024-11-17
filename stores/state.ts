import { atom } from 'jotai';
import { IScheduleNow } from '@/types/prayers';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import { jotaiStorage } from '@/storage/storage';
import { PRAYERS_ENGLISH } from '@/constants';

// App Status
export const isLoadingAtom = atom<boolean>(true);
export const hasErrorAtom = atom<boolean>(false);

// Prayer Data
export const dateAtom = atom<string>('');
export const todaysPrayersAtom = atom<IScheduleNow>({});
export const tomorrowsPrayersAtom = atom<IScheduleNow>({});
export const nextPrayerIndexAtom = atom<number>(-1);
export const selectedPrayerIndexAtom = atom<number>(-1);

// Overlay State
export const overlayVisibleAtom = atom<boolean>(false);
export const overlayStartOpeningAtom = atom<boolean>(false);
export const overlayFinishedOpeningAtom = atom<boolean>(false);
export const overlayStartClosingAtom = atom<boolean>(false);
export const overlayFinishedClosingAtom = atom<boolean>(false);
export const overlayControlsAtom = atom<{
  open?: () => void;
  close?: () => void;
}>({});

// Measurement Types
export interface PageCoordinates {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
}

// Measurements State
export const absoluteNextPrayerMeasurementsAtom = atom<PageCoordinates | null>(null);
export const absolutePrayerMeasurementsAtom = atom<Record<number, PageCoordinates>>({});
export const absoluteDateMeasurementsAtom = atom<PageCoordinates| null>(null);

// Alert Preferences
export enum AlertType {
  Off = 0,
  Notification = 1,
  Vibrate = 2,
  Sound = 3
}

export interface AlertPreferences {
  [prayerIndex: number]: AlertType;
}

const createInitialAlertPreferences = (): AlertPreferences => {
  const preferences: AlertPreferences = {};
  
  PRAYERS_ENGLISH.forEach((_, index) => {
    preferences[index] = AlertType.Off;
  });

  return preferences;
};

export const alertPreferencesAtom = atomWithStorage<AlertPreferences>(
  'alert_preferences',
  createInitialAlertPreferences(),
  createJSONStorage(() => jotaiStorage),
  { getOnInit: true }
);