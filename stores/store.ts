import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import { jotaiStorage } from '@/stores/database';
import { PRAYERS_ENGLISH } from '@/shared/constants';
import { 
  IScheduleNow, 
  PageCoordinates, 
  AlertPreferences,
  AlertType,
  PrayerType,
  Language,
  Preferences 
} from '@/shared/types';

// App
const createAppAtoms = () => ({
  isLoading: atom(true),
  isOverlayOn: atom(false),
  hasError: atom(false),
});

// Date
const createDateAtoms = () => ({
  current: atom(''),
  measurements: atom<PageCoordinates | null>(null),
});

// Schedules
const createScheduleAtoms = () => ({
  today: atom<IScheduleNow>({}),
  tomorrow: atom<IScheduleNow>({}),
  nextIndex: atom(-1),
  selectedIndex: atom(-1),
  measurements: atom<Record<number, PageCoordinates>>({}),
  nextIndexMeasurements: atom<PageCoordinates | null>(null),
});

// Preferences
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

const createPreferencesAtom = () => atomWithStorage<Preferences>(
  'preferences',
  initialPreferences,
  createJSONStorage(() => jotaiStorage),
  { getOnInit: true }
);

export default {
  app: createAppAtoms(),
  date: createDateAtoms(),
  preferences: createPreferencesAtom(),
  schedules: {
    standard: createScheduleAtoms(),
    extra: createScheduleAtoms(),
  },
};