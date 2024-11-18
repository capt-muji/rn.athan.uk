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

const createScheduleAtoms = (type: PrayerType) => ({
  today: atom<IScheduleNow>({}),
  tomorrow: atom<IScheduleNow>({}),
  nextIndex: atom<number>(-1),
  selectedIndex: atom<number>(-1),
  measurements: atom<Record<number, PageCoordinates>>({}),
  nextIndexMeasurements: atom<PageCoordinates | null>(null),
});

export default {
  isLoading: atom(true),
  hasError: atom<boolean>(false),
  overlayVisible: atom<boolean>(false),
  date: atom<string>(''),
  preferences: atomWithStorage<Preferences>(
    'preferences',
    initialPreferences,
    createJSONStorage(() => jotaiStorage),
    { getOnInit: true }
  ),
  standard: createScheduleAtoms('standard'),
  extra: createScheduleAtoms('extra'),
  dateMeasurements: atom<PageCoordinates | null>(null),
};