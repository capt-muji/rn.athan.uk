import { getDefaultStore } from 'jotai/vanilla';
import { dateAtom, standardScheduleAtom, extraScheduleAtom, overlayAtom } from './store';
import { ScheduleType } from '@/shared/types';
import * as prayerUtils from '@/shared/prayer';
import * as database from '@/stores/database';
import { createLondonDate, isTimePassed } from '@/shared/time';

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
  const schedule = getSchedule(type);
  
  const today = createLondonDate();
  const tomorrow = createLondonDate();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dataToday = database.getByDate(today);
  const dataTomorrow = database.getByDate(tomorrow);
  
  const scheduleToday = prayerUtils.createSchedule(dataToday!, type);
  const scheduleTomorrow = prayerUtils.createSchedule(dataTomorrow!, type);
  
  const scheduleTodayValues = Object.values(scheduleToday);
  const nextPrayer = scheduleTodayValues.find(prayer => !isTimePassed(prayer.time)) || scheduleToday[0];
  
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
  const schedule = getSchedule(type);
  const scheduleAtom = type === ScheduleType.Standard ? standardScheduleAtom : extraScheduleAtom;
  
  const todayPrayers = Object.values(schedule.today);
  const isLastPrayer = schedule.nextIndex === todayPrayers.length - 1;
  const nextIndex = isLastPrayer ? 0 : schedule.nextIndex + 1;
  
  store.set(scheduleAtom, {  ...schedule, nextIndex });
};