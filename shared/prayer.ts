import {
  PRAYERS_ENGLISH,
  PRAYERS_ARABIC,
  EXTRAS_ENGLISH,
  EXTRAS_ARABIC,
  TIME_ADJUSTMENTS,
  ANIMATION,
  SCHEDULE_LENGTHS,
} from '@/shared/constants';
import * as TimeUtils from '@/shared/time';
import { ISingleApiResponseTransformed, IScheduleNow, IApiResponse, IApiTimes, ScheduleType } from '@/shared/types';

/**
 * Filters API response data to only include today and future dates
 * @param apiData Raw API response data
 * @returns Filtered API response containing only future dates
 */
export const filterApiData = (apiData: IApiResponse): IApiResponse => {
  const timesFiltered: IApiTimes = {};

  const entries = Object.entries(apiData.times);

  entries.forEach(([date, times]) => {
    if (!TimeUtils.isDateTodayOrFuture(date)) return;
    timesFiltered[date] = times;
  });

  return {
    city: apiData.city,
    times: timesFiltered,
  };
};

/**
 * Transforms API response data into normalized prayer schedule format
 * Adds calculated times for additional prayers and special times
 * @param apiData Filtered API response data
 * @returns Array of transformed prayer schedules
 */
export const transformApiData = (apiData: IApiResponse): ISingleApiResponseTransformed[] => {
  const transformations: ISingleApiResponseTransformed[] = [];

  const entries = Object.entries(apiData.times);

  entries.forEach(([date, times]) => {
    const schedule: ISingleApiResponseTransformed = {
      date,
      fajr: times.fajr,
      sunrise: times.sunrise,
      dhuhr: times.dhuhr,
      asr: times.asr,
      magrib: times.magrib,
      isha: times.isha,
      'last third': TimeUtils.getLastThirdOfNight(times.magrib, times.fajr),
      suhoor: TimeUtils.adjustTime(times.fajr, TIME_ADJUSTMENTS.suhoor),
      duha: TimeUtils.adjustTime(times.sunrise, TIME_ADJUSTMENTS.duha),
      istijaba: TimeUtils.adjustTime(times.magrib, TIME_ADJUSTMENTS.istijaba),
    };

    transformations.push(schedule);
  });

  return transformations;
};

/**
 * Creates structured prayer times from data for a single day
 * Maps prayer times to both English and Arabic names
 * @param prayers Prayer times data for a single day
 * @param type Schedule type (Standard or Extra)
 * @returns Structured prayer schedule with status information
 */
export const createSchedule = (prayers: ISingleApiResponseTransformed, type: ScheduleType): IScheduleNow => {
  const isStandard = type === ScheduleType.Standard;

  let namesEnglish = isStandard ? PRAYERS_ENGLISH : EXTRAS_ENGLISH;
  let namesArabic = isStandard ? PRAYERS_ARABIC : EXTRAS_ARABIC;

  if (!TimeUtils.isFriday()) {
    namesEnglish = namesEnglish.filter((name) => name.toLowerCase() !== 'istijaba');
    namesArabic = namesArabic.filter((name) => name !== 'استجابة');
  }

  const schedule: IScheduleNow = {};

  namesEnglish.forEach((name, index) => {
    const prayerTime = prayers[name.toLowerCase() as keyof ISingleApiResponseTransformed];

    schedule[index] = {
      index,
      type,
      date: prayers.date,
      english: name,
      arabic: namesArabic[index],
      time: prayerTime,
    };
  });

  return schedule;
};

/**
 * Finds the index of the next prayer that hasn't passed yet
 * @param schedule Current prayer schedule
 * @returns Index of the next prayer (or 0 if all passed)
 */
export const findNextPrayerIndex = (schedule: IScheduleNow): number => {
  const prayers = Object.values(schedule);
  const nextPrayer = prayers.find((prayer) => !TimeUtils.isTimePassed(prayer.time)) || prayers[0];
  return nextPrayer.index;
};

// UI Helpers
export const getCascadeDelay = (index: number, type: ScheduleType): number => {
  const isStandard = type === ScheduleType.Standard;
  const length = isStandard ? SCHEDULE_LENGTHS.standard : SCHEDULE_LENGTHS.extra;

  return (length - index) * ANIMATION.cascadeDelay;
};
