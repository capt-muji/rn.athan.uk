import { IApiAllTimes, ISingleScheduleTransformed, ITransformedToday } from '@/types/prayers';
import { ENGLISH, ARABIC } from '../constants';
import { isTimePassed, addMinutes } from './time';

export const transformApiData = (apiData: IApiAllTimes): ISingleScheduleTransformed[] => {
  return Object.entries(apiData.times)
    .filter(([date]) => isDateTodayOrFuture(date))
    .map(([date, times]) => ({
      date,
      fajr: times.fajr,
      sunrise: times.sunrise,
      duha: addMinutes(times.sunrise, 20),
      dhuhr: times.dhuhr,
      asr: times.asr,
      magrib: times.magrib,
      isha: times.isha
    }));
};

export const createTodayStructure = (prayers: ISingleScheduleTransformed): ITransformedToday => {
  return ENGLISH.reduce((acc, name, index) => {
    const prayerTime = prayers[name.toLowerCase()];
    acc[index] = {
      index,
      english: name,
      arabic: ARABIC[index],
      time: prayerTime,
      passed: isTimePassed(prayerTime)
    };
    return acc;
  }, {} as ITransformedToday);
};

const isDateTodayOrFuture = (date: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate >= today;
};
