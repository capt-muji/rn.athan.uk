import { getDefaultStore } from 'jotai/vanilla';
import { dateAtom, scheduleAtom, overlayAtom } from './store';
import * as prayerUtils from '@/shared/prayer';
import * as database from '@/stores/database';
import { createLondonDate, isTimePassed } from '@/shared/time';

const store = getDefaultStore();

// Getters
export const getDate = () => store.get(dateAtom);
export const getOverlay = () => store.get(overlayAtom);
export const getSchedule = () => store.get(scheduleAtom);

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
  const isLastPrayer = schedule.nextIndex === todayPrayers.length - 1;
  const nextIndex = isLastPrayer ? 0 : schedule.nextIndex + 1;
  
  store.set(scheduleAtom, {  ...schedule, nextIndex });
};