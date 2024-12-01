import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage, loadable } from 'jotai/utils';

import * as Api from '@/api/client';
import { PRAYERS_ENGLISH } from '@/shared/constants';
import {
  AlertPreferences,
  AlertType,
  ScheduleStore,
  OverlayStore,
  SoundPreferences,
  ScheduleType,
  Measurements,
} from '@/shared/types';
import { database } from '@/stores/database';
import * as Database from '@/stores/database';

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

export const measurementsAtom = atom<Measurements>({
  date: null,
  list: null,
});

export const dateAtom = atom<string>('');

const initialPrayer = (scheduleType: ScheduleType) => ({
  index: 0,
  date: '2024-11-15',
  english: 'Fajr',
  arabic: 'الفجر',
  time: '05:35',
  type: scheduleType,
});

const createScheduleAtom = (scheduleType: ScheduleType) =>
  atom<ScheduleStore>({
    type: scheduleType,
    today: {
      0: initialPrayer(scheduleType),
    },
    tomorrow: {
      0: initialPrayer(scheduleType),
    },
    nextIndex: 0,
  });

export const standardScheduleAtom = createScheduleAtom(ScheduleType.Standard);
export const extraScheduleAtom = createScheduleAtom(ScheduleType.Extra);

export const overlayAtom = atom<OverlayStore>({
  isOn: false,
  selectedPrayerIndex: 0,
  scheduleType: ScheduleType.Standard,
});

export const pagePositionAtom = atom<number>(0);

const refreshAtom = atom(async () => {
  const data = await Api.handle();
  Database.saveAll(data);
});

export const refreshLoadable = loadable(refreshAtom);
