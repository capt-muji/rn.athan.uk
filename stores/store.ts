import { atom } from 'jotai';
import { IScheduleNow } from '@/shared/types';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import { jotaiStorage } from '@/stores/database';
import { PRAYERS_ENGLISH } from '@/shared/constants';

// App Status
export const isLoadingAtom = atom<boolean>(true);
export const hasErrorAtom = atom<boolean>(false);

// Overlay State
export const overlayVisibleAtom = atom<boolean>(false);

// Measurement Types
export interface PageCoordinates {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
}

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

// Schedule State
export const scheduleStandardTodayAtom = atom<IScheduleNow>({});
export const scheduleStandardTomorrowAtom = atom<IScheduleNow>({});
export const scheduleStandardNextIndexAtom = atom<number>(-1);
export const scheduleStandardSelectedIndexAtom = atom<number>(-1);

export const scheduleExtraTodayAtom = atom<IScheduleNow>({});
export const scheduleExtraTomorrowAtom = atom<IScheduleNow>({});
export const scheduleExtraNextIndexAtom = atom<number>(-1);
export const scheduleExtraSelectedIndexAtom = atom<number>(-1);

export const dateAtom = atom<string>('');

// Measurements
export const absoluteDateMeasurementsAtom = atom<PageCoordinates| null>(null);

export const absoluteStandardMeasurementsAtom = atom<Record<number, PageCoordinates>>({});
export const absoluteExtraMeasurementsAtom = atom<Record<number, PageCoordinates>>({});

export const absoluteStandardNextIndexMeasurementsAtom = atom<PageCoordinates | null>(null);
export const absoluteExtraNextIndexMeasurementsAtom = atom<PageCoordinates | null>(null);