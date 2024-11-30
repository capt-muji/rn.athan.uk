import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';

import { PRAYERS_ENGLISH } from '@/shared/constants';
import {
  AlertPreferences,
  AlertType,
  ScheduleStore,
  AppStore,
  OverlayStore,
  SoundPreferences,
  ScheduleType,
  Measurements,
} from '@/shared/types';
import { database } from '@/stores/database';

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

// Initial states for alerts
const createInitialAlertPreferences = (): AlertPreferences => {
  const preferences: AlertPreferences = {};
  PRAYERS_ENGLISH.forEach((_, index) => {
    preferences[index] = AlertType.Off;
  });
  return preferences;
};

export const alertPreferencesAtom = atomWithStorage('alertPreferences', createInitialAlertPreferences(), mmkvStorage, {
  getOnInit: true,
});

// Add initial state for sound
const initialSoundPreferences: SoundPreferences = {
  selected: 1,
};

export const soundPreferencesAtom = atomWithStorage('soundPreferences', initialSoundPreferences, mmkvStorage, {
  getOnInit: true,
});

export const appAtom = atom<AppStore>({
  isLoading: true,
  hasError: false,
});

export const measurementsAtom = atom<Measurements>({
  date: null,
  list: null,
});

export const dateAtom = atom<string>('');

const createScheduleAtom = (scheduleType: ScheduleType) =>
  atom<ScheduleStore>({
    type: scheduleType,
    today: {},
    tomorrow: {},
    nextIndex: 0,
  });

export const standardScheduleAtom = createScheduleAtom(ScheduleType.Standard);
export const extraScheduleAtom = createScheduleAtom(ScheduleType.Extra);

export const overlayAtom = atom<OverlayStore>({
  isOn: false,
  selectedPrayerIndex: -1,
  scheduleType: ScheduleType.Standard,
});

export const pagePositionAtom = atom<number>(0);
