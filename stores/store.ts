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

export const scheduleAtom = atom<ScheduleStore>({
  today: {},
  tomorrow: {},
  nextIndex: 0,
  selectedIndex: -1,
});

export const overlayAtom = atom<OverlayStore>({
  isOn: false
});