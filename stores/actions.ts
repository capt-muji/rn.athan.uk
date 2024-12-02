import { getDefaultStore } from 'jotai/vanilla';

import { handle } from '@/api/client';
import { PRAYER_INDEX_ASR } from '@/shared/constants';
import logger from '@/shared/logger';
import * as PrayerUtils from '@/shared/prayer';
import * as TimeUtils from '@/shared/time';
import { isDecember, getCurrentYear } from '@/shared/time';
import { AlertType, Measurements, PageCoordinates, ScheduleType, DaySelection } from '@/shared/types';
import * as database from '@/stores/database';
import {
  dateAtom,
  overlayAtom,
  alertPreferencesAtom,
  soundPreferencesAtom,
  standardScheduleAtom,
  extraScheduleAtom,
  measurementsAtom,
  fetchedYearsAtom,
} from '@/stores/store';

const store = getDefaultStore();

// --- Getters ---
export const getDate = () => store.get(dateAtom);
export const getOverlay = () => store.get(overlayAtom);
export const getAlertPreferences = () => store.get(alertPreferencesAtom);
export const getSoundPreferences = () => store.get(soundPreferencesAtom);

export const getSchedule = (type: ScheduleType) =>
  type === ScheduleType.Standard ? store.get(standardScheduleAtom) : store.get(extraScheduleAtom);

export const getFetchedYears = () => store.get(fetchedYearsAtom);

// --- Setters ---
export const setDate = () => {
  const schedule = getSchedule(ScheduleType.Standard);

  const currentDate = schedule.today[PRAYER_INDEX_ASR].date;

  store.set(dateAtom, currentDate);
};

export const setMeasurement = (key: keyof Measurements, measurements: PageCoordinates) => {
  const current = store.get(measurementsAtom);
  store.set(measurementsAtom, { ...current, [key]: measurements });
};

// set standard schedule for today and tomorrow
export const setSchedule = (type: ScheduleType) => {
  const schedule = getSchedule(type);

  const today = TimeUtils.createLondonDate();
  const tomorrow = TimeUtils.createLondonDate();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dataToday = database.getByDate(today);
  const dataTomorrow = database.getByDate(tomorrow);

  const scheduleToday = PrayerUtils.createSchedule(dataToday!, type);
  const scheduleTomorrow = PrayerUtils.createSchedule(dataTomorrow!, type);

  const scheduleTodayValues = Object.values(scheduleToday);
  const nextPrayer = scheduleTodayValues.find((prayer) => !TimeUtils.isTimePassed(prayer.time)) || scheduleToday[0];

  const scheduleAtom = type === ScheduleType.Standard ? standardScheduleAtom : extraScheduleAtom;
  store.set(scheduleAtom, {
    ...schedule,
    type,
    today: scheduleToday,
    tomorrow: scheduleTomorrow,
    nextIndex: nextPrayer.index,
  });
};

export const setAlertPreference = (prayerIndex: number, alertType: AlertType) => {
  const alertPreference = getAlertPreferences();

  store.set(alertPreferencesAtom, { ...alertPreference, [prayerIndex]: alertType });
};

export const setSelectedSound = (soundIndex: number) => {
  const soundPreferences = getSoundPreferences();

  store.set(soundPreferencesAtom, { ...soundPreferences, selected: soundIndex });
};

export const setSelectedPrayerIndex = (index: number, scheduleType: ScheduleType) => {
  const overlay = getOverlay();
  store.set(overlayAtom, { ...overlay, selectedPrayerIndex: index, scheduleType });
};

export const shouldFetchNextYear = (): boolean => {
  const fetchedYears = getFetchedYears();
  const nextYear = getCurrentYear() + 1;

  return isDecember() && !fetchedYears[nextYear];
};

export const markYearAsFetched = (year: number) => {
  const fetchedYears = getFetchedYears();
  store.set(fetchedYearsAtom, { ...fetchedYears, [year]: true });
};

// --- Functions ---
export const refresh = async () => {
  const currentDate = getDate();
  const standardSchedule = getSchedule(ScheduleType.Standard);
  const today = TimeUtils.getDateTodayOrTomorrow(DaySelection.Today);
  const isInit = Object.keys(standardSchedule.today).length === 1;
  const currentYear = getCurrentYear();
  const needsNextYear = shouldFetchNextYear();

  // Skip if data is current and not initialization
  if (currentDate === today && !isInit && !needsNextYear) return logger.info('Data already up to date');

  try {
    // Fetch and save current year data
    const currentYearData = await handle(currentYear);
    database.saveAll(currentYearData);
    markYearAsFetched(currentYear);

    // Fetch and save next year data if needed
    if (needsNextYear) {
      const nextYearData = await handle(currentYear + 1);
      database.saveAll(nextYearData);
      markYearAsFetched(currentYear + 1);
    }

    logger.info('Prayer data fetched successfully');

    // Update schedules and date after successful fetch
    setSchedule(ScheduleType.Standard);
    setSchedule(ScheduleType.Extra);
    setDate();
  } catch (error) {
    logger.error({ error }, 'Failed to refresh prayer data');
    throw error;
  }
};

export const incrementNextIndex = (type: ScheduleType) => {
  const isStandard = type === ScheduleType.Standard;
  const schedule = getSchedule(type);

  const isLastPrayer = schedule.nextIndex === Object.keys(schedule.today).length - 1;
  const nextIndex = isLastPrayer ? 0 : schedule.nextIndex + 1;

  const scheduleAtom = isStandard ? standardScheduleAtom : extraScheduleAtom;

  store.set(scheduleAtom, { ...schedule, nextIndex });
};

export const toggleOverlay = () => {
  const overlay = getOverlay();

  store.set(overlayAtom, { ...overlay, isOn: !overlay.isOn });
};
