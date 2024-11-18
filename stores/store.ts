import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { database } from '@/stores/database';
import { PRAYERS_ENGLISH } from '@/shared/constants';
import { 
  AlertPreferences,
  AlertType,
  Preferences,
  ScheduleStore,
  PreferencesStore,
  AppStore,
  DateStore,
  SchedulesStore,
  OverlayStore
} from '@/shared/types';

const zustandStorage = {
  getItem: (name: string) => {
    const value = database.getString(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name: string, value: string) => {
    database.set(name, value);
  },
  removeItem: (name: string) => {
    database.delete(name);
  },
};

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

const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      preferences: initialPreferences,
      setPreferences: (value) => set({ preferences: value }),
    }),
    {
      name: 'preferences',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

const useAppStore = create<AppStore>((set) => ({
  isLoading: true,
  isOverlayOn: false,
  hasError: false,
  setIsLoading: (value) => set({ isLoading: value }),
  setIsOverlayOn: (value) => set({ isOverlayOn: value }),
  setHasError: (value) => set({ hasError: value }),
}));

const useDateStore = create<DateStore>((set) => ({
  current: '',
  measurements: null,
  setCurrent: (value) => set({ current: value }),
  setMeasurements: (value) => set({ measurements: value }),
}));

const createScheduleStore = (set: any, path: 'standard' | 'extra'): ScheduleStore => ({
  today: {},
  tomorrow: {},
  nextIndex: -1,
  selectedIndex: -1,
  measurements: {},
  nextIndexMeasurements: null,
  setToday: (value) => set((state: SchedulesStore) => ({ 
    [path]: { ...state[path], today: value } 
  })),
  setTomorrow: (value) => set((state: SchedulesStore) => ({ 
    [path]: { ...state[path], tomorrow: value } 
  })),
  setNextIndex: (value) => set((state: SchedulesStore) => ({ 
    [path]: { ...state[path], nextIndex: value } 
  })),
  setSelectedIndex: (value) => set((state: SchedulesStore) => ({ 
    [path]: { ...state[path], selectedIndex: value } 
  })),
  setMeasurements: (value) => set((state: SchedulesStore) => ({ 
    [path]: { ...state[path], measurements: value } 
  })),
  setNextIndexMeasurements: (value) => set((state: SchedulesStore) => ({ 
    [path]: { ...state[path], nextIndexMeasurements: value } 
  })),
});

const useSchedulesStore = create<SchedulesStore>((set) => ({
  standard: createScheduleStore(set, 'standard'),
  extra: createScheduleStore(set, 'extra')
}));

const useOverlayStore = create<OverlayStore>((set) => ({
  isOverlayOn: false,
  setIsOverlayOn: (value) => set({ isOverlayOn: value }),
}));

const useStore = () => ({
  app: useAppStore(),
  date: useDateStore(),
  preferences: usePreferencesStore(),
  schedules: useSchedulesStore(),
  overlay: useOverlayStore()
});

export default useStore;