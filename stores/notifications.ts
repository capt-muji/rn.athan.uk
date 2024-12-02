import { atomWithStorage } from 'jotai/utils';
import { getDefaultStore } from 'jotai/vanilla';

import * as Constants from '@/shared/constants';
import * as Types from '@/shared/types';
import * as Database from '@/stores/database';

// Atoms
const createInitialAlertPreferences = (): Types.AlertPreferences => {
  const preferences: Types.AlertPreferences = {};
  Constants.PRAYERS_ENGLISH.forEach((_, index) => {
    preferences[index] = Types.AlertType.Off;
  });
  return preferences;
};

export const alertPreferencesAtom = atomWithStorage(
  'alertPreferences',
  createInitialAlertPreferences(),
  Database.mmkvStorage,
  { getOnInit: true }
);

export const soundPreferencesAtom = atomWithStorage<number>('soundPreferences', 0, Database.mmkvStorage);

// Actions
const store = getDefaultStore();

/** Gets alert preferences */
export const getAlertPreferences = () => store.get(alertPreferencesAtom);

/** Gets sound preferences */
export const getSoundPreferences = () => store.get(soundPreferencesAtom);

/** Updates alert preference for prayer */
export const setAlertPreference = (prayerIndex: number, alertType: Types.AlertType) => {
  const alertPreference = getAlertPreferences();
  store.set(alertPreferencesAtom, { ...alertPreference, [prayerIndex]: alertType });
};

/** Updates selected notification sound */
export const setSelectedSound = (soundIndex: number) => {
  store.set(soundPreferencesAtom, soundIndex);
};
