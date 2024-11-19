import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import { database } from '@/stores/database';
import { PRAYERS_ENGLISH } from '@/shared/constants';
import {
  AlertPreferences,
  AlertType,
  Preferences,
  ScheduleStore,
  AppStore,
  DateStore,
  OverlayStore,
  PrayerType
} from '@/shared/types';

// Custom storage for MMKV
const mmkvStorage = createJSONStorage(() => ({
  getItem: (key: string) => {
    const value = database.getString(key);
    return value ? JSON.parse(value) : null;
  },
  setItem: (key: string, value: unknown) => {
    database.set(key, JSON.stringify(value));
  },
  removeItem: (key: string) => {
    database.delete(key);
  },
}));

// Initial states
const createInitialAlertPreferences = (): AlertPreferences => {
  const preferences: AlertPreferences = {};
  PRAYERS_ENGLISH.forEach((_, index) => {
    preferences[index] = AlertType.Off;
  });
  return preferences;
};

const initialPreferences: Preferences = {
  alert: createInitialAlertPreferences(),
  language: 'en',
  athan: 0
};

// Core atoms
export const preferencesAtom = atomWithStorage('preferences', initialPreferences, mmkvStorage);

export const appAtom = atom<AppStore>({
  isLoading: true,
  hasError: false
});

export const dateAtom = atom<DateStore>({
  current: '',
  measurements: null
});

const createScheduleAtom = (scheduleType: PrayerType) => atom<ScheduleStore>({
  type: scheduleType,
  today: {},
  tomorrow: {},
  nextIndex: -1,
  selectedIndex: -1,
  measurements: {},
  nextIndexMeasurements: null
});

export const standardScheduleAtom = createScheduleAtom(PrayerType.Standard);
export const extraScheduleAtom = createScheduleAtom(PrayerType.Extra);

export const overlayAtom = atom<OverlayStore>({
  isOn: false
});