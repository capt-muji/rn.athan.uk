import { ISingleApiResponseTransformed, IScheduleNow, IApiResponse, IApiTimes, ScheduleType, ScheduleStore } from '@/shared/types';
import { PRAYERS_ENGLISH, PRAYERS_ARABIC, ANIMATION, PRAYERS_LENGTH_FAJR_TO_ISHA, EXTRAS_ENGLISH, EXTRAS_ARABIC } from '@/shared/constants';
import * as timeUtils from '@/shared/time';

/**
 * Filters API response data to only include today and future dates
 */
export const filterApiData = (apiData: IApiResponse): IApiResponse => {
  const timesFiltered: IApiTimes = {};

  const entries = Object.entries(apiData.times);

  entries.forEach(([date, times]) => {
    if (!timeUtils.isDateTodayOrFuture(date)) return;
    timesFiltered[date] = times;
  });

  return {
    city: apiData.city,
    times: timesFiltered
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
      fajr: times.fajr,
      sunrise: times.sunrise,
      duha: timeUtils.addMinutes(times.sunrise, 1),
      dhuhr: times.dhuhr,
      asr: times.asr,
      "istijaba": timeUtils.getIstijaba(times.magrib),
      magrib: times.magrib,
      isha: times.isha,
      "last third": timeUtils.getLastThirdOfNight(times.magrib, times.fajr),
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
  const shouldRemoveIstijaba = !isStandard && timeUtils.isFriday();

  let namesEnglish = isStandard ? PRAYERS_ENGLISH : EXTRAS_ENGLISH;
  let namesArabic = isStandard ? PRAYERS_ARABIC : EXTRAS_ARABIC;

  if (shouldRemoveIstijaba) {
    namesEnglish = namesEnglish.filter(name => name.toLowerCase() !== 'istijaba');
    namesArabic = namesArabic.filter(name => name !== 'استجابة');
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
      time: prayerTime
    };
  });

  return schedule;
};

// Checks if all prayers for the day have passed by checking the last prayer time
export const isLastPrayerPassed = (schedule: ScheduleStore): boolean => {
  const lastIndex = Object.keys(schedule.today).length - 1;
  const lastPrayer = schedule.today[lastIndex];
  return timeUtils.isTimePassed(lastPrayer.time);
};

// UI Helpers
export const getCascadeDelay = (index: number) => {
  const delay = ANIMATION.cascadeDelay;
  return (PRAYERS_LENGTH_FAJR_TO_ISHA - index) * delay;
};