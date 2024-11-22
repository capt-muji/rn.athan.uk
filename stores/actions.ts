import { getDefaultStore } from 'jotai/vanilla';
import { dateAtom, scheduleAtom, overlayAtom, alertPreferencesAtom, soundPreferencesAtom, isBackgroundActiveAtom } from './store';
import * as prayerUtils from '@/shared/prayer';
import * as database from '@/stores/database';
import { createLondonDate, isTimePassed } from '@/shared/time';
import { AlertType } from '@/shared/types';

const store = getDefaultStore();

// Getters
export const getDate = () => store.get(dateAtom);
export const getOverlay = () => store.get(overlayAtom);
export const getSchedule = () => store.get(scheduleAtom);
export const getActiveBackground = () => store.get(isBackgroundActiveAtom);

// Setters
export const toggleOverlay = () => {
  const overlay = getOverlay();
  store.set(overlayAtom, { ...overlay, isOn: !overlay.isOn });
};

export const setDate = () => {
  const date = getDate();
  const schedule = getSchedule();
  
  const lastPrayerIndex = Object.values(schedule.today).length -1;
  const currentDate = schedule.today[lastPrayerIndex].date;

  store.set(dateAtom, { ...date, current: currentDate });
};

// set standard schedule for today and tomorrow
export const setSchedule = () => {
  const schedule = getSchedule();
  
  const today = createLondonDate();
  const tomorrow = createLondonDate();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dataToday = database.getByDate(today);
  const dataTomorrow = database.getByDate(tomorrow);
  
  const scheduleToday = prayerUtils.createSchedule(dataToday!);
  const scheduleTomorrow = prayerUtils.createSchedule(dataTomorrow!);
  
  const scheduleTodayValues = Object.values(scheduleToday);
  let nextPrayer;

  nextPrayer = scheduleTodayValues.find(prayer => !isTimePassed(prayer.time)) || scheduleToday[0];

  store.set(scheduleAtom, { 
    ...schedule, 
    today: scheduleToday,
    tomorrow: scheduleTomorrow,
    nextIndex: nextPrayer.index,
  });
};

export const incrementNextIndex = () => {
  const schedule = getSchedule();
  
  const todayPrayers = Object.values(schedule.today);
  const isIshaFinished = schedule.nextIndex === todayPrayers.length - 2;
  const nextIndex = isIshaFinished ? 0 : schedule.nextIndex + 1;
  
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