import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage, loadable } from 'jotai/utils';

import { PRAYERS_ENGLISH } from '@/shared/constants';
import {
  AlertPreferences,
  AlertType,
  ScheduleStore,
  OverlayStore,
  ScheduleType,
  Measurements,
  FetchedYears,
} from '@/shared/types';
import * as Actions from '@/stores/actions';
import * as Database from '@/stores/database';

/** Custom storage implementation for MMKV with JSON serialization */
const mmkvStorage = createJSONStorage(() => ({
  getItem: (key: string) => {
    const value = Database.database.getString(key);
    return value ? JSON.parse(value) : null;
  },
  setItem: (key: string, value: unknown) => {
    Database.database.set(key, JSON.stringify(value));
  },
  removeItem: (key: string) => {
    Database.database.delete(key);
  },
}));

/** Creates initial alert preferences with all prayers set to Off */
const createInitialAlertPreferences = (): AlertPreferences => {
  const preferences: AlertPreferences = {};
  PRAYERS_ENGLISH.forEach((_, index) => {
    preferences[index] = AlertType.Off;
  });
  return preferences;
};

/** Atom for storing user's alert preferences for each prayer */
export const alertPreferencesAtom = atomWithStorage('alertPreferences', createInitialAlertPreferences(), mmkvStorage, {
  getOnInit: true,
});

/** Atom for storing user's sound preferences */
export const soundPreferencesAtom = atomWithStorage(
  'soundPreferences',
  {
    selected: 1,
  },
  mmkvStorage,
  {
    getOnInit: true,
  }
);

/** Atom for storing UI measurement coordinates */
export const measurementsAtom = atom<Measurements>({
  date: null,
  list: null,
});

/** Atom for storing current date */
export const dateAtom = atomWithStorage('date', '', mmkvStorage, { getOnInit: true });

/** Creates initial prayer data */
const initialPrayer = (scheduleType: ScheduleType) => ({
  index: 0,
  date: '2024-11-15',
  english: 'Fajr',
  arabic: 'الفجر',
  time: '05:35',
  type: scheduleType,
});

/** Creates a prayer schedule atom with initial state */
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

/** Atom for standard prayer schedule */
export const standardScheduleAtom = createScheduleAtom(ScheduleType.Standard);

/** Atom for extra prayer schedule */
export const extraScheduleAtom = createScheduleAtom(ScheduleType.Extra);

/** Atom for overlay state management */
export const overlayAtom = atom<OverlayStore>({
  isOn: false,
  selectedPrayerIndex: 0,
  scheduleType: ScheduleType.Standard,
});

/** Atom for page scroll position */
export const pagePositionAtom = atom<number>(0);

/** Atom for tracking fetched years */
export const fetchedYearsAtom = atomWithStorage<FetchedYears>('fetchedYears', {}, mmkvStorage, {
  getOnInit: true,
});

/** Loadable atom for initializing prayer data */
export const initialiseLoadable = loadable(atom(async () => Actions.refresh()));
