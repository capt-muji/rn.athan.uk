import { getDefaultStore } from 'jotai/vanilla';
import {
  preferencesAtom,
  appAtom,
  dateAtom,
  standardScheduleAtom,
  extraScheduleAtom,
  overlayAtom
} from './store_jotai';
import {
  Preferences,
  AppStore,
  DateStore,
  ScheduleStore,
  OverlayStore
} from '@/shared/types';

const store = getDefaultStore();

// Getters
export const getPreferences = (): Preferences => store.get(preferencesAtom);
export const getApp = (): AppStore => store.get(appAtom);
export const getDate = (): DateStore => store.get(dateAtom);
export const getStandardSchedule = (): ScheduleStore => store.get(standardScheduleAtom);
export const getExtraSchedule = (): ScheduleStore => store.get(extraScheduleAtom);
export const getOverlay = (): OverlayStore => store.get(overlayAtom);

// Setters
export const setPreferences = (value: Preferences) => store.set(preferencesAtom, value);
export const setApp = (value: AppStore) => store.set(appAtom, value);
export const setDate = (value: DateStore) => store.set(dateAtom, value);
export const setStandardSchedule = (value: ScheduleStore) => store.set(standardScheduleAtom, value);
export const setExtraSchedule = (value: ScheduleStore) => store.set(extraScheduleAtom, value);
export const setOverlay = (value: OverlayStore) => store.set(overlayAtom, value);
