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
import { createLondonDate } from '@/shared/time';

const store = getDefaultStore();

// Getters
export const getSchedule = (type: ScheduleType) => 
  type === ScheduleType.Standard 
    ? store.get(standardScheduleAtom) 
    : store.get(extraScheduleAtom);

export const getDate = () => store.get(dateAtom);
export const getOverlay = () => store.get(overlayAtom);

// Setters
export const toggleOverlay = () => {
  const overlay = getOverlay();
  store.set(overlayAtom, { ...overlay, isOn: !overlay.isOn });
};

export const setDate = () => {
  const date = getDate();
  const schedule = getSchedule(ScheduleType.Standard);
  
  const lastPrayerIndex = Object.values(schedule.today).length -1;
  const currentDate = schedule.today[lastPrayerIndex].date;

  store.set(dateAtom, { ...date, current: currentDate });
};

// set standard schedule for today and tomorrow
export const setSchedule = (type: ScheduleType) => {
  const currentSchedule = getSchedule(type);
  
  const today = createLondonDate();
  const tomorrow = createLondonDate();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dataToday = database.getByDate(today);
  const dataTomorrow = database.getByDate(tomorrow);
  
  const scheduleToday = prayerUtils.createSchedule(dataToday!, type);
  const scheduleTomorrow = prayerUtils.createSchedule(dataTomorrow!, type);
  
  const scheduleTodayValues = Object.values(scheduleToday);
  const nextPrayer = scheduleTodayValues.find(prayer => !prayer.passed) || scheduleToday[0];
  
  const scheduleAtom = type === ScheduleType.Standard ? standardScheduleAtom : extraScheduleAtom;
  store.set(scheduleAtom, { 
    ...currentSchedule, 
    type,
    today: scheduleToday,
    tomorrow: scheduleTomorrow,
    nextIndex: nextPrayer.index,
  });
};

// TODO: remove ui measurements from schedule
export const setUIMeasurements = () => {

};