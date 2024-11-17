import { ISingleApiResponseTransformed, IScheduleNow, IApiResponse, IApiTimes } from '@/shared/types';
import { PRAYERS_ENGLISH, PRAYERS_ARABIC } from '@/shared/constants';
import { isDateTodayOrFuture, getLastThirdOfNight, isTimePassed, addMinutes } from '@/shared/time';

/**
 * Filters API response data to only include today and future dates
 */
export const filterApiData = (apiData: IApiResponse): IApiResponse => {
  const timesFiltered: IApiTimes = {};

  const entries = Object.entries(apiData.times);

  entries.forEach(([date, times]) => {
    if (!isDateTodayOrFuture(date)) return;
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
      duha: addMinutes(times.sunrise, 1),
      dhuhr: times.dhuhr,
      asr: times.asr,
      magrib: times.magrib,
      isha: times.isha,
      "last third": getLastThirdOfNight(times.magrib, times.fajr),
    };

    transformations.push(schedule);
  });

  return transformations;
};

/**
 * Creates structured prayer times object for today with status information. Maps prayer times to both English and Arabic names.
 */
export const createSchedule = (prayers: ISingleApiResponseTransformed): IScheduleNow => {
  const schedule: IScheduleNow = {};

  PRAYERS_ENGLISH.forEach((name, index) => {
    const prayerTime = prayers[name.toLowerCase() as keyof ISingleApiResponseTransformed];

    schedule[index] = {
      index,
      date: prayers.date,
      english: name,
      arabic: PRAYERS_ARABIC[index],
      time: prayerTime,
      passed: isTimePassed(prayerTime),
      isNext: false
    };
  });

  console.log('11111');
  console.log(schedule);

  return schedule;
};
