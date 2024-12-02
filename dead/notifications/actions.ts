import { getDefaultStore } from 'jotai/vanilla';

import { alertPreferencesAtom, soundPreferencesAtom } from './atoms';

import { AlertType } from '@/shared/types';

const store = getDefaultStore();

/** Gets alert preferences */
export const getAlertPreferences = () => store.get(alertPreferencesAtom);

/** Gets sound preferences */
export const getSoundPreferences = () => store.get(soundPreferencesAtom);

/** Updates alert preference for prayer */
export const setAlertPreference = (prayerIndex: number, alertType: AlertType) => {
  const alertPreference = getAlertPreferences();
  store.set(alertPreferencesAtom, { ...alertPreference, [prayerIndex]: alertType });
};

/** Updates selected notification sound */
export const setSelectedSound = (soundIndex: number) => {
  const soundPreferences = getSoundPreferences();
  store.set(soundPreferencesAtom, { ...soundPreferences, selected: soundIndex });
};
