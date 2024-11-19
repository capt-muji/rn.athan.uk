import { atom, getDefaultStore } from 'jotai/vanilla';
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
  OverlayStore,
  DaySelection,
  ScheduleType
} from '@/shared/types';
import * as prayerUtils from '@/shared/prayer';
import * as Data from '@/mocks/data_simple';
import * as database from '@/stores/database';

const store = getDefaultStore();

// Getters
export const getSchedule = (type: ScheduleType) => 
  type === ScheduleType.Standard 
    ? store.get(standardScheduleAtom) 
    : store.get(extraScheduleAtom);

export const getOverlay = () => store.get(overlayAtom);

// Setters
export const toggleOverlay = () => {
  const overlay = getOverlay();
  store.set(overlayAtom, { ...overlay, isOn: !overlay.isOn });
};

// set standard schedule for today and tomorrow
export const setSchedule = (type: ScheduleType) => {
  const currentSchedule = getSchedule(type);
  
  const dataToday = database.getTodayOrTomorrow(DaySelection.Today);
  const dataTomorrow = database.getTodayOrTomorrow(DaySelection.Tomorrow);
  
  const scheduleToday = prayerUtils.createSchedule(dataToday!, ScheduleType.Standard);
  const scheduleTomorrow = prayerUtils.createSchedule(dataTomorrow!, ScheduleType.Standard);
  
  const scheduleTodayValues = Object.values(scheduleToday);
  const nextPrayer = scheduleTodayValues.find(prayer => !prayer.passed) || scheduleToday[0];
  
  const scheduleAtom = type === ScheduleType.Standard ? standardScheduleAtom : extraScheduleAtom;
  store.set(scheduleAtom, { 
    ...currentSchedule, 
    type: ScheduleType.Standard,  
    today: scheduleToday,
    tomorrow: scheduleTomorrow,
    nextIndex: nextPrayer.index,
  });
};
