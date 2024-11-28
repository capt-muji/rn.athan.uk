import {
  PRAYERS_ENGLISH,
  PRAYERS_ARABIC,
  ANIMATION,
  PRAYERS_LENGTH_FAJR_TO_ISHA,
  EXTRAS_ENGLISH,
  EXTRAS_ARABIC,
} from '@/shared/constants';
import * as TimeUtils from '@/shared/time';
import { ISingleApiResponseTransformed, IScheduleNow, IApiResponse, IApiTimes, ScheduleType } from '@/shared/types';

/**
 * Filters API response data to only include today and future dates
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
 * Transforms API response data into normalized prayer schedule format and adds calculated Duha time.
 */
export const transformApiData = (apiData: IApiResponse): ISingleApiResponseTransformed[] => {
  const transformations: ISingleApiResponseTransformed[] = [];

  const entries = Object.entries(apiData.times);

  entries.forEach(([date, times]) => {
    const schedule: ISingleApiResponseTransformed = {
      date,
      'last third': TimeUtils.getLastThirdOfNight(times.magrib, times.fajr),
      suhoor: TimeUtils.getSuhoor(times.fajr),
      fajr: times.fajr,
      sunrise: times.sunrise,
      duha: TimeUtils.addMinutes(times.sunrise, 1),
      dhuhr: times.dhuhr,
      asr: times.asr,
      istijaba: TimeUtils.getIstijaba(times.magrib),
      magrib: times.magrib,
      isha: times.isha,
    };

    transformations.push(schedule);
  });

  return transformations;
};

/**
 * Creates structured prayer times object for today with status information. Maps prayer times to both English and Arabic names.
 */
export const createSchedule = (prayers: ISingleApiResponseTransformed, type: ScheduleType): IScheduleNow => {
  const isStandard = type === ScheduleType.Standard;
  const shouldRemoveIstijaba = !isStandard && TimeUtils.isFriday();

  let namesEnglish = isStandard ? PRAYERS_ENGLISH : EXTRAS_ENGLISH;
  let namesArabic = isStandard ? PRAYERS_ARABIC : EXTRAS_ARABIC;

  if (shouldRemoveIstijaba) {
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

// UI Helpers
export const getCascadeDelay = (index: number) => {
  const delay = ANIMATION.cascadeDelay;
  return (PRAYERS_LENGTH_FAJR_TO_ISHA - index) * delay;
};
