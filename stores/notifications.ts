import { getDefaultStore } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import { PRAYERS_ENGLISH, EXTRAS_ENGLISH } from '@/shared/constants';
import * as Types from '@/shared/types';
import * as Database from '@/stores/database';

const store = getDefaultStore();

// Atoms
const createInitialAlertPreferences = (prayers: string[]): Types.AlertPreferences => {
  const preferences: Types.AlertPreferences = {};

  prayers.forEach((_, index) => {
    preferences[index] = Types.AlertType.Off;
  });

  return preferences;
};

export const standardAlertPreferencesAtom = atomWithStorage(
  'standardAlertPreferences',
  createInitialAlertPreferences(PRAYERS_ENGLISH),
  Database.mmkvStorage,
  { getOnInit: true }
);

export const extraAlertPreferencesAtom = atomWithStorage(
  'extraAlertPreferences',
  createInitialAlertPreferences(EXTRAS_ENGLISH),
  Database.mmkvStorage,
  { getOnInit: true }
);

// Actions
/** Gets alert preferences */
export const getAlertPreferences = (type: Types.ScheduleType) => {
  const isStandard = type === Types.ScheduleType.Standard;
  const alertPreferencesAtom = isStandard ? standardAlertPreferencesAtom : extraAlertPreferencesAtom;

  return store.get(alertPreferencesAtom);
};

/** Updates alert preference for prayer */
export const setAlertPreference = (
  scheduleType: Types.ScheduleType,
  prayerIndex: number,
  alertType: Types.AlertType
) => {
  const isStandard = scheduleType === Types.ScheduleType.Standard;
  const preferences = getAlertPreferences(scheduleType);
  const scheduleAtom = isStandard ? standardAlertPreferencesAtom : extraAlertPreferencesAtom;

  store.set(scheduleAtom, { ...preferences, [prayerIndex]: alertType });
};
