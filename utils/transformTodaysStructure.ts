import { ISingleScheduleTransformed } from '../types/prayers';
import { ENGLISH, ARABIC } from '../constants';
import { ITransformedToday } from '../types/prayers';

const hasTimePassed = (prayerTime: string): boolean => {
  const now = new Date();
  const [hours, minutes] = prayerTime.split(':').map(Number);
  const prayerDate = new Date();
  prayerDate.setHours(hours, minutes, 0);
  
  return now > prayerDate;
};

export const transformTodaysStructure = (day: ISingleScheduleTransformed): ITransformedToday => {
  const transformedDay: ITransformedToday = {};

  ENGLISH.forEach((name, index) => {
    const prayerName = name.toLowerCase() as keyof ISingleScheduleTransformed;
    const time = day[prayerName];
    const passed = hasTimePassed(time);

    transformedDay[index.toString()] = {
      index,
      english: name,
      arabic: ARABIC[index],
      time,
      passed,
    };
  });

  return transformedDay;
};