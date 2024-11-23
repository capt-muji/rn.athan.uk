import { getDefaultStore } from 'jotai/vanilla';
import { dateAtom, overlayAtom, alertPreferencesAtom, soundPreferencesAtom, isBackgroundActiveAtom, standardScheduleAtom, extraScheduleAtom } from './store';
import * as prayerUtils from '@/shared/prayer';
import * as database from '@/stores/database';
import { createLondonDate, isTimePassed } from '@/shared/time';
import { AlertType, ScheduleType } from '@/shared/types';
import { PRAYER_INDEX_ISHA } from '@/shared/constants';

const store = getDefaultStore();

// Getters
export const getDate = () => store.get(dateAtom);
export const getOverlay = () => store.get(overlayAtom);

export const getSchedule = (type: ScheduleType) => 
  type === ScheduleType.Standard 
    ? store.get(standardScheduleAtom) 
    : store.get(extraScheduleAtom);
    
export const getActiveBackground = () => store.get(isBackgroundActiveAtom);

// Setters
export const toggleOverlay = () => {
  const overlay = getOverlay();
  store.set(overlayAtom, { ...overlay, isOn: !overlay.isOn });
};

export const setDate = () => {
  const date = getDate();
  const schedule = getSchedule(ScheduleType.Standard);
  
  const currentDate = schedule.today[PRAYER_INDEX_ISHA].date;

  store.set(dateAtom, { ...date, current: currentDate });
};

// set standard schedule for today and tomorrow
export const setSchedule = (type: ScheduleType) => {
  const schedule = getSchedule(type);
  
  const today = createLondonDate();
  const tomorrow = createLondonDate();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dataToday = database.getByDate(today);
  const dataTomorrow = database.getByDate(tomorrow);
  
  const scheduleToday = prayerUtils.createSchedule(dataToday!, type);
  const scheduleTomorrow = prayerUtils.createSchedule(dataTomorrow!, type);
  
  const scheduleTodayValues = Object.values(scheduleToday);
  let nextPrayer;

  nextPrayer = scheduleTodayValues.find(prayer => !isTimePassed(prayer.time)) || scheduleToday[0];

  const scheduleAtom = type === ScheduleType.Standard ? standardScheduleAtom : extraScheduleAtom;
  store.set(scheduleAtom, { 
    ...schedule, 
    type,
    today: scheduleToday,
    tomorrow: scheduleTomorrow,
    nextIndex: nextPrayer.index,
  });
};

export const incrementNextIndex = (type: ScheduleType) => {
  const isStandard = type === ScheduleType.Standard;
  const schedule = getSchedule(type);
  
  const isLastPrayer = schedule.nextIndex === Object.keys(schedule.today).length - 1;
  const nextIndex = isLastPrayer ? 0 : schedule.nextIndex + 1;

  console.log('EEEEEE');
  console.log(isLastPrayer);
  console.log(nextIndex);
  console.log('OOOO');
  
  const scheduleAtom = isStandard ? standardScheduleAtom : extraScheduleAtom;
  store.set(scheduleAtom, {  ...schedule, nextIndex });
};

// Alert Preferences
export const getAlertPreferences = () => store.get(alertPreferencesAtom);

export const setAlertPreference = (prayerIndex: number, alertType: AlertType) => {
  const current = getAlertPreferences();

  store.set(alertPreferencesAtom, {
    ...current,
    [prayerIndex]: alertType
  });
};

// Sound Preferences
export const getSoundPreferences = () => store.get(soundPreferencesAtom);

export const setSelectedSound = (soundIndex: number) => {
  if (soundIndex < 1 || soundIndex > 10) return;
  const current = getSoundPreferences();
  store.set(soundPreferencesAtom, {
    ...current,
    selected: soundIndex
  });
};

export const toggleActiveBackground = () => {
  const isActive = getActiveBackground();
  store.set(isBackgroundActiveAtom, !isActive);
};