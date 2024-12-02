import { atomWithStorage } from 'jotai/utils';

import { mmkvStorage } from '../../stores/core/store';

import { PRAYERS_ENGLISH } from '@/shared/constants';
import { AlertPreferences, AlertType } from '@/shared/types';

/** Creates initial alert preferences */
const createInitialAlertPreferences = (): AlertPreferences => {
  const preferences: AlertPreferences = {};
  PRAYERS_ENGLISH.forEach((_, index) => {
    preferences[index] = AlertType.Off;
  });
  return preferences;
};

/** Alert preferences storage */
export const alertPreferencesAtom = atomWithStorage('alertPreferences', createInitialAlertPreferences(), mmkvStorage, {
  getOnInit: true,
});

/** Sound preferences storage */
export const soundPreferencesAtom = atomWithStorage('soundPreferences', { selected: 1 }, mmkvStorage, {
  getOnInit: true,
});
